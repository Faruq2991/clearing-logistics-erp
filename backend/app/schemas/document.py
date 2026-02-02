from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    vehicle_id: int
    document_type: str
    file_url: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    version: int
    uploaded_by_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    id: int
    vehicle_id: int
    document_type: str
    file_url: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    version: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
