from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.main import Vehicle
from app.schemas.main import VehicleCreate, VehicleResponse
from app.database import get_db
from app.core.security import get_current_user, check_admin_privilege, check_staff_privilege
from app.models.user import User, UserRole

router = APIRouter()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    # Check if VIN already exists
    db_vehicle = db.query(Vehicle).filter(Vehicle.vin == vehicle.vin).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="VIN already registered")
    
    # Create the new record
    new_vehicle = Vehicle(**vehicle.model_dump(), owner_id=current_user.id)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

# READ: The "List" part of the Happy Path
@router.get("/", response_model=list[VehicleResponse])
def get_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in [UserRole.ADMIN, UserRole.STAFF]:
        vehicles = db.query(Vehicle).offset(skip).limit(limit).all()
    else:
        vehicles = db.query(Vehicle).filter(Vehicle.owner_id == current_user.id).offset(skip).limit(limit).all()
    return vehicles


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and db_vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this vehicle")

    return db_vehicle

# UPDATE: Full update (for correcting mistakes in VIN, Year, etc.)
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle_update: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update fields dynamically
    for key, value in vehicle_update.model_dump().items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

# DELETE: Remove a vehicle record
@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin_privilege)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(db_vehicle)
    db.commit()
    return {"message": f"Vehicle with ID {vehicle_id} successfully deleted"}

# UPDATE: Change status (In Transit -> Clearing -> Done)
@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(vehicle_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(check_staff_privilege)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db_vehicle.status = status
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle
