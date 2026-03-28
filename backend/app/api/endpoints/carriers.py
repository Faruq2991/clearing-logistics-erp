from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.main import CarrierCreate, CarrierResponse
from app.services import carrier_service
from app.schemas.user import UserResponse
from app.core.auth_utils import get_current_user, is_admin_or_staff

router = APIRouter(
    prefix="/carriers",
    tags=["Carriers"]
)

@router.post("/", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
def create_new_carrier(
    carrier: CarrierCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return carrier_service.create_carrier(db=db, carrier=carrier)

@router.get("/", response_model=List[CarrierResponse])
def read_carriers(
    skip: int = 0,
    limit: int = 100,
    terminal_id: int = None, # Optional filter by terminal
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if terminal_id:
        return carrier_service.get_carriers_by_terminal_id(db=db, terminal_id=terminal_id, skip=skip, limit=limit)
    return carrier_service.get_carriers(db=db, skip=skip, limit=limit)

@router.get("/{carrier_id}", response_model=CarrierResponse)
def read_carrier(
    carrier_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return carrier_service.get_carrier_by_id(db=db, carrier_id=carrier_id)

@router.put("/{carrier_id}", response_model=CarrierResponse)
def update_single_carrier(
    carrier_id: int,
    carrier_update: CarrierCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return carrier_service.update_carrier(db=db, carrier_id=carrier_id, carrier_update=carrier_update)

@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_carrier(
    carrier_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return carrier_service.delete_carrier(db=db, carrier_id=carrier_id)