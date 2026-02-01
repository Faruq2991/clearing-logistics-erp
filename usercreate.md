# Detailed Procedure for Creating Users with Different Roles

This guide will walk you through the process of creating an Admin user, a Staff user, and a Guest user for your FastAPI application. It's designed for novices, providing step-by-step instructions.

**Assumptions:**

*   Your FastAPI application is running locally (e.g., on `http://127.0.0.1:8000`).
*   You have `Postman` installed and ready to use.
*   You have a way to access your SQLite database (e.g., the `sqlite3` command-line tool or a GUI like DB Browser for SQLite).

---

## 1. Creating the Initial Admin User (One-Time Manual Setup)

Since there's no public "register as admin" option for security reasons, the first admin account needs to be created in two steps: register as a regular user, then manually promote them in the database.

### Step 1.1: Register a User (as a Guest)

We'll use Postman to register an account that will later become our admin. This account will initially have the default `GUEST` role.

1.  **Open Postman.**
2.  **Create a New Request:** Click the `+` icon to open a new request tab.
3.  **Set Method:** Change the dropdown from `GET` to `POST`.
4.  **Set URL:** Enter `http://127.0.0.1:8000/api/auth/register`.
5.  **Set Headers:**
    *   Go to the `Headers` tab.
    *   Add a new header:
        *   `Key`: `Content-Type`
        *   `Value`: `application/json`
6.  **Set Body:**
    *   Go to the `Body` tab.
    *   Select the `raw` radio button.
    *   From the dropdown next to `raw`, choose `JSON`.
    *   Enter the following JSON, replacing with your desired admin email and a strong password:
        ```json
        {
            "email": "your.admin@example.com",
            "password": "your_strong_admin_password"
        }
        ```
7.  **Send Request:** Click the `Send` button.

    *   **Expected Response (Status 200 OK):**
        ```json
        {
            "id": 1,
            "email": "your.admin@example.com",
            "role": "GUEST"
        }
        ```
    *   Make a note of the `email` you used.

### Step 1.2: Manually Promote the User to Admin in the Database

Now we'll directly modify the database to change the registered user's role from `GUEST` to `ADMIN`.

1.  **Locate your database file:** Your SQLite database file is typically named `clearing_erp.db` and is located in the `backend/` directory of your project (e.g., `/home/faruq/clearing-logistics-erp/backend/clearing_erp.db`).
2.  **Open your database:**
    *   **Using `sqlite3` CLI (recommended for quick access):**
        *   Open your terminal/command prompt.
        *   Navigate to your `backend/` directory: `cd /home/faruq/clearing-logistics-erp/backend`
        *   Open the database: `sqlite3 clearing_erp.db`
    *   **Using DB Browser for SQLite (GUI):**
        *   Open DB Browser.
        *   Click `Open Database` and navigate to and select `clearing_erp.db`.
3.  **Run the SQL command:**
    *   **In `sqlite3` CLI:** Type the following command and press Enter:
        ```sql
        UPDATE users SET role = 'ADMIN' WHERE email = 'your.admin@example.com';
        ```
        (Replace `your.admin@example.com` with the email you registered in Step 1.1).
        *   Verify the change: `SELECT id, email, role FROM users;`
        *   Exit `sqlite3`: `.quit`
    *   **In DB Browser for SQLite:**
        *   Go to the `Execute SQL` tab.
        *   Enter the `UPDATE` command (as above) and click the "play" button.
        *   Go to the `Browse Data` tab, select the `users` table, and confirm the role has changed.

    *   **Result:** Your `your.admin@example.com` account now has the `ADMIN` role.

---

## 2. Admin Login and Token Acquisition (Postman)

Before you can perform any admin actions (like creating staff users), you need to log in as your newly promoted admin and get an authentication token (JWT).

1.  **Open Postman.**
2.  **Create a New Request:** Click the `+` icon.
3.  **Set Method:** Change to `POST`.
4.  **Set URL:** Enter `http://127.0.0.1:8000/api/auth/login`.
5.  **Set Body:**
    *   Go to the `Body` tab.
    *   Select `x-www-form-urlencoded`.
    *   Add two key-value pairs:
        *   `Key`: `username`, `Value`: `your.admin@example.com`
        *   `Key`: `password`, `Value`: `your_strong_admin_password`
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