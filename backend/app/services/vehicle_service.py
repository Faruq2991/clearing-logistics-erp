from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from fastapi import HTTPException, status

from app.models.main import Vehicle
from app.schemas.main import VehicleCreate, VehicleResponse
from app.models.user import User, UserRole
from app.core.auditing import log_action

def create_new_vehicle(db: Session, vehicle_data: VehicleCreate, current_user_id: int) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(Vehicle.vin == vehicle_data.vin).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="VIN already registered")
    
    new_vehicle = Vehicle(**vehicle_data.model_dump(), owner_id=current_user_id)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    
    log_action(
        db=db,
        user_id=current_user_id,
        action="create",
        table_name="vehicles",
        record_id=new_vehicle.id,
        new_value=vehicle_data.model_dump()
    )
    db.commit()
    
    return new_vehicle

def get_vehicles_list(db: Session, current_user: User, skip: int = 0, limit: int = 100, search: str = None, status: str = None) -> List[Vehicle]:
    query = db.query(Vehicle)

    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        query = query.filter(Vehicle.owner_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                Vehicle.vin.ilike(f"%{search}%"),
                Vehicle.make.ilike(f"%{search}%")
            )
        )
    
    if status and status != 'ALL':
        query = query.filter(Vehicle.status == status)

    vehicles = query.offset(skip).limit(limit).all()
    return vehicles

def get_vehicle_by_id(db: Session, vehicle_id: int, current_user: User) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and db_vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this vehicle")
    
    return db_vehicle

def update_existing_vehicle(db: Session, vehicle_id: int, vehicle_update_data: VehicleCreate) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update fields dynamically
    for key, value in vehicle_update_data.model_dump().items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def delete_vehicle_record(db: Session, vehicle_id: int):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(db_vehicle)
    db.commit()
    return {"message": f"Vehicle with ID {vehicle_id} successfully deleted"}

def update_vehicle_status(db: Session, vehicle_id: int, new_status: str) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db_vehicle.status = new_status
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle
