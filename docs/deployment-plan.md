# Deployment Plan

## Backend
- Deploy Spring Boot as a separate service.
- Use environment variables for database URL, mail provider, and frontend origin.

## Database
- Provision Aiven PostgreSQL.
- Keep schema migration scripts in the backend repository.
- Separate dev and production credentials.

## Frontend
- Build the React app independently.
- Deploy the React app on Vercel.
- Point the frontend to the backend API URL through environment variables.

## Runtime configuration
- Local backend runs with `SPRING_PROFILES_ACTIVE=local` and the H2 configuration in `application-local.properties`.
- Production backend should use the shared config plus a dedicated prod profile or explicit environment variables for `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `EMPLOYEE_USERNAME`, `EMPLOYEE_PASSWORD`, `HEAD_USERNAME`, `HEAD_PASSWORD`, and `FRONTEND_ORIGINS`.
- Production frontend should set `VITE_API_BASE_URL`; if it is omitted, the app will fall back to a same-origin `/api/v1` path.

## Order of work
1. Build the backend model and API.
2. Connect Aiven PostgreSQL.
3. Build the React dashboard.
4. Connect the map and alerts.
5. Deploy backend, then frontend.
