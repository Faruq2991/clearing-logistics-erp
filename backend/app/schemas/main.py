from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.main import ClearanceType


# Terminal Schemas
class TerminalBase(BaseModel):
    name: str

class TerminalCreate(TerminalBase):
    pass

class TerminalResponse(TerminalBase):
    id: int
    carriers: List["CarrierResponse"] = [] # Forward reference

    class Config:
        from_attributes = True


# Carrier Schemas
class CarrierBase(BaseModel):
    name: str
    terminal_id: int

class CarrierCreate(CarrierBase):
    pass

class CarrierResponse(CarrierBase):
    id: int
    terminal: TerminalBase # Simplified for nesting, TerminalResponse would cause circular dependency
    ships: List["ShipResponse"] = [] # Forward reference

    class Config:
        from_attributes = True


# Ship Schemas
class ShipBase(BaseModel):
    name: str
    carrier_id: int

class ShipCreate(ShipBase):
    pass

class ShipResponse(ShipBase):
    id: int
    carrier: CarrierBase # Simplified for nesting, CarrierResponse would cause circular dependency

    class Config:
        from_attributes = True


# Vehicle Schemas
class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    # Use IDs instead of strings for relationships
    ship_id: Optional[int] = None
    terminal_id: Optional[int] = None
    arrival_date: Optional[datetime] = None
    status: str = "In Transit"
    agencies: Optional[float] = None
    examination: Optional[float] = None
    release: Optional[float] = None
    disc: Optional[float] = None
    gate: Optional[float] = None
    ciu: Optional[float] = None
    monitoring: Optional[float] = None
    clearance_type: ClearanceType = ClearanceType.FULL
    estimated_total_cost: Optional[float] = None

class VehicleResponse(VehicleCreate):
    id: int
    # Include full related objects for responses
    terminal_obj: Optional[TerminalResponse] = None
    ship_obj: Optional[ShipResponse] = None

    class Config:
        from_attributes = True

# Update forward references
TerminalResponse.model_rebuild()
CarrierResponse.model_rebuild()
ShipResponse.model_rebuild()