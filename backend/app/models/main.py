import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base
from .user import User


class DocumentType(str, enum.Enum):
    BILL_OF_LADING = "bol"
    TITLE = "title"
    CUSTOMS_ASSESSMENT = "customs_assessment"
    DUTY_RECEIPT = "duty_receipt"
    DELIVERY_ORDER = "delivery_order"


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
    agencies = Column(Float, nullable=True)
    examination = Column(Float, nullable=True)
    release = Column(Float, nullable=True)
    disc = Column(Float, nullable=True)
    gate = Column(Float, nullable=True)
    ciu = Column(Float, nullable=True)
    monitoring = Column(Float, nullable=True)
    
    # Relationships
    owner = relationship("User")
    financials = relationship("Financials", back_populates="vehicle", uselist=False)
    documents = relationship("Document", back_populates="vehicle")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    document_type = Column(String, nullable=False, index=True)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    version = Column(Integer, default=1)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    replaced_by_id = Column(Integer, ForeignKey("documents.id"), nullable=True)

    vehicle = relationship("Vehicle", back_populates="documents")


class Financials(Base):
    __tablename__ = "financials"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), unique=True, nullable=False, index=True)
    total_cost = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    exchange_rate_at_clearing = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="financials")
    payments = relationship("Payment", back_populates="financial")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    financial_id = Column(Integer, ForeignKey("financials.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, server_default=func.now(), nullable=False)
    reference = Column(String, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    notes = Column(String, nullable=True)

    financial = relationship("Financials", back_populates="payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    table_name = Column(String, nullable=False)
    record_id = Column(Integer, nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())