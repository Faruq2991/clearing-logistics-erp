from fastapi import APIRouter

router = APIRouter()


@router.post("/")
def get_estimate():
    return {"estimate": 5000}
