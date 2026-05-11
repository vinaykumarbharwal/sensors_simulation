# Forest Fire System Roadmap

## Goal
Build a forest fire monitoring system with a Spring Boot backend, a React frontend, Aiven PostgreSQL for persistence, and Vercel for frontend hosting.

## Phases
1. Backend foundation
   - Keep Spring Boot as the backend technology.
   - Split code into `entity`, `dao`, `service`, and `controller` layers.
   - Add persistence for zones, sensors, readings, alerts, and email events.

2. Map and simulation model
   - Model forest locations with latitude and longitude.
   - Place sensors at fixed locations per zone.
   - Keep generated readings realistic and stable with controlled variation.

3. Alerting and notifications
   - Detect warning, danger, and critical states in the service layer.
   - Trigger email alerts when thresholds are crossed.
   - Keep alert history in the database.

4. React dashboard
   - Build a home dashboard for system health and summaries.
   - Show the forest map with sensor locations.
   - Add zone details, live readings, and alert panels.

5. Deployment
   - Host PostgreSQL on Aiven.
   - Host the frontend on Vercel.
   - Deploy the backend separately with environment-based configuration.

## Improvements to add early
- Live updates with polling, SSE, or WebSocket.
- Historical charts for each zone.
- Alert acknowledgment and resolution tracking.
- A simple admin settings screen for thresholds and email recipients.
