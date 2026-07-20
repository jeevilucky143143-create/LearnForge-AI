from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.learning_progress import LearningProgress
from app.models.bookmark import Bookmark
from app.models.lesson_note import LessonNote
from app.models.search_history import SearchHistory
from app.models.quiz_attempt import QuizAttempt, QuizStatus
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.api.v1.analytics import get_streak_days

router = APIRouter(prefix="/personalization", tags=["personalization"])

class ContinueCourseOut(BaseModel):
    id: UUID
    title: str
    progress_percentage: int
    resume_lesson_id: Optional[UUID]

class RecentLessonOut(BaseModel):
    id: UUID
    title: str
    course_id: UUID
    course_title: str
    last_opened_at: datetime

class BookmarkedLessonOut(BaseModel):
    id: UUID
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_title: str

class RecentNoteOut(BaseModel):
    id: UUID
    lesson_id: UUID
    lesson_title: str
    markdown: str
    updated_at: datetime

class RecommendedLessonOut(BaseModel):
    id: UUID
    title: str
    course_id: UUID
    course_title: str
    chapter_title: str

class PersonalDashboardOut(BaseModel):
    continue_learning: Optional[ContinueCourseOut]
    recent_lessons: List[RecentLessonOut]
    bookmarked_lessons: List[BookmarkedLessonOut]
    recent_notes: List[RecentNoteOut]
    recent_searches: List[str]
    learning_streak: int
    recommended_lesson: Optional[RecommendedLessonOut]

@router.get("/dashboard", response_model=PersonalDashboardOut)
def get_personalized_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all personalization states and study suggestions for the main dashboard."""
    # 1. Streaks
    streak = get_streak_days(current_user.id, db)

    # 2. Recent Searches
    recent_q_rows = db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id
    ).order_by(SearchHistory.searched_at.desc()).limit(5).all()
    recent_searches = [r.query for r in recent_q_rows]

    # 3. Bookmarks
    bookmarks = db.query(Bookmark).join(Lesson).join(Chapter).join(Course).filter(
        Bookmark.user_id == current_user.id
    ).order_by(Bookmark.created_at.desc()).limit(5).all()
    bookmarked_lessons = [
        BookmarkedLessonOut(
            id=bm.id,
            lesson_id=bm.lesson_id,
            lesson_title=bm.lesson.title,
            course_id=bm.lesson.chapter.course_id,
            course_title=bm.lesson.chapter.course.title
        )
        for bm in bookmarks
    ]

    # 4. Recent Notes
    notes = db.query(LessonNote).join(Lesson).join(Chapter).join(Course).filter(
        LessonNote.user_id == current_user.id
    ).order_by(LessonNote.updated_at.desc()).limit(5).all()
    recent_notes = [
        RecentNoteOut(
            id=n.id,
            lesson_id=n.lesson_id,
            lesson_title=n.lesson.title,
            markdown=n.markdown,
            updated_at=n.updated_at
        )
        for n in notes
    ]

    # 5. Recent Lessons
    progress_records = db.query(LearningProgress).join(Lesson).join(Chapter).join(Course).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.last_opened_at != None
    ).order_by(LearningProgress.last_opened_at.desc()).limit(5).all()
    
    recent_lessons = [
        RecentLessonOut(
            id=p.lesson_id,
            title=p.lesson.title,
            course_id=p.lesson.chapter.course_id,
            course_title=p.lesson.chapter.course.title,
            last_opened_at=p.last_opened_at
        )
        for p in progress_records
    ]

    # 6. Continue Learning Course
    # Find most recently studied course (having highest last_opened_at progress)
    last_opened_progress = db.query(LearningProgress).join(Lesson).join(Chapter).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.last_opened_at != None
    ).order_by(LearningProgress.last_opened_at.desc()).first()

    continue_learning = None
    most_recent_course = None

    if last_opened_progress:
        most_recent_course = db.query(Course).filter(Course.id == last_opened_progress.lesson.chapter.course_id).first()
    else:
        # Fallback to the most recently created course
        most_recent_course = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.created_at.desc()).first()

    if most_recent_course:
        # Calculate progress
        lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == most_recent_course.id).all()
        total_les = len(lessons)
        progress_pct = 0
        resume_lesson_id = None
        
        if total_les > 0:
            les_ids = [l.id for l in lessons]
            completed = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(les_ids),
                LearningProgress.completed == True
            ).count()
            progress_pct = int((completed / total_les) * 100)

            # Find resume lesson (last opened lesson in progress)
            last_opened = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(les_ids),
                LearningProgress.last_opened_at != None
            ).order_by(LearningProgress.last_opened_at.desc()).first()

            if last_opened:
                resume_lesson_id = last_opened.lesson_id
            else:
                # Default to first incomplete lesson in course ordering
                incomplete = db.query(Lesson).join(Chapter).filter(
                    Chapter.course_id == most_recent_course.id
                ).outerjoin(
                    LearningProgress, (LearningProgress.lesson_id == Lesson.id) & (LearningProgress.user_id == current_user.id)
                ).filter(
                    (LearningProgress.completed == None) | (LearningProgress.completed == False)
                ).order_by(
                    Chapter.order_index.asc(),
                    Lesson.order_index.asc()
                ).first()
                if incomplete:
                    resume_lesson_id = incomplete.id
                else:
                    resume_lesson_id = lessons[0].id

        continue_learning = ContinueCourseOut(
            id=most_recent_course.id,
            title=most_recent_course.title,
            progress_percentage=progress_pct,
            resume_lesson_id=resume_lesson_id
        )

    # 7. Recommended Next Lesson
    recommended_lesson = None
    if most_recent_course:
        # Fetch the first incomplete lesson in the most recently studied course
        incomplete_lesson = db.query(Lesson).join(Chapter).filter(
            Chapter.course_id == most_recent_course.id
        ).outerjoin(
            LearningProgress, (LearningProgress.lesson_id == Lesson.id) & (LearningProgress.user_id == current_user.id)
        ).filter(
            (LearningProgress.completed == None) | (LearningProgress.completed == False)
        ).order_by(
            Chapter.order_index.asc(),
            Lesson.order_index.asc()
        ).first()

        if incomplete_lesson:
            recommended_lesson = RecommendedLessonOut(
                id=incomplete_lesson.id,
                title=incomplete_lesson.title,
                course_id=most_recent_course.id,
                course_title=most_recent_course.title,
                chapter_title=incomplete_lesson.chapter.title
            )

    return PersonalDashboardOut(
        continue_learning=continue_learning,
        recent_lessons=recent_lessons,
        bookmarked_lessons=bookmarked_lessons,
        recent_notes=recent_notes,
        recent_searches=recent_searches,
        learning_streak=streak,
        recommended_lesson=recommended_lesson
    )
