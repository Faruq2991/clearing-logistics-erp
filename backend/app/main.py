from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from .database import engine, Base, SessionLocal
from .api.endpoints import vehicles, financials, documents, estimate, auth, users, audit_logs
from .models.user import User, UserRole
from .core.auth_utils import get_password_hash
from decouple import config

def auto_create_admin():
    # Ensure tables are created if they don't exist
    # This makes the auto-seed robust for first-time runs and uvicorn --reload
    inspector = inspect(engine)
    if not inspector.has_table("users"): # Check for existence of a key table
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        default_email = config("ADMIN_EMAIL", default="admin@example.com")
        default_password = config("ADMIN_PASSWORD", default="changeme")

        # Check if an admin with the default email already exists
        # This query will now be run on a session that should see the created tables
        existing_admin_by_email = db.query(User).filter(User.email == default_email).first()
        if existing_admin_by_email:
            print(f"✅ Admin user with email '{default_email}' already exists. Skipping auto-creation.")
            return

        # Check if any admin user exists by role if no default email admin was found
        admin_exists_by_role = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin_exists_by_role:
            admin = User(
                email=default_email,
                hashed_password=get_password_hash(default_password),
                role=UserRole.ADMIN
            )
            db.add(admin)
            db.commit()
            print(f"✅ Default admin created: {default_email}")
        else:
            print("✅ Admin user with 'ADMIN' role already exists. Skipping auto-creation.")
    except Exception as e:
        print(f"Error during auto-admin creation: {e}")
        print("Please ensure your database is accessible and migrations are up-to-date.")
    finally:
        db.close()

# Run before app starts
auto_create_admin()

app = FastAPI(
    title="Clearing & Logistics ERP",
    description="API for managing vehicle clearing, financials, and document storage.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Audit Logs"])