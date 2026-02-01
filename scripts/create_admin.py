import sys
import os

# Add the parent directory (backend) to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.auth_utils import get_password_hash # Corrected function name

def create_admin():
    db = SessionLocal()
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")

    # Ensure tables are created if this script is run standalone
    # This might create tables outside of alembic's management if not careful
    # Base.metadata.create_all(bind=engine) 

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("❌ User with that email already exists.")
        db.close()
        return

    admin = User(
        email=email,
        hashed_password=get_password_hash(password),
        role=UserRole.ADMIN # Use the Enum directly
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"✅ Admin created: {admin.email} (ID: {admin.id})")
    db.close()

if __name__ == "__main__":
    create_admin()