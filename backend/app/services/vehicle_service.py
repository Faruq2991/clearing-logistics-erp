from sqlalchemy.orm import Session, joinedload 
from sqlalchemy import or_
from typing import List
from fastapi import HTTPException, status

from app.models.main import Vehicle, Financials, Terminal, Ship 
from app.schemas.main import VehicleCreate, VehicleResponse
from app.models.user import User, UserRole
from app.core.auditing import log_action

def create_new_vehicle(db: Session, vehicle_data: VehicleCreate, current_user_id: int) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(
        Vehicle.vin == vehicle_data.vin,
        Vehicle.owner_id == current_user_id
    ).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="VIN already registered for this user")
    
    # Validate terminal_id and ship_id
    if vehicle_data.terminal_id:
        terminal = db.query(Terminal).filter(Terminal.id == vehicle_data.terminal_id).first()
        if not terminal:
            raise HTTPException(status_code=404, detail="Terminal not found")
    
    if vehicle_data.ship_id:
        ship = db.query(Ship).filter(Ship.id == vehicle_data.ship_id).first()
        if not ship:
            raise HTTPException(status_code=404, detail="Ship not found")

    # Separate estimated_total_cost before creating the Vehicle object
    vehicle_dict = vehicle_data.model_dump()
    estimated_cost = vehicle_dict.pop("estimated_total_cost", None)
    # Remove old string fields if they were still present in the model_dump (though they shouldn't be with updated schemas)
    vehicle_dict.pop("ship_name", None)
    vehicle_dict.pop("terminal", None)


    new_vehicle = Vehicle(**vehicle_dict, owner_id=current_user_id)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    # If an estimated cost was provided (for "Full Clearance"), create a financials record
    if estimated_cost is not None:
        financials = Financials(
            vehicle_id=new_vehicle.id,
            total_cost=estimated_cost,
            amount_paid=0
        )
        db.add(financials)
        log_action(
            db=db,
            user_id=current_user_id,
            action="create",
            table_name="financials",
            record_id=financials.id,
            new_value={"total_cost": estimated_cost}
        )

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
    query = db.query(Vehicle).options(
        joinedload(Vehicle.terminal_obj), 
        joinedload(Vehicle.ship_obj)      
    ).filter(Vehicle.owner_id == current_user.id)

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
    db_vehicle = db.query(Vehicle).options(
        joinedload(Vehicle.terminal_obj), 
        joinedload(Vehicle.ship_obj)      
    ).filter(Vehicle.id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail=f"Vehicle with id {vehicle_id} not found")
    
    if db_vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this vehicle")
    
    return db_vehicle

def update_existing_vehicle(db: Session, vehicle_id: int, vehicle_update_data: VehicleCreate, current_user: User) -> Vehicle:
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Validate terminal_id and ship_id if they are being updated
    if vehicle_update_data.terminal_id is not None:
        terminal = db.query(Terminal).filter(Terminal.id == vehicle_update_data.terminal_id).first()
        if not terminal:
            raise HTTPException(status_code=404, detail="Terminal not found")
    
    if vehicle_update_data.ship_id is not None:
        ship = db.query(Ship).filter(Ship.id == vehicle_update_data.ship_id).first()
        if not ship:
            raise HTTPException(status_code=404, detail="Ship not found")

    # Capture old state as a dictionary
    old_vehicle_data = {c.name: getattr(db_vehicle, c.name) for c in db_vehicle.__table__.columns}

    update_data = vehicle_update_data.model_dump(exclude_unset=True)
    # Remove old string fields if they were still present in the model_dump (though they shouldn't be with updated schemas)
    update_data.pop("ship_name", None)
    update_data.pop("terminal", None)


    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    
    log_action(
        db=db,
        user_id=current_user.id,
        action="update",
        table_name="vehicles",
        record_id=db_vehicle.id,
        old_value=old_vehicle_data,
        new_value=update_data,
    )
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def delete_vehicle_record(db: Session, vehicle_id: int, current_user: User):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    old_vehicle_data = {c.name: getattr(db_vehicle, c.name) for c in db_vehicle.__table__.columns}

    log_action(
        db=db,
        user_id=current_user.id,
        action="delete",
        table_name="vehicles",
        record_id=db_vehicle.id,
        old_value=old_vehicle_data
    )

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

def check_vin_exists(db: Session, vin: str, current_user_id: int) -> bool:
    return db.query(Vehicle).filter(Vehicle.vin == vin, Vehicle.owner_id == current_user_id).first() is not None
