import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.bookmark import Bookmark
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.chapter import Chapter

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

class BookmarkIn(BaseModel):
    lesson_id: UUID

class BookmarkOut(BaseModel):
    id: UUID
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[BookmarkOut])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all bookmarked lessons for the user."""
    bookmarks = db.query(Bookmark).join(Lesson).join(Chapter).join(Course).filter(
        Bookmark.user_id == current_user.id
    ).order_by(Bookmark.created_at.desc()).all()

    result = []
    for bm in bookmarks:
        result.append(BookmarkOut(
            id=bm.id,
            lesson_id=bm.lesson_id,
            lesson_title=bm.lesson.title,
            course_id=bm.lesson.chapter.course_id,
            course_title=bm.lesson.chapter.course.title,
            created_at=bm.created_at
        ))
    return result

@router.post("", response_model=BookmarkOut)
def bookmark_lesson(
    bm_in: BookmarkIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bookmark a specific lesson."""
    lesson = db.query(Lesson).join(Chapter).join(Course).filter(
        Lesson.id == bm_in.lesson_id,
        Course.user_id == current_user.id
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found or access denied.")

    # Check if already bookmarked
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.lesson_id == bm_in.lesson_id
    ).first()

    if existing:
        return BookmarkOut(
            id=existing.id,
            lesson_id=existing.lesson_id,
            lesson_title=lesson.title,
            course_id=lesson.chapter.course_id,
            course_title=lesson.chapter.course.title,
            created_at=existing.created_at
        )

    new_bm = Bookmark(
        id=uuid.uuid4(),
        user_id=current_user.id,
        lesson_id=bm_in.lesson_id
    )
    db.add(new_bm)
    try:
        db.commit()
        db.refresh(new_bm)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database save failure.")

    return BookmarkOut(
        id=new_bm.id,
        lesson_id=new_bm.lesson_id,
        lesson_title=lesson.title,
        course_id=lesson.chapter.course_id,
        course_title=lesson.chapter.course.title,
        created_at=new_bm.created_at
    )

@router.delete("/{lesson_id}", status_code=status.HTTP_200_OK)
def remove_bookmark(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unbookmark a specific lesson."""
    bm = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.lesson_id == lesson_id
    ).first()

    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found.")

    db.delete(bm)
    db.commit()
    return {"status": "removed"}
