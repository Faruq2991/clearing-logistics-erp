from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.main import ShipCreate, ShipResponse
from app.services import ship_service
from app.models.user import User
from app.core.auth_utils import get_current_user, is_admin_or_staff

router = APIRouter(
    prefix="/ships",
    tags=["Ships"]
)

@router.post("/", response_model=ShipResponse, status_code=status.HTTP_201_CREATED)
def create_new_ship(
    ship: ShipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return ship_service.create_ship(db=db, ship=ship)

@router.get("/", response_model=List[ShipResponse])
def read_ships(
    skip: int = 0,
    limit: int = 100,
    carrier_id: int = None, # Optional filter by carrier
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if carrier_id:
        return ship_service.get_ships_by_carrier_id(db=db, carrier_id=carrier_id, skip=skip, limit=limit)
    return ship_service.get_ships(db=db, skip=skip, limit=limit)

@router.get("/{ship_id}", response_model=ShipResponse)
def read_ship(
    ship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ship_service.get_ship_by_id(db=db, ship_id=ship_id)

@router.put("/{ship_id}", response_model=ShipResponse)
def update_single_ship(
    ship_id: int,
    ship_update: ShipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return ship_service.update_ship(db=db, ship_id=ship_id, ship_update=ship_update)

@router.delete("/{ship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_ship(
    ship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return ship_service.delete_ship(db=db, ship_id=ship_id)