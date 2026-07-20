from datetime import date, timedelta, datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.learning_progress import LearningProgress
from app.models.quiz_attempt import QuizAttempt, QuizStatus
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson

router = APIRouter(prefix="/analytics", tags=["analytics"])

class ProgressPoint(BaseModel):
    date: str # "YYYY-MM-DD"
    lessons_completed: int
    quizzes_completed: int

class AnalyticsOut(BaseModel):
    lessons_completed: int
    courses_completed: int
    study_time_minutes: int
    quiz_average: float
    learning_streak: int
    weekly_progress: List[ProgressPoint]
    monthly_progress: List[ProgressPoint]

def get_streak_days(user_id: UUID, db: Session) -> int:
    """Calculates consecutive days of study activity."""
    lesson_times = db.query(LearningProgress.completed_at).filter(
        LearningProgress.user_id == user_id,
        LearningProgress.completed == True,
        LearningProgress.completed_at != None
    ).all()

    quiz_times = db.query(QuizAttempt.completed_at).filter(
        QuizAttempt.user_id == user_id,
        QuizAttempt.status == QuizStatus.completed,
        QuizAttempt.completed_at != None
    ).all()

    dates = set()
    for lt in lesson_times:
        dates.add(lt[0].date())
    for qt in quiz_times:
        dates.add(qt[0].date())

    if not dates:
        return 0

    sorted_dates = sorted(list(dates), reverse=True)
    today = date.today()

    # If the last activity was before yesterday, streak is broken
    if sorted_dates[0] < today - timedelta(days=1):
        return 0

    streak = 1
    current_date = sorted_dates[0]
    for d in sorted_dates[1:]:
        if d == current_date - timedelta(days=1):
            streak += 1
            current_date = d
        elif d < current_date - timedelta(days=1):
            break

    return streak

@router.get("", response_model=AnalyticsOut)
def get_learning_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed learning history analytics and charts data."""
    # 1. Basic Stats
    lessons_completed = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.completed == True
    ).count()

    study_time_minutes = lessons_completed * 15 # 15 mins per lesson average

    # Courses completed (those with 100% progress)
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    courses_completed = 0
    for c in courses:
        lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == c.id).all()
        if len(lessons) > 0:
            les_ids = [l.id for l in lessons]
            completed_in_course = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(les_ids),
                LearningProgress.completed == True
            ).count()
            if completed_in_course == len(lessons):
                courses_completed += 1

    # Quiz average
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == QuizStatus.completed
    ).all()
    total_quizzes = len(quiz_attempts)
    quiz_avg = 0.0
    if total_quizzes > 0:
        quiz_avg = sum([qa.percentage for qa in quiz_attempts if qa.percentage is not None]) / total_quizzes

    # Streaks
    streak = get_streak_days(current_user.id, db)

    # 2. Charts Data
    # Compile activity over last 30 days
    today = date.today()
    monthly_points = []
    
    # Lessons grouping
    lesson_progress_rows = db.query(LearningProgress.completed_at).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.completed == True,
        LearningProgress.completed_at >= datetime.combine(today - timedelta(days=30), datetime.min.time())
    ).all()
    
    # Quiz attempts grouping
    quiz_attempt_rows = db.query(QuizAttempt.completed_at).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == QuizStatus.completed,
        QuizAttempt.completed_at >= datetime.combine(today - timedelta(days=30), datetime.min.time())
    ).all()

    lesson_dates = [row[0].date() for row in lesson_progress_rows if row[0]]
    quiz_dates = [row[0].date() for row in quiz_attempt_rows if row[0]]

    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.isoformat()
        
        l_count = sum(1 for d in lesson_dates if d == day)
        q_count = sum(1 for d in quiz_dates if d == day)
        
        monthly_points.append(ProgressPoint(
            date=day_str,
            lessons_completed=l_count,
            quizzes_completed=q_count
        ))

    weekly_progress = monthly_points[-7:]

    return AnalyticsOut(
        lessons_completed=lessons_completed,
        courses_completed=courses_completed,
        study_time_minutes=study_time_minutes,
        quiz_average=round(quiz_avg, 1),
        learning_streak=streak,
        weekly_progress=weekly_progress,
        monthly_progress=monthly_points
    )
