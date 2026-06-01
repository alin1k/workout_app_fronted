# Workout App — Frontend

React + Vite SPA for the Grove workout tracker. Talks to the Flask backend over JSON; auth is JWT in the `Authorization` header.

## Requirements

- Node 20+
- The backend running on `http://localhost:5000` (see `../backend/README.md`)

## Setup

```bash
cp .env.example .env.development   # optional — only if you need to override VITE_API_BASE_URL
npm install
```

## Develop

```bash
npm run dev     # Vite dev server with HMR on http://localhost:5173
npm run lint    # ESLint
npm run build   # local production build → ./dist
npm run preview # serve the local build
```

Backend must be up first or every request will fail with a network error.

## Project layout

```
src/
  context/        AuthContext, AppContext
  screens/        top-level routes (Login, WorkoutsList, WorkoutDetail)
  sheets/         bottom-sheet forms
  components/     leaf UI primitives (Button, Field, Icon, …)
  lib/            api.js (all fetch traffic), format helpers, constants
  styles/         tokens.css + global.css
```

All HTTP traffic flows through `src/lib/api.js` — do not call `fetch` directly from components. The JWT is read from `localStorage.auth_token` and attached automatically; a `401` on any non-auth endpoint clears the token, flashes a "session expired" toast, and redirects to `/login`.

## Building the `dist/` directory via Docker

The Dockerfile is a two-stage build whose final `dist` stage is a `scratch` image containing only the compiled assets. Use BuildKit's `--output` to extract them straight to the host:

```bash
docker build --target dist --output type=local,dest=./dist .
```

This produces `./dist/` with `index.html` and the hashed `assets/` bundle, ready to be served by any static host (nginx, S3, etc.) — no Node toolchain required on the build host beyond Docker.

For a plain in-container build (no extraction):

```bash
docker build --target builder -t workout-frontend-build .
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend origin. Baked into the bundle at build time. |
