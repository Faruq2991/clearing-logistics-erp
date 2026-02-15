from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    ship_name: Optional[str] = None
    terminal: Optional[str] = None
    arrival_date: Optional[datetime] = None
    status: str = "In Transit"
    agencies: Optional[float] = None
    examination: Optional[float] = None
    release: Optional[float] = None
    disc: Optional[float] = None
    gate: Optional[float] = None
    ciu: Optional[float] = None
    monitoring: Optional[float] = None

class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        from_attributes = True # Tells Pydantic to read data from SQLAlchemy models