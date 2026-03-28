from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.main import Terminal
from app.schemas.main import TerminalCreate

def create_terminal(db: Session, terminal: TerminalCreate) -> Terminal:
    db_terminal = db.query(Terminal).filter(Terminal.name == terminal.name).first()
    if db_terminal:
        raise HTTPException(status_code=400, detail="Terminal with this name already exists")
    
    new_terminal = Terminal(name=terminal.name)
    db.add(new_terminal)
    db.commit()
    db.refresh(new_terminal)
    return new_terminal

def get_terminals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Terminal).offset(skip).limit(limit).all()

def get_terminal_by_id(db: Session, terminal_id: int) -> Terminal:
    terminal = db.query(Terminal).filter(Terminal.id == terminal_id).first()
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    return terminal

def get_terminal_by_name(db: Session, terminal_name: str) -> Terminal:
    terminal = db.query(Terminal).filter(Terminal.name == terminal_name).first()
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    return terminal

def update_terminal(db: Session, terminal_id: int, terminal_update: TerminalCreate) -> Terminal:
    db_terminal = get_terminal_by_id(db, terminal_id)
    
    # Check if a terminal with the new name already exists and is not the current terminal
    existing_terminal = db.query(Terminal).filter(Terminal.name == terminal_update.name).first()
    if existing_terminal and existing_terminal.id != terminal_id:
        raise HTTPException(status_code=400, detail="Terminal with this name already exists")

    db_terminal.name = terminal_update.name
    db.commit()
    db.refresh(db_terminal)
    return db_terminal

def delete_terminal(db: Session, terminal_id: int):
    db_terminal = get_terminal_by_id(db, terminal_id)
    if db_terminal.carriers:
        raise HTTPException(status_code=400, detail="Cannot delete terminal with associated carriers")
    db.delete(db_terminal)
    db.commit()
    return {"message": "Terminal deleted successfully"}