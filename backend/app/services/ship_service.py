from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List

from app.models.main import Ship, Carrier
from app.schemas.main import ShipCreate

def create_ship(db: Session, ship: ShipCreate) -> Ship:
    db_ship = db.query(Ship).filter(Ship.name == ship.name, Ship.carrier_id == ship.carrier_id).first()
    if db_ship:
        raise HTTPException(status_code=400, detail="Ship with this name already exists for this carrier")
    
    # Check if carrier exists
    db_carrier = db.query(Carrier).filter(Carrier.id == ship.carrier_id).first()
    if not db_carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    new_ship = Ship(name=ship.name, carrier_id=ship.carrier_id)
    db.add(new_ship)
    db.commit()
    db.refresh(new_ship)
    return new_ship

def get_ships(db: Session, skip: int = 0, limit: int = 100, carrier_id: int = None, terminal_id: int = None) -> List[Ship]:
    query = db.query(Ship).options(joinedload(Ship.carrier))

    if carrier_id is not None:
        query = query.filter(Ship.carrier_id == carrier_id)
    
    if terminal_id is not None:
        query = query.join(Carrier).filter(Carrier.terminal_id == terminal_id)

    return query.offset(skip).limit(limit).all()

def get_ship_by_id(db: Session, ship_id: int) -> Ship:
    ship = db.query(Ship).options(joinedload(Ship.carrier)).filter(Ship.id == ship_id).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    return ship



def update_ship(db: Session, ship_id: int, ship_update: ShipCreate) -> Ship:
    db_ship = get_ship_by_id(db, ship_id)

    # Check if carrier exists
    db_carrier = db.query(Carrier).filter(Carrier.id == ship_update.carrier_id).first()
    if not db_carrier:
        raise HTTPException(status_code=404, detail="Carrier not found for update")
    
    # Check for duplicate name within the same carrier, excluding the current ship
    existing_ship = db.query(Ship).filter(
        Ship.name == ship_update.name, 
        Ship.carrier_id == ship_update.carrier_id, 
        Ship.id != ship_id
    ).first()
    if existing_ship:
        raise HTTPException(status_code=400, detail="Ship with this name already exists for this carrier")

    db_ship.name = ship_update.name
    db_ship.carrier_id = ship_update.carrier_id
    db.commit()
    db.refresh(db_ship)
    return db_ship

def delete_ship(db: Session, ship_id: int):
    db_ship = get_ship_by_id(db, ship_id)
    # Potentially check for associated vehicles before deleting a ship
    # For now, let's assume cascade delete is handled at the model level or vehicles are disassociated
    db.delete(db_ship)
    db.commit()
    return {"message": "Ship deleted successfully"}