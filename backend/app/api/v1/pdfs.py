from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.uploaded_pdf import UploadedPDF, PDFStatus
from app.models.course import Course
from app.services.course_generator import generate_course_task

router = APIRouter(prefix="/pdfs", tags=["pdfs"])

@router.get("/{pdf_id}")
def get_pdf_status(
    pdf_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the status and results of a PDF course generation task."""
    pdf = db.query(UploadedPDF).filter(
        UploadedPDF.id == pdf_id,
        UploadedPDF.user_id == current_user.id,
        UploadedPDF.deleted_at == None
    ).first()

    if not pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded PDF not found or you do not have permission to access it."
        )

    # Check if a course has been successfully generated
    course = db.query(Course).filter(Course.uploaded_pdf_id == pdf.id).first()
    course_id = str(course.id) if course else None

    return {
        "id": str(pdf.id),
        "filename": pdf.filename,
        "status": pdf.status.value,
        "error_message": pdf.error_message,
        "course_id": course_id
    }

@router.post("/{pdf_id}/generate", status_code=status.HTTP_202_ACCEPTED)
def trigger_course_generation(
    pdf_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger or retry the AI course generation pipeline for a PDF."""
    pdf = db.query(UploadedPDF).filter(
        UploadedPDF.id == pdf_id,
        UploadedPDF.user_id == current_user.id,
        UploadedPDF.deleted_at == None
    ).first()

    if not pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded PDF not found or you do not have permission to access it."
        )

    if pdf.status == PDFStatus.processing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course generation is already in progress for this document."
        )

    # Set status back to pending
    pdf.status = PDFStatus.pending
    pdf.error_message = None
    db.commit()

    # Queue background task (assume default beginner difficulty, or read from previous if we saved it;
    # since we don't save previous choice, we use beginner or original filename)
    background_tasks.add_task(generate_course_task, str(pdf.id), pdf.filename, "beginner")

    return {
        "detail": "Course generation task queued successfully.",
        "status": pdf.status.value
    }
