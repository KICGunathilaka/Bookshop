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

- Node.js 18+
- PostgreSQL 13+
- Git

## Clone & Branch Workflow

Use the following as a template; replace placeholders with your repo details.

- Clone the repository:
  - `git clone <REPO_URL>`
  - `cd bookshop-management`
- Switch to or create the appropriate branch:
  - View branches: `git branch -a`
  - Checkout existing: `git checkout <BRANCH_NAME>`
  - Create feature branch: `git checkout -b feature/<short-description>`
- Start coding on your branch and push:
  - `git add . && git commit -m "feat: add login-only UI"`
  - `git push -u origin feature/<short-description>`

## Backend Database Setup

1. Create a PostgreSQL database (example: `Bookshop`).
2. Run `backend/database.sql` to create required tables (ensure a `users` table with `username`, `email`, and `password_hash`).
3. Create `backend/.env` with your DB connection settings:
   - `DB_USER=postgres`
   - `DB_PASSWORD=postgres`
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_DATABASE=Bookshop`
4. Start the backend, which will seed a default admin user on first run:
   - `cd backend`
   - `npm install`
   - `node index.js`
   - Logs should include: `Server running on port 5000` and either `Admin user created` or `Admin user already exists`.

Default admin credentials (for local development):
- Username: `Admin`
- Password: `Admin123`

## Frontend Setup & Run

1. Install and start the dev server:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
2. Open `http://localhost:5173/` and log in with the admin credentials.
3. On success, you land on the Dashboard page.

## Authentication Flow

- Endpoint: `POST http://localhost:5000/api/auth/login`
- Request body: `{ "username": "Admin", "password": "Admin123" }`
- Success response: `{ "message": "Login successful", "user": { "user_id": <number>, "username": "Admin" } }`

## Where to Add Features Next

- Frontend pages live in `frontend/src/pages` (e.g., expand `Dashboard.tsx`).
- Backend endpoints live in `backend/routes` and `backend/controllers` (e.g., add `routes/feature.js` + `controllers/featureController.js`).

## Notes

- The app has been cleaned to keep only login and dashboard. Any book-related pages and APIs have been removed.