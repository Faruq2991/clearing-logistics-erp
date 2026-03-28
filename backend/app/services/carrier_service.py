from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List

from app.models.main import Carrier, Terminal
from app.schemas.main import CarrierCreate

def create_carrier(db: Session, carrier: CarrierCreate) -> Carrier:
    db_carrier = db.query(Carrier).filter(Carrier.name == carrier.name, Carrier.terminal_id == carrier.terminal_id).first()
    if db_carrier:
        raise HTTPException(status_code=400, detail="Carrier with this name already exists for this terminal")
    
    # Check if terminal exists
    db_terminal = db.query(Terminal).filter(Terminal.id == carrier.terminal_id).first()
    if not db_terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")

    new_carrier = Carrier(name=carrier.name, terminal_id=carrier.terminal_id)
    db.add(new_carrier)
    db.commit()
    db.refresh(new_carrier)
    return new_carrier

def get_carriers(db: Session, skip: int = 0, limit: int = 100) -> List[Carrier]:
    return db.query(Carrier).options(joinedload(Carrier.terminal)).offset(skip).limit(limit).all()

def get_carrier_by_id(db: Session, carrier_id: int) -> Carrier:
    carrier = db.query(Carrier).options(joinedload(Carrier.terminal)).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier

def get_carriers_by_terminal_id(db: Session, terminal_id: int, skip: int = 0, limit: int = 100) -> List[Carrier]:
    return db.query(Carrier).options(joinedload(Carrier.terminal)).filter(Carrier.terminal_id == terminal_id).offset(skip).limit(limit).all()

def update_carrier(db: Session, carrier_id: int, carrier_update: CarrierCreate) -> Carrier:
    db_carrier = get_carrier_by_id(db, carrier_id)
    
    # Check if terminal exists
    db_terminal = db.query(Terminal).filter(Terminal.id == carrier_update.terminal_id).first()
    if not db_terminal:
        raise HTTPException(status_code=404, detail="Terminal not found for update")

    # Check for duplicate name within the same terminal, excluding the current carrier
    existing_carrier = db.query(Carrier).filter(
        Carrier.name == carrier_update.name, 
        Carrier.terminal_id == carrier_update.terminal_id, 
        Carrier.id != carrier_id
    ).first()
    if existing_carrier:
        raise HTTPException(status_code=400, detail="Carrier with this name already exists for this terminal")

    db_carrier.name = carrier_update.name
    db_carrier.terminal_id = carrier_update.terminal_id
    db.commit()
    db.refresh(db_carrier)
    return db_carrier

def delete_carrier(db: Session, carrier_id: int):
    db_carrier = get_carrier_by_id(db, carrier_id)
    if db_carrier.ships:
        raise HTTPException(status_code=400, detail="Cannot delete carrier with associated ships")
    db.delete(db_carrier)
    db.commit()
    return {"message": "Carrier deleted successfully"}