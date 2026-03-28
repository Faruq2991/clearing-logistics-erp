from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.main import TerminalCreate, TerminalResponse
from app.services import terminal_service
from app.schemas.user import UserResponse
from app.core.auth_utils import get_current_user, is_admin_or_staff

router = APIRouter(
    prefix="/terminals",
    tags=["Terminals"]
)

@router.post("/", response_model=TerminalResponse, status_code=status.HTTP_201_CREATED)
def create_new_terminal(
    terminal: TerminalCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return terminal_service.create_terminal(db=db, terminal=terminal)

@router.get("/", response_model=List[TerminalResponse])
def read_terminals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return terminal_service.get_terminals(db=db, skip=skip, limit=limit)

@router.get("/{terminal_id}", response_model=TerminalResponse)
def read_terminal(
    terminal_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return terminal_service.get_terminal_by_id(db=db, terminal_id=terminal_id)

@router.put("/{terminal_id}", response_model=TerminalResponse)
def update_single_terminal(
    terminal_id: int,
    terminal_update: TerminalCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return terminal_service.update_terminal(db=db, terminal_id=terminal_id, terminal_update=terminal_update)

@router.delete("/{terminal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_terminal(
    terminal_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    is_admin_or_staff(current_user)
    return terminal_service.delete_terminal(db=db, terminal_id=terminal_id)