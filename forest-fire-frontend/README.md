# Vanrakshak Frontend

React + TypeScript dashboard for the Vanrakshak forest fire early detection system.

## What the frontend does

- Provides the login and dashboard experience for employee and head/admin users.
- Displays map, alerts, health, account, and operations panels.
- Polls the backend for live data and refreshes the dashboard state.
- Stores the current auth session in browser local storage.

## Tech stack

- React 19
- TypeScript
- Vite
- Leaflet and react-leaflet
- ESLint

## Prerequisites

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

The frontend talks to `http://localhost:8081/api/v1` by default in development.

## Build and lint

```bash
npm run build
npm run lint
```

## Configuration

- `VITE_API_BASE_URL` - overrides the backend API base URL.

If the variable is not set, the app uses the local backend in development and the deployed API URL in production.

## Main structure

- `src/App.tsx` - application shell, login flow, and dashboard routing.
- `src/api/client.ts` - API client, auth session storage, and request helpers.
- `src/components/` - dashboard panels, layout, and shared UI.
- `src/hooks/` - dashboard data fetching, alerts, and UI helpers.
- `src/types/` - shared frontend data types.

## Notes

- The dashboard is designed to work with the backend routes documented in the backend README.
- See `../README.md` for the repository entry point and project links.
