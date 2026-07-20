from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db import get_db
from app.models.user import User
from app.models.course import Course
from app.models.uploaded_pdf import UploadedPDF
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.learning_progress import LearningProgress
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.enums import QuizStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve real statistics and recent records for the dashboard.
    """
    # Count total uploaded PDFs
    total_pdfs = db.query(UploadedPDF).filter(
        UploadedPDF.user_id == current_user.id,
        UploadedPDF.deleted_at == None
    ).count()

    # Count total courses
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    total_courses = len(courses)

    # Compute completed courses and study time dynamically
    completed_courses = 0
    total_completed_lessons = 0

    for course in courses:
        # Find all lessons in this course
        lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).all()
        total_lessons = len(lessons)
        
        if total_lessons > 0:
            lesson_ids = [l.id for l in lessons]
            completed_in_course = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(lesson_ids),
                LearningProgress.completed == True
            ).count()
            
            total_completed_lessons += completed_in_course
            if completed_in_course == total_lessons:
                completed_courses += 1

    # Estimate study time as completed lessons * 10 minutes (or use estimated_time proportion)
    study_time_minutes = total_completed_lessons * 15

    # Fetch recent PDFs
    recent_pdfs_list = db.query(UploadedPDF).filter(
        UploadedPDF.user_id == current_user.id,
        UploadedPDF.deleted_at == None
    ).order_by(UploadedPDF.created_at.desc()).limit(5).all()

    recent_pdfs = []
    for pdf in recent_pdfs_list:
        recent_pdfs.append({
            "id": str(pdf.id),
            "filename": pdf.filename,
            "file_size": pdf.file_size,
            "status": pdf.status.value,
            "created_at": pdf.created_at.isoformat()
        })

    # Fetch recent Courses
    recent_courses_list = db.query(Course).filter(
        Course.user_id == current_user.id
    ).order_by(Course.created_at.desc()).limit(5).all()

    recent_courses = []
    for course in recent_courses_list:
        # Compute progress percentage for recent courses
        lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).all()
        total_lessons = len(lessons)
        progress_percentage = 0
        if total_lessons > 0:
            lesson_ids = [l.id for l in lessons]
            completed = db.query(LearningProgress).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.lesson_id.in_(lesson_ids),
                LearningProgress.completed == True
            ).count()
            progress_percentage = int((completed / total_lessons) * 100)

        recent_courses.append({
            "id": str(course.id),
            "title": course.title,
            "difficulty": course.difficulty.value,
            "estimated_time_minutes": course.estimated_time_minutes,
            "progress_percentage": progress_percentage,
            "created_at": course.created_at.isoformat()
        })

    # Quiz stats
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == QuizStatus.completed
    ).all()
    total_quizzes_taken = len(attempts)
    
    avg_score = 0.0
    if total_quizzes_taken > 0:
        avg_score = sum([a.percentage for a in attempts if a.percentage is not None]) / total_quizzes_taken
        
    recent_quiz_attempts_list = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == QuizStatus.completed
    ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
    
    recent_quiz_attempts = []
    for att in recent_quiz_attempts_list:
        recent_quiz_attempts.append({
            "id": str(att.id),
            "quiz_title": att.quiz.title,
            "score": att.score,
            "percentage": att.percentage,
            "completed_at": att.completed_at.isoformat()
        })

    return {
        "total_courses": total_courses,
        "total_pdfs": total_pdfs,
        "completed_courses": completed_courses,
        "study_time_minutes": study_time_minutes,
        "total_quizzes_taken": total_quizzes_taken,
        "average_quiz_score": round(avg_score, 1),
        "recent_quiz_attempts": recent_quiz_attempts,
        "recent_pdfs": recent_pdfs,
        "recent_courses": recent_courses
    }
