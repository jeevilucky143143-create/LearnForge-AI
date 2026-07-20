import json
import logging
import uuid
import httpx
from datetime import datetime
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion, QuizQuestionType
from app.models.quiz_attempt import QuizAttempt, QuizStatus
from app.models.quiz_attempt_answer import QuizAttemptAnswer
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quizzes", tags=["quizzes"])

# Prompts
QUIZ_SYSTEM_PROMPT = """You are an expert educator. Your task is to generate a high-quality quiz (multiple choice, true/false, or fill-in-the-blank questions) based ONLY on the provided text.

You must output a single valid JSON object matching this schema:
{
  "title": "Quiz Title (descriptive based on content scope)",
  "questions": [
    {
      "question": "Clear and concise question text",
      "type": "mcq", // must be exactly one of: "mcq", "true_false", "fill_blank"
      "options": ["Option A", "Option B", "Option C", "Option D"], // Required for "mcq", must be null/empty for others. Provide exactly 4 options.
      "answer": "The exact string representing the correct option (e.g. 'Option A') or 'True'/'False' or the exact fill-in-the-blank word",
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "medium", // beginner, intermediate, advanced
      "lesson_title": "Title of the specific lesson this concept belongs to"
    }
  ]
}

Constraints:
1. Generate exactly the requested number of questions.
2. For "mcq", provide exactly 4 distinct and plausible options.
3. For "true_false", the correct answer must be exactly "True" or "False".
4. For "fill_blank", make sure the question has a single blank indicated by "___" and the correct answer is a single word or short phrase.
5. Ensure questions test comprehension, not simple rote memory.
6. Return ONLY the raw JSON object. Do not wrap in markdown blocks (e.g. do not use ```json ... ```).
"""

# Pydantic models for API
class QuizGenerateIn(BaseModel):
    course_id: UUID
    chapter_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    num_questions: int # 5, 10, 20

class QuestionPlayOut(BaseModel):
    id: UUID
    question_text: str
    question_type: str
    options: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class QuizPlayOut(BaseModel):
    id: UUID
    title: str
    questions: List[QuestionPlayOut]

    model_config = ConfigDict(from_attributes=True)

class UserAnswerIn(BaseModel):
    question_id: UUID
    selected_answer: Optional[str] = None

class QuizSubmitIn(BaseModel):
    answers: List[UserAnswerIn]
    duration_seconds: int

class QuestionReviewOut(BaseModel):
    id: UUID
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    selected_answer: Optional[str]
    is_correct: bool
    explanation: Optional[str]
    difficulty: Optional[str]
    lesson_title: Optional[str] = None

class QuizResultOut(BaseModel):
    id: UUID
    quiz_id: UUID
    score: int
    total_questions: int
    percentage: float
    duration_seconds: int
    completed_at: datetime
    questions: List[QuestionReviewOut]

class AttemptListOut(BaseModel):
    id: UUID
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# AI generator helpers
def fetch_source_text(db: Session, course_id: UUID, chapter_id: Optional[UUID], lesson_id: Optional[UUID]) -> tuple[str, str]:
    """Helper to retrieve and compile lesson texts based on scope."""
    if lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found.")
        return lesson.content or "", f"Lesson Quiz: {lesson.title}"
    elif chapter_id:
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found.")
        lessons = db.query(Lesson).filter(Lesson.chapter_id == chapter_id).order_by(Lesson.order_index.asc()).all()
        text = "\n\n".join([l.content for l in lessons if l.content])
        return text, f"Chapter Quiz: {chapter.title}"
    else:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found.")
        lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course_id).order_by(Chapter.order_index.asc(), Lesson.order_index.asc()).all()
        text = "\n\n".join([l.content for l in lessons if l.content])
        return text, f"Course Quiz: {course.title}"


def call_groq_quiz(text: str, num_questions: int, retry_error: str = None) -> dict:
    """Invokes Groq API to generate raw JSON questions list."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured.")

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    user_prompt = f"Please generate exactly {num_questions} questions based on this text:\n\n{text[:60000]}"
    if retry_error:
        user_prompt += f"\n\nIMPORTANT: The previous output failed validation: '{retry_error}'. Please output valid JSON matching the schema precisely without syntax errors."

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.4
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)


def validate_quiz_json(quiz_data: dict, num_questions: int) -> bool:
    """Validate that the quiz JSON contains all required fields and correct structure."""
    if "questions" not in quiz_data or not isinstance(quiz_data["questions"], list):
        return False
    # Relax size validation slightly in case LLM generates ±1, but try to enforce requested size
    if len(quiz_data["questions"]) == 0:
        return False
    for q in quiz_data["questions"]:
        if not isinstance(q, dict):
            return False
        required = ["question", "type", "answer", "explanation"]
        for r in required:
            if r not in q or q[r] is None:
                return False
        if q["type"] not in ["mcq", "true_false", "fill_blank"]:
            return False
        if q["type"] == "mcq":
            if "options" not in q or not isinstance(q["options"], list) or len(q["options"]) != 4:
                return False
    return True


# Router endpoints
@router.post("/generate", response_model=QuizPlayOut)
def generate_quiz(
    quiz_in: QuizGenerateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a quiz dynamically based on course content using Groq."""
    # Verify course ownership
    course = db.query(Course).filter(Course.id == quiz_in.course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or permission denied.")

    if quiz_in.num_questions not in [5, 10, 20]:
        raise HTTPException(status_code=400, detail="Quiz size must be 5, 10, or 20 questions.")

    # 1. Fetch text content based on scope
    source_text, default_title = fetch_source_text(db, quiz_in.course_id, quiz_in.chapter_id, quiz_in.lesson_id)
    if not source_text.strip():
        raise HTTPException(status_code=400, detail="The selected syllabus scope contains no lesson text to generate questions from.")

    # 2. Call Groq with 1 retry
    quiz_data = None
    error_msg = None
    for attempt in [1, 2]:
        try:
            quiz_data = call_groq_quiz(source_text, quiz_in.num_questions, error_msg)
            if validate_quiz_json(quiz_data, quiz_in.num_questions):
                break
            else:
                raise ValueError("JSON failed structure validation checks.")
        except Exception as e:
            error_msg = str(e)
            if attempt == 2:
                raise HTTPException(status_code=500, detail=f"AI Quiz Generation failed: {e}")

    # 3. Store Quiz template in DB
    try:
        new_quiz = Quiz(
            id=uuid.uuid4(),
            course_id=quiz_in.course_id,
            chapter_id=quiz_in.chapter_id,
            lesson_id=quiz_in.lesson_id,
            title=quiz_data.get("title", default_title)
        )
        db.add(new_quiz)
        db.flush()

        # Insert Questions
        for i, q in enumerate(quiz_data["questions"]):
            # Resolve optional lesson reference
            lesson_ref_id = None
            if quiz_in.lesson_id:
                lesson_ref_id = quiz_in.lesson_id
            else:
                # Attempt to match lesson by title in course
                lesson_title = q.get("lesson_title")
                if lesson_title:
                    matched_lesson = db.query(Lesson).join(Chapter).filter(
                        Chapter.course_id == quiz_in.course_id,
                        func.lower(Lesson.title) == func.lower(lesson_title)
                    ).first()
                    if matched_lesson:
                        lesson_ref_id = matched_lesson.id

            options_str = json.dumps(q.get("options")) if q.get("options") else None
            
            question_type_enum = QuizQuestionType.mcq
            if q["type"] == "true_false":
                question_type_enum = QuizQuestionType.true_false
            elif q["type"] == "fill_blank":
                question_type_enum = QuizQuestionType.short_answer

            new_q = QuizQuestion(
                id=uuid.uuid4(),
                quiz_id=new_quiz.id,
                lesson_id=lesson_ref_id,
                question_text=q["question"],
                question_type=question_type_enum,
                options=options_str,
                correct_answer=str(q["answer"]),
                explanation=q["explanation"],
                difficulty=q.get("difficulty", "medium"),
                order_index=i + 1
            )
            db.add(new_q)
        
        db.commit()
        db.refresh(new_quiz)

    except Exception as dbe:
        db.rollback()
        logger.error(f"Failed to save quiz template: {dbe}")
        raise HTTPException(status_code=500, detail="Database write failure. Quiz discarded.")

    # 4. Map questions hiding correct answers
    play_questions = []
    for q in new_quiz.questions:
        opts = json.loads(q.options) if q.options else None
        play_questions.append(QuestionPlayOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=opts
        ))

    return QuizPlayOut(
        id=new_quiz.id,
        title=new_quiz.title,
        questions=play_questions
    )


@router.post("/{quiz_id}/attempts", status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(
    quiz_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an active quiz attempt for the user."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    # Verify course ownership
    course = db.query(Course).filter(Course.id == quiz.course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this quiz.")

    attempt = QuizAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        quiz_id=quiz.id,
        status=QuizStatus.in_progress,
        score=0,
        percentage=0.0
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": str(attempt.id),
        "status": attempt.status.value
    }


@router.get("/attempts/{attempt_id}/play", response_model=QuizPlayOut)
def get_attempt_play_questions(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the play questions (excluding correct answers) for an active attempt."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found.")

    if attempt.status != QuizStatus.in_progress:
        raise HTTPException(status_code=400, detail="This quiz attempt is already completed.")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    play_questions = []
    for q in quiz.questions:
        opts = json.loads(q.options) if q.options else None
        play_questions.append(QuestionPlayOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=opts
        ))

    return QuizPlayOut(
        id=quiz.id,
        title=quiz.title,
        questions=play_questions
    )


@router.post("/attempts/{attempt_id}/submit", response_model=QuizResultOut)
def submit_quiz_attempt(
    attempt_id: UUID,
    submission: QuizSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit selected answers for a quiz attempt, evaluate them, and release the answers."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found.")

    if attempt.status == QuizStatus.completed:
        raise HTTPException(status_code=400, detail="This quiz attempt has already been submitted.")

    # Load quiz questions
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == attempt.quiz_id).all()
    q_map = {q.id: q for q in questions}

    # Map user answers
    ans_map = {ans.question_id: ans.selected_answer for ans in submission.answers}

    correct_count = 0
    answer_rows = []

    for q_id, q in q_map.items():
        user_ans_str = ans_map.get(q_id)
        
        # Check correctness
        is_correct = False
        if user_ans_str:
            cleaned_user = user_ans_str.strip().lower()
            cleaned_correct = q.correct_answer.strip().lower()
            if cleaned_user == cleaned_correct:
                is_correct = True
        
        if is_correct:
            correct_count += 1

        new_ans = QuizAttemptAnswer(
            id=uuid.uuid4(),
            attempt_id=attempt.id,
            question_id=q.id,
            selected_answer=user_ans_str,
            is_correct=is_correct
        )
        db.add(new_ans)
        answer_rows.append(new_ans)

    total_questions = len(questions)
    percentage = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0

    # Update attempt properties
    attempt.status = QuizStatus.completed
    attempt.score = correct_count
    attempt.percentage = percentage
    attempt.completed_at = datetime.utcnow()
    attempt.duration = submission.duration_seconds

    try:
        db.commit()
        db.refresh(attempt)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to submit attempt: {e}")
        raise HTTPException(status_code=500, detail="Database write error.")

    # Format detailed review output
    review_questions = []
    # Build a dictionary to lookup stored answer states
    ans_row_map = {ar.question_id: ar for ar in answer_rows}
    
    for q in questions:
        ans_row = ans_row_map.get(q.id)
        opts = json.loads(q.options) if q.options else None
        
        # Try to resolve lesson title
        les_title = None
        if q.lesson_id:
            les = db.query(Lesson).filter(Lesson.id == q.lesson_id).first()
            les_title = les.title if les else None

        review_questions.append(QuestionReviewOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=opts,
            correct_answer=q.correct_answer,
            selected_answer=ans_row.selected_answer if ans_row else None,
            is_correct=ans_row.is_correct if ans_row else False,
            explanation=q.explanation,
            difficulty=q.difficulty,
            lesson_title=les_title
        ))

    return QuizResultOut(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        total_questions=total_questions,
        percentage=attempt.percentage,
        duration_seconds=attempt.duration or 0,
        completed_at=attempt.completed_at,
        questions=review_questions
    )


@router.get("/attempts/{attempt_id}", response_model=QuizResultOut)
def get_attempt_details(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a past completed quiz attempt including correct answers."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found.")

    if attempt.status != QuizStatus.completed:
        raise HTTPException(status_code=400, detail="This quiz attempt is still in progress.")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == attempt.quiz_id).order_by(QuizQuestion.order_index.asc()).all()
    user_answers = db.query(QuizAttemptAnswer).filter(QuizAttemptAnswer.attempt_id == attempt.id).all()
    ans_map = {ua.question_id: ua for ua in user_answers}

    review_questions = []
    for q in questions:
        ans_row = ans_map.get(q.id)
        opts = json.loads(q.options) if q.options else None
        
        les_title = None
        if q.lesson_id:
            les = db.query(Lesson).filter(Lesson.id == q.lesson_id).first()
            les_title = les.title if les else None

        review_questions.append(QuestionReviewOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=opts,
            correct_answer=q.correct_answer,
            selected_answer=ans_row.selected_answer if ans_row else None,
            is_correct=ans_row.is_correct if ans_row else False,
            explanation=q.explanation,
            difficulty=q.difficulty,
            lesson_title=les_title
        ))

    return QuizResultOut(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score or 0,
        total_questions=len(questions),
        percentage=attempt.percentage or 0.0,
        duration_seconds=attempt.duration or 0,
        completed_at=attempt.completed_at,
        questions=review_questions
    )


@router.get("/courses/{course_id}", response_model=List[AttemptListOut])
def get_course_attempts(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve history of all completed quiz attempts for a course."""
    # Verify course ownership
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    attempts = db.query(QuizAttempt).join(Quiz).filter(
        Quiz.course_id == course_id,
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == QuizStatus.completed
    ).order_by(QuizAttempt.completed_at.desc()).all()

    result = []
    for att in attempts:
        # Count total questions in quiz
        total_q = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == att.quiz_id).count()
        result.append(AttemptListOut(
            id=att.id,
            quiz_title=att.quiz.title,
            score=att.score or 0,
            total_questions=total_q,
            percentage=att.percentage or 0.0,
            completed_at=att.completed_at
        ))
    return result
