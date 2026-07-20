from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.learning_progress import LearningProgress

router = APIRouter(prefix="/courses", tags=["courses"])

# Pydantic Schemas
class LessonOut(BaseModel):
    id: UUID
    title: str
    order_index: int
    completed: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class ChapterOut(BaseModel):
    id: UUID
    title: str
    order_index: int
    lessons: List[LessonOut]

    model_config = ConfigDict(from_attributes=True)

class CourseListOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    difficulty: str
    estimated_time_minutes: int
    total_chapters: int
    total_lessons: int
    completed_lessons: int
    progress_percentage: int

    model_config = ConfigDict(from_attributes=True)

class CourseDetailOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    difficulty: str
    estimated_time_minutes: int
    learning_objectives: Optional[str]
    progress_percentage: int
    resume_lesson_id: Optional[UUID]
    chapters: List[ChapterOut]

    model_config = ConfigDict(from_attributes=True)

class LessonDetailOut(BaseModel):
    id: UUID
    chapter_id: UUID
    course_id: UUID
    title: str
    content: Optional[str]
    order_index: int
    completed: bool
    last_opened_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class ProgressUpdateIn(BaseModel):
    completed: bool

class ProgressOut(BaseModel):
    lesson_id: UUID
    completed: bool
    completed_at: Optional[datetime]
    last_opened_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# Endpoints
@router.get("", response_model=List[CourseListOut])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all courses generated for/by the current user with learning progress."""
    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.created_at.desc()).all()
    
    result = []
    for course in courses:
        # Calculate stats
        lessons_in_course = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).all()
        total_lessons = len(lessons_in_course)
        
        lesson_ids = [l.id for l in lessons_in_course]
        completed_lessons = 0
        if lesson_ids:
            completed_lessons = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(lesson_ids),
                LearningProgress.completed == True
            ).count()

        progress_percentage = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        total_chapters = db.query(Chapter).filter(Chapter.course_id == course.id).count()

        result.append(CourseListOut(
            id=course.id,
            title=course.title,
            description=course.description,
            difficulty=course.difficulty.value,
            estimated_time_minutes=course.estimated_time_minutes or 0,
            total_chapters=total_chapters,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            progress_percentage=progress_percentage
        ))
        
    return result

@router.get("/{course_id}", response_model=CourseDetailOut)
def get_course_detail(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve course overview details, including chapters, lessons, and completion status."""
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Fetch chapters ordered by index
    chapters = db.query(Chapter).filter(Chapter.course_id == course.id).order_by(Chapter.order_index.asc()).all()
    
    # Fetch all user progress in this course
    lessons_in_course = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).all()
    lesson_ids = [l.id for l in lessons_in_course]
    
    completed_ids = set()
    progress_records = []
    if lesson_ids:
        progress_records = db.query(LearningProgress).filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.lesson_id.in_(lesson_ids)
        ).all()
        completed_ids = {p.lesson_id for p in progress_records if p.completed}

    # Find the last opened lesson to resume learning
    resume_lesson_id = None
    if progress_records:
        # Sort progress records by last_opened_at descending
        opened_records = [p for p in progress_records if p.last_opened_at is not None]
        if opened_records:
            opened_records.sort(key=lambda x: x.last_opened_at, reverse=True)
            resume_lesson_id = opened_records[0].lesson_id
            
    # Default resume_lesson_id to first lesson of first chapter if none opened yet
    if not resume_lesson_id and chapters:
        first_chap = chapters[0]
        first_chap_lessons = db.query(Lesson).filter(Lesson.chapter_id == first_chap.id).order_by(Lesson.order_index.asc()).all()
        if first_chap_lessons:
            resume_lesson_id = first_chap_lessons[0].id

    total_lessons = len(lessons_in_course)
    completed_lessons = len(completed_ids)
    progress_percentage = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    chapters_out = []
    for chap in chapters:
        lessons = db.query(Lesson).filter(Lesson.chapter_id == chap.id).order_by(Lesson.order_index.asc()).all()
        lessons_out = [
            LessonOut(
                id=les.id,
                title=les.title,
                order_index=les.order_index,
                completed=(les.id in completed_ids)
            ) for les in lessons
        ]
        chapters_out.append(ChapterOut(
            id=chap.id,
            title=chap.title,
            order_index=chap.order_index,
            lessons=lessons_out
        ))

    return CourseDetailOut(
        id=course.id,
        title=course.title,
        description=course.description,
        difficulty=course.difficulty.value,
        estimated_time_minutes=course.estimated_time_minutes or 0,
        learning_objectives=course.learning_objectives,
        progress_percentage=progress_percentage,
        resume_lesson_id=resume_lesson_id,
        chapters=chapters_out
    )

@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonDetailOut)
def get_lesson_detail(
    course_id: UUID,
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details for a single lesson and record/update its last_opened_at status."""
    # Verify course ownership
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    lesson = db.query(Lesson).join(Chapter).filter(
        Lesson.id == lesson_id,
        Chapter.id == Lesson.chapter_id,
        Chapter.course_id == course_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    # Record or update progress entry: mark last_opened_at = now
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.lesson_id == lesson.id
    ).first()

    now = datetime.utcnow()
    if not progress:
        progress = LearningProgress(
            user_id=current_user.id,
            lesson_id=lesson.id,
            completed=False,
            last_opened_at=now
        )
        db.add(progress)
    else:
        progress.last_opened_at = now
    db.commit()
    db.refresh(progress)

    return LessonDetailOut(
        id=lesson.id,
        chapter_id=lesson.chapter_id,
        course_id=course_id,
        title=lesson.title,
        content=lesson.content,
        order_index=lesson.order_index,
        completed=progress.completed,
        last_opened_at=progress.last_opened_at,
        completed_at=progress.completed_at
    )

@router.post("/{course_id}/lessons/{lesson_id}/progress", response_model=ProgressOut)
def update_lesson_progress(
    course_id: UUID,
    lesson_id: UUID,
    progress_in: ProgressUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a lesson as completed or incomplete."""
    # Verify course ownership
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    lesson = db.query(Lesson).join(Chapter).filter(
        Lesson.id == lesson_id,
        Chapter.id == Lesson.chapter_id,
        Chapter.course_id == course_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.lesson_id == lesson.id
    ).first()

    now = datetime.utcnow()
    if not progress:
        progress = LearningProgress(
            user_id=current_user.id,
            lesson_id=lesson.id,
            completed=progress_in.completed,
            completed_at=now if progress_in.completed else None,
            last_opened_at=now
        )
        db.add(progress)
    else:
        progress.completed = progress_in.completed
        progress.completed_at = now if progress_in.completed else None
        
    db.commit()
    db.refresh(progress)

    return progress
