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

Set `CHROME_PROFILE_PATH` in the backend environment to the Chrome user-data
directory that Stagehand should reuse between workflow runs. The default is
`apps/backend/data/chrome-profile`. Do not run multiple browsers against the same
profile directory concurrently because Chrome locks profiles while they are open.

## Projects API

Projects are stored locally in `apps/backend/data/webpilot.db` by default. The
database and its tables are created automatically when the backend starts.

Large per-step captures are represented by metadata in `step_artifacts`. Each
artifact references a stable workflow step UUID and a local content path; captured
DOM/HTML should be stored as a compressed file rather than embedded in `steps_json`.

- `POST /api/projects` — create a project
- `GET /api/projects` — list projects
- `GET /api/projects/:id` — load one project
- `PATCH /api/projects/:id` — save the original prompt and generated steps
- `DELETE /api/projects/:id` — delete one project
- `POST /api/steps/generate` — generate executable workflow steps from an original prompt
- `POST /api/steps/execute/:projectId` — execute a validated workflow in a headed local browser
- `POST /api/steps/stop/:projectId` — stop the project's active browser session
- `GET /api/projects/:projectId/steps/:stepId/artifacts` — list artifact metadata
- `POST /api/projects/:projectId/steps/:stepId/artifacts` — store compressed DOM/HTML
- `GET /api/projects/:projectId/steps/:stepId/artifacts/:artifactId` — fetch metadata and content
- `DELETE /api/projects/:projectId/steps/:stepId/artifacts/:artifactId` — delete an artifact
- `POST /api/projects/:projectId/steps/:stepId/locator-options` — rank locator options from an artifact
- `POST /api/projects/:projectId/steps/:stepId/extraction-instruction` — suggest a Stagehand extraction instruction

Create requests accept JSON with a required `name`, required `originalPrompt`,
and optional `description`:

```json
{
  "name": "Customer onboarding",
  "description": "Automates the customer onboarding flow.",
  "originalPrompt": "Create a browser flow that provisions a new customer account."
}
```
