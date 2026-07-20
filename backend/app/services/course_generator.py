import logging
import json
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.uploaded_pdf import UploadedPDF, PDFStatus
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.enums import DifficultyLevel
from app.auth.supabase_client import supabase
from app.core.config import settings
from app.utils.pdf_parser import extract_text
from app.utils.groq_client import generate_course_json, validate_course_json

logger = logging.getLogger(__name__)

def generate_course_task(pdf_id: str, title: str, difficulty: str):
    """Background task to run the complete AI course generation pipeline."""
    db = SessionLocal()
    pdf = db.query(UploadedPDF).filter(UploadedPDF.id == pdf_id).first()
    
    if not pdf:
        logger.error(f"PDF record with id {pdf_id} not found.")
        db.close()
        return

    try:
        # 1. Update status to PROCESSING
        pdf.status = PDFStatus.processing
        pdf.error_message = None
        db.commit()
        db.refresh(pdf)
        logger.info(f"Starting course generation for PDF {pdf.id} ({pdf.filename})")

        # 2. Retrieve PDF from Supabase Storage
        try:
            pdf_bytes = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(pdf.storage_path)
        except Exception as se:
            logger.error(f"Failed to download PDF from storage: {se}")
            raise ValueError(f"Storage download failed: {se}")

        # 3. Extract text
        text_content = extract_text(pdf_bytes)
        logger.info(f"Extracted {len(text_content)} characters of text from PDF {pdf.id}")

        # 4. Generate Course JSON using Groq (with 1 retry on validation failure)
        course_data = None
        error_to_retry = None
        for attempt in [1, 2]:
            try:
                logger.info(f"Groq generation attempt {attempt} for PDF {pdf.id}")
                course_data = generate_course_json(
                    title=title or pdf.filename,
                    difficulty=difficulty,
                    text_content=text_content,
                    retry_error=error_to_retry
                )
                if validate_course_json(course_data):
                    break
                else:
                    raise ValueError("Course JSON structure validation failed")
            except Exception as ge:
                logger.warning(f"Groq attempt {attempt} failed: {ge}")
                error_to_retry = str(ge)
                if attempt == 2:
                    raise ge

        if not course_data:
            raise ValueError("Groq returned empty course structure")

        # 5. Database Persistence (Course, Chapters, Lessons inside a transaction)
        # Parse difficulty enum safely
        diff_str = course_data.get("difficulty", difficulty).lower()
        try:
            difficulty_enum = DifficultyLevel(diff_str)
        except ValueError:
            difficulty_enum = DifficultyLevel.beginner

        # Create Course
        new_course = Course(
            user_id=pdf.user_id,
            uploaded_pdf_id=pdf.id,
            title=course_data.get("title", title or pdf.filename),
            description=course_data.get("description", ""),
            estimated_time_minutes=int(course_data.get("estimated_time_minutes", 120)),
            difficulty=difficulty_enum,
            learning_objectives=json_to_text(course_data.get("learning_objectives", []))
        )
        db.add(new_course)
        db.flush() # Flush to get new_course.id

        # Create Chapters and Lessons
        for ch_idx, ch_data in enumerate(course_data.get("chapters", [])):
            new_chapter = Chapter(
                course_id=new_course.id,
                title=ch_data.get("title", f"Chapter {ch_idx + 1}"),
                order_index=int(ch_data.get("order_index", ch_idx + 1))
            )
            db.add(new_chapter)
            db.flush() # Flush to get new_chapter.id

            for les_idx, les_data in enumerate(ch_data.get("lessons", [])):
                new_lesson = Lesson(
                    chapter_id=new_chapter.id,
                    title=les_data.get("title", f"Lesson {les_idx + 1}"),
                    content=les_data.get("content", ""),
                    order_index=int(les_data.get("order_index", les_idx + 1)),
                    # Storing learning outcomes (no explicit column, we can prepend to content or if exists in schema)
                    # Wait, let's verify if lesson model has learning_outcome? No, we saw lesson has:
                    # id, chapter_id, title, content, order_index.
                    # We can store learning outcome at the start or end of the markdown content!
                )
                
                # Append learning outcome to content in markdown to preserve the outcome
                outcome = les_data.get("learning_outcome")
                if outcome:
                    new_lesson.content = f"{new_lesson.content}\n\n---\n*Learning Outcome: {outcome}*"
                
                db.add(new_lesson)

        # 6. Mark PDF as COMPLETED
        pdf.status = PDFStatus.completed
        db.commit()
        logger.info(f"Course successfully generated and saved for PDF {pdf.id}")

    except Exception as e:
        db.rollback()
        logger.error(f"Course generation pipeline failed for PDF {pdf.id}: {e}")
        # Save error message and set status to FAILED
        pdf.status = PDFStatus.failed
        pdf.error_message = str(e)
        try:
            db.commit()
        except Exception as commit_err:
            logger.error(f"Failed to save failure status for PDF {pdf.id}: {commit_err}")
    finally:
        db.close()

def json_to_text(obj) -> str:
    """Helper to convert list or dict structures to standard strings for schema compat."""
    if isinstance(obj, list):
        return "\n".join([f"- {item}" for item in obj])
    elif isinstance(obj, dict):
        return json.dumps(obj)
    return str(obj)
