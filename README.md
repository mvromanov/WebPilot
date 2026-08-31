# WebPilot

Helps automate browser flows.

## Project structure

```text
apps/
├── frontend/  React + Vite client
└── backend/   Node.js + Express API
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Getting started

```bash
npm install
npm run dev
```

The React app runs at `http://localhost:5173` and proxies API requests to the
Node.js server at `http://localhost:3000`.

## Commands

- `npm run dev` — start the frontend and backend in watch mode
- `npm run dev:frontend` — start only the frontend
- `npm run dev:backend` — start only the backend
- `npm run build` — create production builds for both apps
- `npm run typecheck` — type-check both apps
- `npm start` — run the compiled backend

Copy `apps/backend/.env.example` to `apps/backend/.env` to override the default
backend configuration.

## Projects API

Projects are stored locally in `apps/backend/data/webpilot.db` by default. The
database and its tables are created automatically when the backend starts.

- `POST /api/projects` — create a project
- `GET /api/projects` — list projects
- `GET /api/projects/:id` — load one project
- `DELETE /api/projects/:id` — delete one project

Create requests accept JSON with a required `name` and optional `description`:

```json
{
  "name": "Customer onboarding",
  "description": "Automates the customer onboarding flow."
}
```
