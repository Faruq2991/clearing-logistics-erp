import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from typing import List

from app.models.main import Document, DocumentType, Vehicle
from app.models.user import User, UserRole
from app.schemas.document import DocumentUploadResponse
from app.core.storage import storage_service

# --- Access Control ---

def get_vehicle_with_access(db: Session, vehicle_id: int, user: User) -> Vehicle:
    """
    Retrieves a vehicle if the user has permission to access it.
    Raises HTTPException 403 if user is guest and not owner.
    Raises HTTPException 404 if vehicle not found.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    if vehicle.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this vehicle")
        
    return vehicle

def _get_document_with_access(db: Session, document_id: int, user: User) -> Document:
    """Helper to get a document and verify user access via the vehicle."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    get_vehicle_with_access(db, document.vehicle_id, user) # Reuse vehicle access check
    return document

# --- Service Functions ---

def list_documents_for_vehicle(db: Session, vehicle_id: int, include_history: bool = False) -> List[Document]:
    """
    List documents for a vehicle. If include_history is False, it returns only the
    latest version of each document type.
    """
    query = db.query(Document).filter(Document.vehicle_id == vehicle_id)
    if not include_history:
        query = query.filter(Document.replaced_by_id.is_(None))
        
    return query.order_by(Document.created_at.desc()).all()

async def upload_document_for_vehicle(
    db: Session, vehicle_id: int, document_type: DocumentType, file: UploadFile, user_id: int
) -> DocumentUploadResponse:
    """Handles the business logic of uploading a document."""
    file_url, original_filename, mime_type, file_size, unique_filename = await storage_service.save_file(file, vehicle_id)
    
    # Versioning: check if a document of the same type exists
    existing_doc = db.query(Document).filter(
        Document.vehicle_id == vehicle_id,
        Document.document_type == document_type,
        Document.replaced_by_id.is_(None)
    ).first()
    
    new_version = 1
    if existing_doc:
        new_version = existing_doc.version + 1

    db_document = Document(
        vehicle_id=vehicle_id,
        document_type=document_type,
        file_url=file_url,
        file_name=unique_filename, # Use unique filename for storage
        mime_type=mime_type,
        file_size_bytes=file_size,
        uploaded_by_id=user_id,
        version=new_version
    )
    db.add(db_document)
    db.commit()

    if existing_doc:
        existing_doc.replaced_by_id = db_document.id
        db.commit()

    db.refresh(db_document)
    return DocumentUploadResponse(message="File uploaded successfully", document=db_document)

def get_document_metadata(db: Session, document_id: int, user: User) -> Document:
    """Get a document's metadata after checking access."""
    return _get_document_with_access(db, document_id, user)

def preview_document_content(db: Session, document_id: int, user: User):
    """Returns a response to preview a document."""
    document = _get_document_with_access(db, document_id, user)
    return RedirectResponse(url=document.file_url)

def download_document_content(db: Session, document_id: int, user: User):
    """Returns a FileResponse to download a document."""
    document = _get_document_with_access(db, document_id, user)
    file_path = storage_service.get_file_path(document.file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(path=file_path, filename=document.file_name, media_type=document.mime_type)

def delete_document_record(db: Session, document_id: int, user: User):
    """
    Deletes a document record. This is a hard delete for now.
    A soft delete would involve setting a flag or using the versioning system.
    """
    document = _get_document_with_access(db, document_id, user) # Auth check
    
    # For versioned deletes, you'd find the previous version and unset its 'replaced_by_id'
    # For now, we do a hard delete.
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

def serve_local_document_file(db: Session, filename: str, user: User) -> FileResponse:
    """Serves a local file after validating access."""
    # This is tricky. The filename alone doesn't tell us the vehicle.
    # We need to find the document by filename to check access.
    document = db.query(Document).filter(Document.file_name == filename).first()
    if not document:
        raise HTTPException(status_code=404, detail="File not found")

    # Now check if the user can access this document's vehicle
    get_vehicle_with_access(db, document.vehicle_id, user)

    file_path = storage_service.get_file_path(filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(file_path, media_type=document.mime_type)
