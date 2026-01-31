from fastapi import APIRouter

router = APIRouter()


@router.post("/upload")
def upload_document():
    return {"message": "Document uploaded successfully"}
