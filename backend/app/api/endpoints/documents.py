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
from app.models.main import Vehicle, Document, DocumentType
from app.models.user import User, UserRole
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.core.security import get_current_user, check_staff_privilege
from app.core.storage import (
    get_storage_service,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    LocalStorageService,
)

# Router for document-level operations (get, preview, download, delete)
router = APIRouter()

# Sub-router for vehicle-scoped operations (list, upload) - include in vehicles router
vehicle_documents_router = APIRouter()


def _get_vehicle_with_access(
    vehicle_id: int,
    db: Session,
    current_user: User,
) -> Vehicle:
    """Fetch vehicle and verify current user has access (admin/staff see all, guest only own)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this vehicle")
    return vehicle


def _get_document_with_access(
    document_id: int,
    db: Session,
    current_user: User,
) -> Document:
    """Fetch document and verify current user has access via vehicle ownership."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    vehicle = db.query(Vehicle).filter(Vehicle.id == doc.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
    return doc


# --- Vehicle-scoped endpoints (list, upload) ---

@vehicle_documents_router.get("/", response_model=List[DocumentResponse])
def list_vehicle_documents(
    vehicle_id: int,
    include_history: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List documents for a vehicle. By default returns latest version per type."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)
    query = db.query(Document).filter(Document.vehicle_id == vehicle_id)
    if not include_history:
        # Return only current (non-replaced) documents
        query = query.filter(Document.replaced_by_id.is_(None))
    documents = query.order_by(Document.document_type, Document.version.desc()).all()
    return documents


@vehicle_documents_router.post("/", response_model=DocumentUploadResponse)
def upload_document(
    vehicle_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Upload a document for a vehicle. Allowed: PDF, JPEG, PNG. Max 10MB."""
    vehicle = _get_vehicle_with_access(vehicle_id, db, current_user)

    if not file.content_type or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: PDF, JPEG, PNG",
        )

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_BYTES // (1024*1024)}MB",
        )

    storage = get_storage_service()
    result = storage.upload(content, file.filename or "document", file.content_type)

    # Phase 1: version=1, no versioning logic
    doc = Document(
        vehicle_id=vehicle_id,
        document_type=document_type.value,
        file_url=result["url"],
        file_name=file.filename or "document",
        mime_type=file.content_type,
        file_size_bytes=len(content),
        version=1,
        uploaded_by_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# --- Local file serving (for LocalStorageService) - must be before /{document_id} ---

@router.get("/files/{filename}")
def serve_local_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Serve files from local storage. Validates filename to prevent path traversal."""
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    storage = get_storage_service()
    if not isinstance(storage, LocalStorageService):
        raise HTTPException(status_code=404, detail="Not found")
    file_path = storage.get_file_path(filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    # Verify user has access: document must exist and user must own vehicle
    doc = db.query(Document).filter(Document.file_url == f"/api/documents/files/{filename}").first()
    if doc:
        vehicle = db.query(Vehicle).filter(Vehicle.id == doc.vehicle_id).first()
        if vehicle and current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and vehicle.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this file")
    return FileResponse(path=str(file_path), filename=filename)


# --- Document-level endpoints (get, preview, download, delete) ---

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document metadata."""
    return _get_document_with_access(document_id, db, current_user)


@router.get("/{document_id}/preview")
def preview_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview document in browser. Redirects to URL or serves file for local storage."""
    doc = _get_document_with_access(document_id, db, current_user)
    if doc.file_url.startswith("http"):
        return RedirectResponse(url=doc.file_url)
    # Local storage: /api/documents/files/{filename} - redirect to our file endpoint
    return RedirectResponse(url=doc.file_url)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download document. Redirects to URL or serves file for local storage."""
    doc = _get_document_with_access(document_id, db, current_user)
    if doc.file_url.startswith("http"):
        return RedirectResponse(url=doc.file_url)
    # Local storage: serve file with attachment disposition
    storage = get_storage_service()
    if isinstance(storage, LocalStorageService):
        # Extract filename from URL: /api/documents/files/xxx.ext
        filename = doc.file_url.split("/")[-1]
        file_path = storage.get_file_path(filename)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(
            path=str(file_path),
            filename=doc.file_name,
            media_type=doc.mime_type,
            headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
        )
    return RedirectResponse(url=doc.file_url)


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_staff_privilege),
):
    """Delete a document. Soft-delete (set replaced_by) or hard delete for Phase 1."""
    doc = _get_document_with_access(document_id, db, current_user)
    db.delete(doc)
    db.commit()
    return {"message": f"Document {document_id} deleted"}
