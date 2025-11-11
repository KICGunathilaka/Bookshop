# Bookshop Management Application

Full-stack app for managing products, purchases, sales, inventory, expenses, and reports. Backend uses Node.js + Express + PostgreSQL; frontend uses Vite + React + TypeScript.

**Important:** Follow the steps below exactly to avoid port conflicts and server issues.

## Project Structure

- `backend/`
  - `index.js`: Express app entry; mounts `/api/auth`, `/api/products`, `/api/vendors`, `/api/purchases`, `/api/inventory`, `/api/sales`, `/api/expenses`.
  - `routes/`: Route definitions for each domain.
  - `controllers/`: Business logic per route (CRUD, transactions, validations).
  - `config/db.js`: PostgreSQL connection (reads `.env`).
  - `database.sql`: Base schema and triggers.
  - `migrations/`: Incremental SQL changes.
  - `migrate.js`: Applies SQL files in `migrations/` in order.
  - `seedAdmin.js`: Ensures default admin user exists at startup.
- `frontend/`
  - `src/pages/*`: App pages.
  - `src/services/*`: API clients (base URLs target `http://localhost:5000/api`).
  - `vite.config.ts`: Vite config.

## Prerequisites

- Node.js 18+
- PostgreSQL 13+

## Backend Setup

1. Open a terminal and go to `backend`.
   - `cd backend`

2. Install dependencies.
   - `npm install`

3. Create `backend/.env` with these variables (adjust as needed):
   - `DB_USER=postgres`
   - `DB_PASSWORD=postgres`
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_DATABASE=Bookshop`
   - `PORT=5000`  (required: frontend expects backend on `5000`)
   - `ALLOW_PASSWORDLESS_LOGIN=false` (optional; set `true` only if needed)

4. Create the database in PostgreSQL (once).
   - `createdb Bookshop` (or via pgAdmin/GUI)

5. Initialize schema and triggers (run once):
   - Use `psql` or GUI to execute `backend/database.sql` against the `Bookshop` DB.

6. Start the backend server (single terminal):
   - `node index.js`
   - Confirm it prints `Server running on port 5000`.

## Frontend Setup

1. Open a separate terminal and go to `frontend`.
   - `cd frontend`

2. Install dependencies.
   - `npm install`

3. Start the dev server (single instance to avoid port churn):
   - `npm run dev -- --port 5173`
   - Open the printed URL (e.g., `http://localhost:5173/`).
   - If another dev server is already running, stop it first to avoid auto-switching to `5174`, `5175`, etc.

## Login

- Default admin is seeded automatically on backend start.
- Try `Admin` / `Admin123`.

## Troubleshooting

- Backend not reachable: Ensure `.env` sets `PORT=5000` and the terminal shows `Server running on port 5000`.
- Frontend using the wrong API port: All services point to `http://localhost:5000/api`. Do not change backend port unless you also update those service URLs.
- Multiple frontend dev servers (5174/5175/5176): Close all other dev terminals; run `npm run dev -- --port 5173` once.
- Database connection errors: Verify `DB_*` values in `.env`, database exists, and PostgreSQL is running.
- Schema errors: Re-run `backend/database.sql` on the DB, then `node migrate.js`.

## Start Order

- Always start backend first on `5000`, then start the frontend dev server on `5173`.