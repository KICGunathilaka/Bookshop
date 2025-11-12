Docker Setup and Auto‑Restart Guide

Who This Is For
- Anyone who wants to run the app without installing Node.js or PostgreSQL directly.
- No prior Docker knowledge is required. This guide explains every step and how things fit together.

What You Will Get
- A self‑contained environment with three parts:
  - `postgres`: the database
  - `backend`: the API server on port `5000`
  - `frontend`: the website served on port `8080`
- Automatic startups after reboot using Docker Compose `restart: always`.

Basic Concepts (Plain English)
- Image: a recipe to make a container (like a prebuilt program).
- Container: a running instance of an image (like a lightweight app).
- Volume: a special folder where data is stored and survives restarts.
- Port: the doorway that lets you access a container from your computer.
- Compose: a simple file that describes all containers and how they connect.

Before You Start
- Install Docker Desktop (Windows/macOS) or Docker Engine (Linux).
- Make sure Docker is running. On Windows/macOS, open Docker Desktop; on Linux, ensure the service is started.

Files You Will Create
1) Backend environment file (`backend/.env`) — tells the API how to reach the database and which port to use:

```
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=Bookshop
PORT=5000
ALLOW_PASSWORDLESS_LOGIN=false
```

2) Compose environment file (`compose.env`) — sets the database username/password for the Postgres container:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=Bookshop
```

The Compose File
- Save this as `docker-compose.yml` in the project root. It describes the three services, exposes ports, and enables auto‑restart.

```
version: '3.8'
services:
  postgres:
    image: postgres:14
    container_name: bookshop-postgres
    restart: always
    env_file:
      - compose.env
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bookshop-backend
    restart: always
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE: http://bookshop-backend:5000
    container_name: bookshop-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "8080:80"

volumes:
  pgdata:
```

What Those Settings Mean
- `restart: always`: start containers automatically when Docker starts (e.g., after reboot).
- `depends_on`: start `backend` after `postgres`, and `frontend` after `backend`.
- `ports`: `host:container` mapping. Example: `5000:5000` exposes backend on your machine at `http://localhost:5000`.
- `VITE_API_BASE`: tells the frontend where the backend lives inside Compose (`http://bookshop-backend:5000`).
- `pgdata` volume: stores database files so data survives restarts.

Dockerfiles (How Images Are Built)
- Backend `backend/Dockerfile` builds a Node image and runs the API on port `5000`:

```
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --production
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "index.js"]
```

- Frontend `frontend/Dockerfile` builds the website and serves it using Nginx on port `80` inside the container (mapped to `8080` on your machine):

```
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install
COPY . .
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Step‑by‑Step: Build and Start
1) Open a terminal in the project root.
2) Build images:

```
docker compose build
```

3) Start containers in the background:

```
docker compose up -d
```

4) Confirm they are running:

```
docker ps
docker compose logs -f backend
docker compose logs -f postgres
```

How To Access The App
- Frontend website: `http://localhost:8080/`
- Backend API: `http://localhost:5000/api/...`
- PostgreSQL (for tools like pgAdmin): host `localhost`, port `5432`, user `postgres`, password `postgres`.

What Happens Behind The Scenes
- Compose creates a private network so services can talk by name (e.g., `backend` talks to `postgres`).
- The backend reads `backend/.env` for database settings and port.
- The frontend is built with `VITE_API_BASE=http://bookshop-backend:5000`, so it calls the backend through the Compose network.
- An admin user is seeded when the backend starts, so you can log in with `Admin` / `Admin123`.
- The `pgdata` volume keeps the database on disk even if containers stop.

Auto‑Restart After Reboot
- `restart: always` means containers will start whenever Docker starts.
- Windows/macOS: enable “Start Docker Desktop when you log in” in Docker Desktop settings.
- Linux: make sure the Docker service is enabled (`systemctl enable docker`).

Routine Operations
- Update after code changes:

```
docker compose build
docker compose up -d
```

- Stop without removing data:

```
docker compose stop
```

- Shut down and remove containers (keep data):

```
docker compose down
```

- Remove everything including database data:

```
docker compose down -v
```

Troubleshooting Guide
- Frontend cannot reach backend: check `docker compose logs frontend`. Ensure `VITE_API_BASE` is `http://bookshop-backend:5000` in the Compose args.
- Port already in use: change the left side of the `ports` mapping (e.g., use `5001:5000` for backend and update your browser URLs).
- Backend cannot connect to database: verify `DB_HOST=postgres` in `backend/.env` and check `docker compose logs backend` and `postgres`.
- Database credentials wrong: update `compose.env` and recreate the `postgres` container (`docker compose down -v` will reset data).

FAQ
- Can I run only backend and Postgres? Yes: comment out the `frontend` service in `docker-compose.yml` and use your local dev server.
- Can I change ports? Yes: edit `ports` in `docker-compose.yml`. Example: `8081:80` for frontend.
- Where is my data? In the `pgdata` Docker volume managed by Compose.
- Is it safe to commit `.env`? No. Do not commit secrets to version control.

Uninstall or Clean Up
- Stop all containers and remove them:

```
docker compose down
```

- Optionally remove database data (irreversible):

```
docker compose down -v
```