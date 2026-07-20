import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.uploaded_pdf import UploadedPDF, PDFStatus
from app.utils.storage import upload_file, delete_file
from app.core.config import settings
from app.services.course_generator import generate_course_task

router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    difficulty: str = Form("beginner"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate MIME type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Validate extension
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must have a .pdf extension")

    file_bytes = await file.read()
    file_size_mb = len(file_bytes) / (1024 * 1024)

    # Validate file size
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB")

    if len(file_bytes) == 0:
         raise HTTPException(status_code=400, detail="File is empty")

    pdf_id = uuid.uuid4()
    storage_path = f"{current_user.id}/{pdf_id}.pdf"

    # Upload to Supabase Storage
    success = upload_file(storage_path, file_bytes, file.content_type)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    # Create Database Record
    try:
        new_pdf = UploadedPDF(
            id=pdf_id,
            user_id=current_user.id,
            filename=file.filename,
            original_filename=file.filename,
            file_size=len(file_bytes),
            storage_path=storage_path,
            mime_type=file.content_type,
            status=PDFStatus.uploaded
        )
        db.add(new_pdf)
        db.commit()
        db.refresh(new_pdf)
        
        # Trigger AI Course Generation background task
        background_tasks.add_task(generate_course_task, str(new_pdf.id), title, difficulty)
        
        return {
            "id": new_pdf.id,
            "filename": new_pdf.filename,
            "status": new_pdf.status.value
        }
    except Exception as e:
        db.rollback()
        # Rollback storage
        delete_file(storage_path)
        raise HTTPException(status_code=500, detail="Database error. Upload reverted.")
