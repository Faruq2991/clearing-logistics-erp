from pydantic import BaseModel, ConfigDict


class CostOfRunningCreate(BaseModel):
    vehicle_cost: float
    shipping_fees: float
    customs_duty: float
    terminal: str


class CostOfRunning(BaseModel):
    total_estimate: float

    model_config = ConfigDict(from_attributes=True)
