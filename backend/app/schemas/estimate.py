from pydantic import BaseModel, ConfigDict, Field


class GlobalSearch(BaseModel):
    make: str
    model: str
    year: int


class GlobalSearchResult(BaseModel):
    average_clearing_cost: float
    sample_size: int
    is_normalized: bool
    match_type: str

    model_config = ConfigDict(from_attributes=True)


class CostOfRunningCreate(BaseModel):
    vehicle_cost: float = Field(gt=0)
    shipping_fees: float = Field(gt=0)
    customs_duty: float = Field(gt=0)
    terminal: str


class CostOfRunning(BaseModel):
    total_estimate: float

    model_config = ConfigDict(from_attributes=True)
