from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.models.main import DocumentType

# Basic schema for returning document info
class DocumentResponse(BaseModel):
    id: int
    vehicle_id: int
    document_type: DocumentType
    file_url: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    version: int
    uploaded_by_id: Optional[int] = None
    created_at: datetime
    replaced_by_id: Optional[int] = None

    class Config:
        from_attributes = True

# Schema representing the response after a successful document upload
class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse


# Schema for creating a document (input)
# Most fields are populated by the service, not the user
class DocumentCreate(BaseModel):
    document_type: DocumentType
    file_name: str
    mime_type: str
    file_size_bytes: int
    # vehicle_id, uploaded_by_id, and file_url are handled in the service/endpoint