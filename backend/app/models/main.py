from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .user import User

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True)
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    color = Column(String)
    ship_name = Column(String)
    terminal = Column(String)
    arrival_date = Column(DateTime)
    status = Column(String, default="In Transit")
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationship
    owner = relationship("User")
    financials = relationship("Financials", back_populates="vehicle")

class Financials(Base):
    __tablename__ = "financials"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    total_cost = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    # Important: Record the rate when the car was cleared
    exchange_rate_at_clearing = Column(Float, nullable=True) 
    
    # Relationship
    vehicle = relationship("Vehicle", back_populates="financials")