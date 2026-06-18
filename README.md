# World Cup Tracker 2026 ⚽

A small full-stack app for tracking the FIFA World Cup: a live match feed, group
standings, the knockout bracket, and per-team fixtures.

- **Frontend** — Vite + React + TypeScript + Tailwind, with hand-rolled
  shadcn/ui-style components and TanStack Query (polls live scores every 30s).
- **Backend** — Express proxy around [football-data.org](https://www.football-data.org)
  that keeps your API key server-side, caches responses to respect the free-tier
  rate limit, and falls back to bundled sample data when no key is set.

## Quick start

```bash
npm install          # installs both workspaces (server + client)
npm run dev          # starts API on :4000 and the app on :5173
```

Open http://localhost:5173. With no API key the app runs entirely on the bundled
sample dataset (you'll see a "sample data" banner).

## Use live data

1. Create a free account and get an API token at
   https://www.football-data.org/client/register
2. Copy the example env file and paste your token:
   ```bash
   cp server/.env.example server/.env
   # then set FOOTBALL_DATA_API_KEY=your_token
   ```
3. Restart `npm run dev`. The banner disappears and real World Cup data loads.

> The free tier is rate-limited (~10 requests/minute). The server caches match
> data for ~25s and standings for ~5min, so the UI can poll freely.

## Deploy (Render)

The repo ships a [`render.yaml`](./render.yaml) Blueprint. One web service builds
the frontend and serves it from the Express API, so there's a single origin and
the in-memory cache keeps us under the football-data.org rate limit.

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New + → Blueprint**, select the repo.
   Render reads `render.yaml` and provisions the service:
   - Build: `npm ci --include=dev && npm run build`
   - Start: `npm run start` (Express serves `client/dist` + `/api`)
   - Health check: `/api/health`
3. Add the `FOOTBALL_DATA_API_KEY` env var in the dashboard for live data
   (omit it and the deploy runs on sample data).

> The free plan spins down after ~15 min idle, so the first request after a lull
> takes ~30–50s to wake. Once warm it's snappy. Upgrade to a paid instance (or
> use Fly.io) if you want no cold starts.

To verify a production build locally:

```bash
npm run build                       # builds client/dist
npm run start                       # Express serves the built app on :4000
# open http://localhost:4000
```

## Layout

```
server/   Express API (src/index.js) + provider/normalizer + sample.json
client/   Vite React app (src/pages, src/components, src/components/ui)
```

## API endpoints

| Endpoint            | Description                                  |
| ------------------- | -------------------------------------------- |
| `GET /api/matches`  | All matches (past/live/upcoming), normalized |
| `GET /api/standings`| Group tables                                 |
| `GET /api/bracket`  | Knockout matches grouped by round            |
| `GET /api/teams/:id`| A team plus its fixtures                     |
