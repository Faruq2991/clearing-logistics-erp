# Detailed Procedure for Creating Users with Different Roles

This guide will walk you through the process of creating an Admin user, a Staff user, and a Guest user for your FastAPI application. It's designed for novices, providing step-by-step instructions.

**Assumptions:**

*   Your FastAPI application is running locally (e.g., on `http://127.0.0.1:8000`).
*   You have `Postman` installed and ready to use.
*   You have deleted `backend/clearing_erp.db` if you want to re-run the auto-seed admin process.

---

## 1. Initial Admin User Setup

With the "Auto-Seed on Startup" approach, an initial admin user is automatically created when your application starts up and no admin users exist in the database.

### Step 1.1: Configure Admin Credentials (Optional)

By default, the auto-seeded admin uses:
*   **Email:** `admin@example.com`
*   **Password:** `changeme`

You can customize these credentials by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `backend/.env` file.

```dotenv
DATABASE_URL="sqlite:///./clearing_erp.db"
ADMIN_EMAIL="my.custom.admin@example.com"
ADMIN_PASSWORD="my_secret_admin_password"
```
**Important:** If you change these, ensure you restart your FastAPI application (`uvicorn app.main:app --reload`).

### Step 1.2: Start the Application to Auto-Create Admin

1.  **Ensure no admin user exists:** If you've been testing and have an existing admin, you might need to delete your `backend/clearing_erp.db` file (and restart the app) to trigger the auto-creation process for a fresh start.
2.  **Run your FastAPI application.**
    ```bash
    cd backend
    venv/bin/uvicorn app.main:app --reload --port 8000
    ```
    *   **Expected Output in console:** You should see a message like `✅ Default admin created: admin@example.com` (or your custom email).

    *   **Result:** Your designated admin account is now created with the `ADMIN` role.

---

## 2. Admin Login and Token Acquisition (Postman)

Before you can perform any admin actions (like creating staff users), you need to log in as your admin user and get an authentication token (JWT).

1.  **Open Postman.**
2.  **Create a New Request:** Click the `+` icon to open a new request tab.
3.  **Set Method:** Change the dropdown from `GET` to `POST`.
4.  **Set URL:** Enter `http://127.0.0.1:8000/api/auth/login`.
5.  **Set Body:**
    *   Go to the `Body` tab.
    *   Select `x-www-form-urlencoded`.
    *   Add two key-value pairs:
        *   `Key`: `username`, `Value`: `admin@example.com` (or `my.custom.admin@example.com`)
        *   `Key`: `password`, `Value`: `changeme` (or `my_secret_admin_password`)
6.  **Send Request:** Click `Send`.

    *   **Expected Response (Status 200 OK):**
        ```json
        {
            "access_token": "eyJhbGciOiJIUzI1Ni...", // A very long string
            "token_type": "bearer"
        }
        ```
    *   **Action:** Copy the entire `access_token` string. This is your **Admin JWT Token**. You will use this token in the `Authorization` header for all requests that require admin privileges.

---

## 3. Creating a Staff User (Postman, using Admin Token)

Now that you have your Admin JWT Token, you can create other users, including Staff members, directly through the API with their assigned roles.

1.  **Open Postman.**
2.  **Create a New Request:** Click the `+` icon.
3.  **Set Method:** Change to `POST`.
4.  **Set URL:** Enter `http://127.0.0.1:8000/api/users/`.
5.  **Set Authorization:**
    *   Go to the `Authorization` tab.
    *   From the `Type` dropdown, select `Bearer Token`.
    *   In the `Token` field, paste your **Admin JWT Token** that you copied in Section 2.
6.  **Set Headers:**
    *   Go to the `Headers` tab.
    *   Add a new header:
        *   `Key`: `Content-Type`
        *   `Value`: `application/json`
7.  **Set Body:**
    *   Go to the `Body` tab.
    *   Select the `raw` radio button.
    *   Choose `JSON` from the dropdown.
    *   Enter the following JSON for your new staff user:
        ```json
        {
            "email": "new.staff@example.com",
            "password": "staff_secure_password",
            "role": "STAFF"
        }
        ```
8.  **Send Request:** Click `Send`.

    *   **Expected Response (Status 200 OK):**
        ```json
        {
            "id": 2, // Or next available ID
            "email": "new.staff@example.com",
            "role": "STAFF"
        }
        ```
    *   You have successfully created a Staff user!

---

## 4. Creating a Guest User (Postman, using Public Register Endpoint)

You can also create a Guest user using the public registration endpoint. This endpoint does not require an admin token and will always assign the `GUEST` role by default.

1.  **Open Postman.**
2.  **Create a New Request:** Click the `+` icon.
3.  **Set Method:** Change to `POST`.
4.  **Set URL:** Enter `http://127.0.0.1:8000/api/auth/register`.
5.  **Set Headers:**
    *   Go to the `Headers` tab.
    *   Add a new header:
        *   `Key`: `Content-Type`
        *   `Value`: `application/json`
6.  **Set Body:**
    *   Go to the `Body` tab.
    *   Select `raw`, and choose `JSON`.
    *   Enter the following JSON for your new guest user:
        ```json
        {
            "email": "new.guest@example.com",
            "password": "guest_easy_password"
        }
        ```
7.  **Send Request:** Click `Send`.

    *   **Expected Response (Status 200 OK):**
        ```json
        {
            "id": 3, // Or next available ID
            "email": "new.guest@example.com",
            "role": "GUEST"
        }
        ```
    *   You have successfully created a Guest user!

---

This completes the detailed procedure for creating users with different roles. Remember to replace placeholder emails and passwords with your actual data.