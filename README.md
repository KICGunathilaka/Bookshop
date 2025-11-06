# Bookshop Management Application

This is a full-stack web application for managing a bookshop. The backend is built with Node.js, Express, and PostgreSQL. The frontend is a single-page application built with a modern JavaScript framework.

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