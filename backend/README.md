# Clearing Logistics ERP Backend

This is the backend for the Clearing Logistics ERP application. It is built with FastAPI and uses a SQLite database.

## Setup

1.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

2.  Create a `.env` file in the `backend` directory and add the following line:
    ```
    DATABASE_URL="sqlite:///./sql_app.db"
    ```

## Running the application

To run the application, use the following command:

```bash
uvicorn app.main:app --reload
```
