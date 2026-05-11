# Backend Plan

## Technology
- Spring Boot for the API and simulation engine.
- Spring Data JPA for persistence.
- PostgreSQL on Aiven for production data.

## Target package layout
- `entity` for persistent domain objects.
- `dao` or `repository` for database access.
- `service` for sensor simulation, alert logic, and email orchestration.
- `controller` for REST endpoints.
- `config` for CORS, mail, and Aiven database configuration.

## Core entities
- `ForestZone`
- `Sensor`
- `SensorReading`
- `FireAlert`
- `EmailNotification`

## Service responsibilities
- Generate consistent readings for each zone.
- Calculate risk levels from temperature, smoke, and humidity.
- Create or update one active alert per zone.
- Send email notifications when alerts change state.

## API responsibilities
- Return the dashboard summary.
- Return all zones and zone detail views.
- Return readings and alert history.
- Support alert acknowledgment and resolution.

## Backend improvements
- Add tests for risk scoring and alert lifecycle.
- Add DTOs so controllers do not expose persistence objects directly.
- Add validation for sensor and zone input.
