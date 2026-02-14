import os
import shutil
from fastapi import UploadFile
from typing import Tuple

class LocalStorageService:
    def __init__(self, upload_dir: str = "uploads", base_url: str = "/api/documents/files"):
        self.upload_dir = upload_dir
        self.base_url = base_url
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_file_url(self, filename: str) -> str:
        """Constructs the full URL for a given filename."""
        return f"{self.base_url}/{filename}"
        
    def get_file_path(self, filename: str) -> str:
        """Constructs the full file path for a given filename."""
        return os.path.join(self.upload_dir, filename)

    async def save_file(
        self, file: UploadFile, vehicle_id: int
    ) -> Tuple[str, str, str, int, str]:
        """
        Saves an uploaded file locally and returns its details.
        Returns: file_url, original_filename, mime_type, file_size, unique_filename
        """
        if not file.filename:
            raise ValueError("File must have a filename.")

        unique_filename = f"{vehicle_id}_{os.path.basename(file.filename)}"
        file_path = self.get_file_path(unique_filename)

        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        file_url = self.get_file_url(unique_filename)
        
        return file_url, file.filename, file.content_type or 'application/octet-stream', file_size, unique_filename

# Create a singleton instance
storage_service = LocalStorageService()