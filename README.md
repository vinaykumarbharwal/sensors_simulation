# Vanrakshak

Vanrakshak is a forest fire monitoring and early warning system with a Spring Boot backend and a React + Vite frontend.

## Project docs

- [Backend README](forest-fire-backend/README.md)
- [Frontend README](forest-fire-frontend/README.md)
- [Project overview](PROJECT_OVERVIEW.md)
- [Roadmap](docs/roadmap.md)

## Repository layout

- `forest-fire-backend/` - API, security, persistence, and simulation logic.
- `forest-fire-frontend/` - Browser dashboard for live monitoring and admin flows.
- `forest-fire-dashboard.html` - Static dashboard prototype.
- `docs/` - Planning, deployment, and setup notes.

## Quick start

1. Read the backend and frontend READMEs for the app-specific setup.
2. Start the backend from `forest-fire-backend/`.
3. Start the frontend from `forest-fire-frontend/`.

## Runtime summary

- Backend API base path: `/api/v1`
- Local backend port: `8081`
- Frontend development API target: `http://localhost:8081/api/v1`

## Performance testing

The backend includes an authenticated Apache JMeter workload covering the
sensor-readings, alerts, dashboard, readings-history, and zones APIs. See the
[JMeter test plan](benchmarks/jmeter/vanrakshak-load-test.jmx) and the
[benchmark report](benchmarks/vanrakshak_benchmark_kit/benchmark_kit/BENCHMARK_REPORT.md).

## Contributors

- **Nikhil** — Spring Boot backend, REST APIs, JWT security, persistence,
  sensor-simulation and alerting logic, and backend performance testing.
- **[Vinay Kumar Bharwal](https://github.com/vinaykumarbharwal)** — React,
  TypeScript, and Vite frontend technology, dashboard UI, and frontend
  integration.
