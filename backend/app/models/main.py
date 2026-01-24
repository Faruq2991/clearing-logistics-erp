from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String, default="In Transit") # In Transit, Clearing, Done
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to Financials
    financials = relationship("Financials", back_populates="vehicle", uselist=False)

class Financials(Base):
    __tablename__ = "financials"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    total_cost = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    # Important: Record the rate when the car was cleared
    exchange_rate_at_clearing = Column(Float, nullable=True) 
    
    vehicle = relationship("Vehicle", back_populates="financials")