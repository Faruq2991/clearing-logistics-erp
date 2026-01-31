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

class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        from_attributes = True # Tells Pydantic to read data from SQLAlchemy models