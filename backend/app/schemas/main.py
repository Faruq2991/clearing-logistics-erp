from pydantic import BaseModel
from typing import Optional

class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int

class VehicleResponse(VehicleCreate):
    id: int
    status: str

    class Config:
        from_attributes = True # Tells Pydantic to read data from SQLAlchemy models