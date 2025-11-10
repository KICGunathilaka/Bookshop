# Bookshop Management Application

A minimal full-stack app focused on authentication (login) and a dashboard. The backend uses Node.js, Express, and PostgreSQL; the frontend is Vite + React + TypeScript.

## Project Structure

- `backend/`
  - `index.js`: Express app entry, mounts `/api/auth` and enables CORS.
  - `routes/`: Route definitions (e.g., `auth.js` exposes `POST /api/auth/login`).
  - `controllers/`: Route handlers (e.g., `authController.js` performs user lookup and bcrypt password compare).
  - `config/db.js`: PostgreSQL connection pool.
  - `database.sql`: SQL schema for required tables (e.g., `users`).
  - `seedAdmin.js`: Startup seeder ensuring a default admin user exists.
- `frontend/`
  - `src/pages/LoginPage.tsx`: Login view with username/password form.
  - `src/pages/Dashboard.tsx`: Post-login landing page to start building features.
  - `src/services/api.ts`: Frontend API client (login-only).
  - `index.html`, `vite.config.ts`: Vite setup files.

## Folder Purposes

- `backend/controllers`: Encapsulates business logic for each route.
- `backend/routes`: Maps URLs to controllers.
- `backend/config`: Environment config and DB connections.
- `backend`: App entry, seeding, and server setup.
- `frontend/src/pages`: Top-level route views.
- `frontend/src/services`: API wrappers for backend endpoints.
- `frontend`: Vite project with build/dev configuration.

## Prerequisites

- Node.js
- PostgreSQL

## Getting Started

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the `backend` directory and add the following environment variables:

    ```
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_HOST=localhost
    DB_PORT=5432
    DB_DATABASE=Bookshop
    ```

4.  Create the `Bookshop` database in PostgreSQL.

5.  Run the `database.sql` script to create the `books` table. You can use a PostgreSQL client like `psql` or a GUI tool to execute the script.

6.  Start the backend server:
    ```bash
    node index.js
    ```

    The backend server will be running on `http://localhost:5000`.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Start the frontend development server:
    ```bash
    npm run dev
    ```

    The frontend application will be running on `http://localhost:5173`.