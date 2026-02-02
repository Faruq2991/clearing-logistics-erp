"""
Document management endpoints.
Vehicle-scoped: list and upload (mounted under /api/vehicles/{vehicle_id}/documents)
Document-level: get, preview, download, delete (mounted at /api/documents)
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.main import DocumentType # Keep DocumentType for Form parameter
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.core.security import get_current_user, check_staff_privilege
from app.core.storage import LocalStorageService # For type checking

# Import the new service
from app.services import document_service

# Router for document-level operations (get, preview, download, delete)
router = APIRouter()

# Sub-router for vehicle-scoped operations (list, upload) - include in vehicles router
vehicle_documents_router = APIRouter()

# --- Vehicle-scoped endpoints (list, upload) ---

@vehicle_documents_router.get("/", response_model=List[DocumentResponse])
def list_vehicle_documents(
    vehicle_id: int,
    include_history: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List documents for a vehicle. By default returns latest version per type."""
    document_service.get_vehicle_with_access(db, vehicle_id, current_user) # Access check
    documents = document_service.list_documents_for_vehicle(db, vehicle_id, include_history)
    return documents


@vehicle_documents_router.post("/", response_model=DocumentUploadResponse)
async def upload_document(
    vehicle_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Upload a document for a vehicle. Allowed: PDF, JPEG, PNG. Max 10MB."""
    document_service.get_vehicle_with_access(db, vehicle_id, current_user) # Access check
    doc = await document_service.upload_document_for_vehicle(
        db, vehicle_id, document_type, file, current_user.id
    )
    return doc


# --- Local file serving (for LocalStorageService) - must be before /{document_id} ---

@router.get("/files/{filename}")
def serve_local_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Serve files from local storage. Validates filename to prevent path traversal."""
    return document_service.serve_local_document_file(db, filename, current_user)


# --- Document-level endpoints (get, preview, download, delete) ---

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document metadata."""
    doc = document_service.get_document_metadata(db, document_id, current_user)
    return doc


@router.get("/{document_id}/preview")
def preview_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview document in browser. Redirects to URL or serves file for local storage."""
    return document_service.preview_document_content(db, document_id, current_user)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download document. Redirects to URL or serves file for local storage."""
    return document_service.download_document_content(db, document_id, current_user)


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Delete a document. Soft-delete (set replaced_by) or hard delete for Phase 1."""
    return document_service.delete_document_record(db, document_id, current_user)
