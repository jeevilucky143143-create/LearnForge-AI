import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.lesson_note import LessonNote
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.chapter import Chapter

router = APIRouter(prefix="/notes", tags=["notes"])

class NoteIn(BaseModel):
    markdown: str

class NoteOut(BaseModel):
    id: UUID
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_title: str
    markdown: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[NoteOut])
def list_all_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all personal notes for the user."""
    notes = db.query(LessonNote).join(Lesson).join(Chapter).join(Course).filter(
        LessonNote.user_id == current_user.id
    ).order_by(LessonNote.updated_at.desc()).all()

    result = []
    for note in notes:
        result.append(NoteOut(
            id=note.id,
            lesson_id=note.lesson_id,
            lesson_title=note.lesson.title,
            course_id=note.lesson.chapter.course_id,
            course_title=note.lesson.chapter.course.title,
            markdown=note.markdown,
            created_at=note.created_at,
            updated_at=note.updated_at
        ))
    return result

@router.get("/lessons/{lesson_id}", response_model=Optional[NoteOut])
def get_lesson_note(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a note for a specific lesson."""
    note = db.query(LessonNote).filter(
        LessonNote.user_id == current_user.id,
        LessonNote.lesson_id == lesson_id
    ).first()

    if not note:
        return None

    return NoteOut(
        id=note.id,
        lesson_id=note.lesson_id,
        lesson_title=note.lesson.title,
        course_id=note.lesson.chapter.course_id,
        course_title=note.lesson.chapter.course.title,
        markdown=note.markdown,
        created_at=note.created_at,
        updated_at=note.updated_at
    )

@router.post("/lessons/{lesson_id}", response_model=NoteOut)
def save_lesson_note(
    lesson_id: UUID,
    note_in: NoteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a note for a specific lesson."""
    lesson = db.query(Lesson).join(Chapter).join(Course).filter(
        Lesson.id == lesson_id,
        Course.user_id == current_user.id
    ).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found or access denied.")

    note = db.query(LessonNote).filter(
        LessonNote.user_id == current_user.id,
        LessonNote.lesson_id == lesson_id
    ).first()

    if note:
        note.markdown = note_in.markdown
        note.updated_at = datetime.utcnow()
    else:
        note = LessonNote(
            id=uuid.uuid4(),
            user_id=current_user.id,
            lesson_id=lesson_id,
            markdown=note_in.markdown
        )
        db.add(note)

    try:
        db.commit()
        db.refresh(note)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database write failure.")

    return NoteOut(
        id=note.id,
        lesson_id=note.lesson_id,
        lesson_title=lesson.title,
        course_id=lesson.chapter.course_id,
        course_title=lesson.chapter.course.title,
        markdown=note.markdown,
        created_at=note.created_at,
        updated_at=note.updated_at
    )

@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_200_OK)
def delete_lesson_note(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note for a specific lesson."""
    note = db.query(LessonNote).filter(
        LessonNote.user_id == current_user.id,
        LessonNote.lesson_id == lesson_id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    db.delete(note)
    db.commit()
    return {"status": "deleted"}
