from fastapi import FastAPI
from .database import engine, Base
from .api.endpoints import vehicles, financials, documents, estimate, auth, users

# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clearing & Logistics ERP",
    description="API for managing vehicle clearing, financials, and document storage.",
    version="0.1.0"
)

@app.get("/")
def health_check():
    return {"status": "System is Online", "path": "Happy Path"}

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(financials.router, prefix="/api/financials", tags=["Financials"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(estimate.router, prefix="/api/estimate", tags=["Estimator"])