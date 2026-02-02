from fastapi import HTTPException, UploadFile, File, Form, status
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.main import Vehicle, Document, DocumentType
from app.models.user import User, UserRole
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.core.storage import (
    get_storage_service,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    LocalStorageService,
)

def get_vehicle_with_access(db: Session, vehicle_id: int, current_user: User) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this vehicle")
    return vehicle

def get_document_with_access(db: Session, document_id: int, current_user: User) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    vehicle = db.query(Vehicle).filter(Vehicle.id == doc.vehicle_id).first()
    if not vehicle: # This should ideally not happen if data integrity is maintained
        raise HTTPException(status_code=404, detail="Associated vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
    return doc

def list_documents_for_vehicle(db: Session, vehicle_id: int, include_history: bool = False) -> List[Document]:
    query = db.query(Document).filter(Document.vehicle_id == vehicle_id)
    if not include_history:
        query = query.filter(Document.replaced_by_id.is_(None))
    documents = query.order_by(Document.document_type, Document.version.desc()).all()
    return documents

async def upload_document_for_vehicle(
    db: Session,
    vehicle_id: int,
    document_type: DocumentType,
    file: UploadFile,
    uploaded_by_id: int
) -> Document:
    if not file.content_type or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: PDF, JPEG, PNG",
        )

    content = await file.read() # Use await for async file read
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_BYTES // (1024*1024)}MB",
        )

    storage = get_storage_service()
    result = storage.upload(content, file.filename or "document", file.content_type)

    doc = Document(
        vehicle_id=vehicle_id,
        document_type=document_type.value,
        file_url=result["url"],
        file_name=file.filename or "document",
        mime_type=file.content_type,
        file_size_bytes=len(content),
        version=1,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def serve_local_document_file(db: Session, filename: str, current_user: User):
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    storage = get_storage_service()
    if not isinstance(storage, LocalStorageService):
        raise HTTPException(status_code=404, detail="Not found (not using local storage)")

    file_path = storage.get_file_path(filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    doc = db.query(Document).filter(Document.file_url == f"/api/documents/files/{filename}").first()
    if doc:
        vehicle = get_vehicle_with_access(db, doc.vehicle_id, current_user) # Re-use access check
        # If get_vehicle_with_access doesn't raise, user has access
    else:
        # If no document record, deny access for security
        raise HTTPException(status_code=403, detail="Access denied or document record not found")

    return FileResponse(path=str(file_path), filename=filename)

def get_document_metadata(db: Session, document_id: int, current_user: User) -> Document:
    return get_document_with_access(db, document_id, current_user)

def preview_document_content(db: Session, document_id: int, current_user: User):
    doc = get_document_with_access(db, document_id, current_user)
    if doc.file_url.startswith("http"):
        return RedirectResponse(url=doc.file_url)
    return RedirectResponse(url=doc.file_url) # For local storage, redirects to our internal file serving endpoint

def download_document_content(db: Session, document_id: int, current_user: User):
    doc = get_document_with_access(db, document_id, current_user)
    if doc.file_url.startswith("http"):
        return RedirectResponse(url=doc.file_url)

    storage = get_storage_service()
    if isinstance(storage, LocalStorageService):
        filename_in_storage = doc.file_url.split("/")[-1] # Assuming URL format /api/documents/files/{filename}
        file_path = storage.get_file_path(filename_in_storage)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found in storage")
        return FileResponse(
            path=str(file_path),
            filename=doc.file_name,
            media_type=doc.mime_type,
            headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
        )
    return RedirectResponse(url=doc.file_url) # Fallback if not local and not HTTP URL (shouldn't happen)

def delete_document_record(db: Session, document_id: int, current_user: User):
    doc = get_document_with_access(db, document_id, current_user) # Ensures user has rights
    db.delete(doc)
    db.commit()
    return {"message": f"Document {document_id} deleted successfully"}
