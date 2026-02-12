from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.endpoints import documents as documents_endpoints
from app.api.endpoints import financials as financials_endpoints
from app.schemas.main import VehicleCreate, VehicleResponse
from app.database import get_db
from app.core.security import get_current_user, check_admin_privilege, check_staff_privilege
from app.models.user import User, UserRole

# Import the new service
from app.services import vehicle_service

router = APIRouter()

# Include vehicle-scoped document endpoints: GET/POST /api/vehicles/{vehicle_id}/documents
router.include_router(
    documents_endpoints.vehicle_documents_router,
    prefix="/{vehicle_id}/documents",
    tags=["Vehicle Documents"],
)
# Include vehicle-scoped financial endpoints: GET/POST/PATCH /api/vehicles/{vehicle_id}/financials
router.include_router(
    financials_endpoints.vehicle_financials_router,
    prefix="/{vehicle_id}/financials",
    tags=["Vehicle Financials"],
)

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    return vehicle_service.create_new_vehicle(db, vehicle, current_user.id)

# READ: The "List" part of the Happy Path
@router.get("/", response_model=list[VehicleResponse])
def get_vehicles(skip: int = 0, limit: int = 100, search: str = None, status: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return vehicle_service.get_vehicles_list(db, current_user, skip, limit, search, status)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return vehicle_service.get_vehicle_by_id(db, vehicle_id, current_user)

# UPDATE: Full update (for correcting mistakes in VIN, Year, etc.)
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle_update: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    return vehicle_service.update_existing_vehicle(db, vehicle_id, vehicle_update)

# DELETE: Remove a vehicle record
@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin_privilege)):
    return vehicle_service.delete_vehicle_record(db, vehicle_id)

# UPDATE: Change status (In Transit -> Clearing -> Done)
@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(vehicle_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    return vehicle_service.update_vehicle_status(db, vehicle_id, status)
