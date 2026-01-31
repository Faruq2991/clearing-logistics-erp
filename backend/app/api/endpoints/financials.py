from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def read_financials():
    return [{"vehicle_id": 1, "total_cost": 10000}]
