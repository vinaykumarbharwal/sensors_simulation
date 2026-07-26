# Vanrakshak: Forest Fire Early Detection System

Vanrakshak is a forest fire monitoring and early warning platform built as a Spring Boot backend plus a React + Vite frontend. It simulates sensor activity across forest zones, scores fire risk, and presents live operational data in a dashboard intended for field teams and department heads.

## What it does

- Simulates forest-zone sensor readings such as temperature, smoke, and humidity.
- Detects warning and critical conditions using server-side rules.
- Surfaces alerts, health status, and zone details in a browser dashboard.
- Uses JWT-based authentication and role-aware access for operational views.
- Persists application data through a MySQL-compatible database.

## Repository layout

- `forest-fire-backend/` - Spring Boot API, services, security, and persistence.
- `forest-fire-frontend/` - React dashboard built with Vite and TypeScript.
- `forest-fire-dashboard.html` - Static dashboard prototype.
- `docs/` - Planning and deployment notes.

## Tech stack

- Backend: Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, WebSocket support
- Database: MySQL-compatible database for production, H2 for local development
- Frontend: React 19, TypeScript, Vite, Leaflet
- Auth: JWT

## Prerequisites

- Java 17
- Maven 3.9+
- Node.js 20+
- npm 10+

## Local setup

### 1. Start the backend

```bash
cd forest-fire-backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile uses an in-memory H2 database, disables bootstrap writes, and keeps the API on port `8081`.

### 2. Start the frontend

```bash
cd forest-fire-frontend
npm install
npm run dev
```

By default the frontend talks to `http://localhost:8081/api/v1` during development.

## Environment variables

Backend production configuration is expected through environment variables:

- `PORT` - backend port, defaults to `8081`
- `DB_URL` - JDBC connection string
- `DB_USERNAME` - database username
- `DB_PASSWORD` - database password
- `FRONTEND_ORIGINS` - comma-separated allowed origins for CORS
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRATION_MS` - token lifetime in milliseconds
- `EMPLOYEE_USERNAME` - employee login username
- `EMPLOYEE_PASSWORD` - employee login password
- `HEAD_USERNAME` - head/admin login username
- `HEAD_PASSWORD` - head/admin login password

Frontend configuration:

- `VITE_API_BASE_URL` - optional API base URL override

## Build commands

```bash
# Backend
cd forest-fire-backend
mvn clean test
mvn clean package

# Frontend
cd forest-fire-frontend
npm run build
npm run lint
```

## Deployment notes

- Frontend hosting is configured for Vercel in `vercel.json`.
- Backend deployment should provide the production database and security environment variables.
- See `docs/deployment-plan.md` and `docs/backend-plan.md` for the rollout approach.

## Project status

The project is structured and ready for local development, dashboard work, and deployment hardening.

## License

No license has been added yet.
