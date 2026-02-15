import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.models.main import Vehicle
from app.database import Base, get_db

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///../backend/./test.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate_statuses():
    db = SessionLocal()
    try:
        vehicles_to_update = db.query(Vehicle).filter(Vehicle.status.in_(['IN_TRANSIT', 'CLEARING', 'DONE'])).all()
        
        if not vehicles_to_update:
            print("No vehicles with old status format found. Migration not needed.")
            return

        print(f"Found {len(vehicles_to_update)} vehicles to migrate.")

        for vehicle in vehicles_to_update:
            old_status = vehicle.status
            if old_status == 'IN_TRANSIT':
                vehicle.status = 'In Transit'
            elif old_status == 'CLEARING':
                vehicle.status = 'Clearing'
            elif old_status == 'DONE':
                vehicle.status = 'Done'
            print(f"Updating vehicle {vehicle.id}: {old_status} -> {vehicle.status}")

        db.commit()
        print("Migration successful!")

    except Exception as e:
        print(f"An error occurred during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_statuses()
