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

## Team & Environment Rules (Project-specific)

1. Package manager and lockfiles

- Node.js: use `npm` only. Keep both `package.json` and `package-lock.json` committed in `backend/` and `frontend/`.
- Why: Lockfiles pin exact versions so everyone installs the same dependencies.

Recommended install commands after pulling the repo:

```
# Install EXACT versions from the lockfiles (no modifications)
cd backend && npm ci
cd ../frontend && npm ci
```

Node.js workflow when ADDING a new package (frontend example):

```
# Install a new package and save to package.json
npm install crypto-js --save

# Commit the updated dependency files
git add package.json package-lock.json
git commit -m "Add crypto-js package"
git push

# Other developers should pull the branch and run exact installs
npm ci
```

This ensures everyone has the exact same package and version, and avoids lockfile drift.

2. Environment configuration

- Include a `.env.example` file in Git.
- Developers copy it to `.env` and set their own keys/URLs.
- Avoid committing secrets while ensuring everyone knows the required environment variables.
- Backend example already provided at `backend/.env.example`.
- Frontend example (create `frontend/.env.example` if needed):

```
# Vite reads variables prefixed with VITE_
VITE_API_URL=http://localhost:5000
```

3. Node version management

- Use `nvm` to enforce one Node.js version for the whole project.
- Project baseline: Node.js 18 LTS (recommended: `18.20.4`).
- Suggested `.nvmrc` contents (optional, commit to repo):

```
18.20.4
```

- Usage:

```
nvm install
nvm use
```

- Why: Prevents version mismatch errors across developers.

4. Optional: Docker for consistent environment

- If the project uses multiple services (frontend + backend + database), a `docker-compose` setup ensures everyone runs the project in the same environment.
- Pros: No “works on my machine” errors; all services and packages are consistent.
- Hot-reloading can still be enabled with volume mounts for development.

5. Team rules to avoid install conflicts

- Always use `npm ci` after pulling or on CI to install exact versions from lockfiles.
- Do not delete or ignore `package-lock.json`. It must be committed.
- Never install a package locally without committing the updated `package.json` and `package-lock.json`.
- Add packages only in the target workspace (`backend/` or `frontend/`) where they are used.
- Avoid `npm update` or broad upgrades on feature branches. Use a dedicated maintenance PR for dependency bumps.
- Document setup steps clearly so new developers can run the project without issues.