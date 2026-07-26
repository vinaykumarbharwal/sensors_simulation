# Vanrakshak Backend

Spring Boot service for the Vanrakshak forest fire early detection system. This service exposes the API used by the dashboard, manages authentication, serves simulated zone and sensor data, and coordinates alerting and health checks.

## What the backend provides

- API endpoints for dashboard, map, alerts, readings history, health, account, and admin operations.
- JWT-based authentication and role-aware access for employee and head/admin users.
- Spring Data JPA persistence for zones, sensors, alerts, and related entities.
- Local development support with H2 and a `local` profile.
- Scheduled simulation and retention jobs enabled through Spring scheduling.

## API surface

The application exposes its main API under `/api/v1`.

Common routes include:

- `GET /api/v1`
- `GET /api/v1/health`
- `GET /api/v1/dashboard`
- `GET /api/v1/map`
- `GET /api/v1/zones`
- `GET /api/v1/alerts`
- `GET /api/v1/alerts/history`
- `GET /api/v1/readings/history`
- `POST /api/v1/auth/login`
- `GET /api/v1/account`

Admin routes are implemented under `/api/v1/admin/...` for sensor and outpost management.

## Tech stack

- Java 17
- Spring Boot 3.2
- Spring Security
- Spring Data JPA
- WebSocket support
- MySQL-compatible database in production
- H2 for local development

## Prerequisites

- Java 17
- Maven 3.9+

## Run locally

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile uses H2, keeps the server on port `8081`, disables bootstrap writes, and turns off scheduled simulation when needed for clean startup.

## Build and test

```bash
mvn clean test
mvn clean package
```

## Configuration

Application properties are primarily controlled through environment variables in production.

Important variables:

- `PORT` - server port, defaults to `8081`
- `DB_URL` - JDBC URL for the production database
- `DB_USERNAME` - database username
- `DB_PASSWORD` - database password
- `FRONTEND_ORIGINS` - allowed CORS origins
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRATION_MS` - JWT lifetime in milliseconds
- `EMPLOYEE_USERNAME` - employee login username
- `EMPLOYEE_PASSWORD` - employee login password
- `HEAD_USERNAME` - head/admin login username
- `HEAD_PASSWORD` - head/admin login password

## Notes for deployment

- The backend expects a MySQL-compatible production database.
- Keep `FRONTEND_ORIGINS` aligned with the deployed frontend URL.
- See `../docs/deployment-plan.md` for the deployment direction.