import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def get_database_url_from_env(env_path):
    if not os.path.exists(env_path):
        print(f"Error: .env file not found at {env_path}")
        return None
    with open(env_path, 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                return line.strip().split('=', 1)[1].strip().strip('"').strip("'")
    return None

def normalize_clearance_types():
    """
    Connects to the database and updates the clearance_type column
    from lowercase to uppercase.
    """
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    print(f"Loading .env file from: {dotenv_path}")
    
    database_url = get_database_url_from_env(dotenv_path)
    
    if not database_url:
        print("Error: DATABASE_URL not found in .env file")
        return

    print(f"Connecting to database: {database_url}")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("Updating 'full' to 'FULL'...")
        updated_full = db.execute(
            text("UPDATE vehicles SET clearance_type = 'FULL' WHERE clearance_type = 'full'")
        )
        db.commit()
        print(f"Updated {updated_full.rowcount} records from 'full' to 'FULL'.")

        print("Updating 'release_gate' to 'RELEASE_GATE'...")
        updated_rg = db.execute(
            text("UPDATE vehicles SET clearance_type = 'RELEASE_GATE' WHERE clearance_type = 'release_gate'")
        )
        db.commit()
        print(f"Updated {updated_rg.rowcount} records from 'release_gate' to 'RELEASE_GATE'.")

        print("Normalization complete.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    normalize_clearance_types()
