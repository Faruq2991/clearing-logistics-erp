"""
Storage service for document uploads.
Uses Cloudinary when CLOUDINARY_URL is set, otherwise falls back to local file storage.
"""
import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from decouple import config


# Allowed MIME types per PRD (PDF, JPEG, PNG for documents and photos)
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

# Max file size: 10MB (per PRD)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class StorageService(ABC):
    """Abstract storage interface for document uploads."""

    @abstractmethod
    def upload(self, file_content: bytes, file_name: str, mime_type: str) -> dict:
        """
        Upload file and return metadata.
        Returns: {"url": str, "key": str (for retrieval)}
        """
        pass

    @abstractmethod
    def get_url(self, key: str) -> str:
        """Return URL for viewing/downloading the file."""
        pass


class LocalStorageService(StorageService):
    """Local file storage for development when Cloudinary is not configured."""

    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or "uploads")
        self.base_path.mkdir(parents=True, exist_ok=True)

    def upload(self, file_content: bytes, file_name: str, mime_type: str) -> dict:
        ext = Path(file_name).suffix or ".bin"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = self.base_path / unique_name
        file_path.write_bytes(file_content)
        # Return API path for clients; key is filename for serving
        url = f"/api/documents/files/{unique_name}"
        return {"url": url, "key": unique_name}

    def get_url(self, key: str) -> str:
        # For local storage, returns API path for the file
        return f"/api/documents/files/{key}"

    def get_file_path(self, key: str) -> Path:
        """Return local filesystem path for serving the file."""
        return self.base_path / key


class CloudinaryStorageService(StorageService):
    """Cloud-based storage using Cloudinary."""

    def __init__(self):
        import cloudinary
        import cloudinary.uploader
        self.uploader = cloudinary.uploader
        # Configure from CLOUDINARY_URL env var
        cloudinary.config()

    def upload(self, file_content: bytes, file_name: str, mime_type: str) -> dict:
        # Cloudinary upload supports file-like objects
        import io
        file_obj = io.BytesIO(file_content)
        result = self.uploader.upload(
            file_obj,
            resource_type="auto",
            public_id=f"documents/{uuid.uuid4().hex}",
        )
        url = result.get("secure_url", result.get("url", ""))
        public_id = result.get("public_id", "")
        return {"url": url, "key": public_id}

    def get_url(self, key: str) -> str:
        import cloudinary
        url, _ = cloudinary.utils.cloudinary_url(key)
        return url


def get_storage_service() -> StorageService:
    """Return the configured storage service."""
    cloudinary_url = config("CLOUDINARY_URL", default=None)
    if cloudinary_url:
        return CloudinaryStorageService()
    upload_dir = config("UPLOAD_DIR", default="uploads")
    return LocalStorageService(base_path=upload_dir)
