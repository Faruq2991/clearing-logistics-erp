from fastapi import FastAPI
from .database import engine, Base, SessionLocal
from .api.endpoints import vehicles, financials, documents, estimate, auth, users
from .models.user import User, UserRole
from .core.auth_utils import get_password_hash
from decouple import config

# Create all tables in the database
Base.metadata.create_all(bind=engine)

def auto_create_admin():
    db = SessionLocal()
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin_exists:
        default_email = config("ADMIN_EMAIL", default="admin@example.com")
        default_password = config("ADMIN_PASSWORD", default="changeme")
        
        # Check if an admin with the default email already exists
        if db.query(User).filter(User.email == default_email).first():
            print(f"Admin user with email '{default_email}' already exists. Skipping auto-creation.")
            db.close()
            return

        admin = User(
            email=default_email,
            hashed_password=get_password_hash(default_password),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        print(f"✅ Default admin created: {default_email}")
    db.close()

# Run before app starts
auto_create_admin()

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