# Clearing Logistics ERP Backend

This is the backend for the Clearing Logistics ERP application. It is built with FastAPI and uses a SQLite database.

## Setup

1.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

2.  Create a `.env` file in the `backend` directory with:
    ```
    DATABASE_URL="sqlite:///./clearing_erp.db"
    SECRET_KEY="your-secret-key-for-jwt"
    CUSTOMS_EXCHANGE_RATE=1600.00
    ```
    Optional: `CLOUDINARY_URL` for document storage; `UPLOAD_DIR` for local upload path.

## Running the application

To run the application, use the following command:

```bash
uvicorn app.main:app --reload
```
