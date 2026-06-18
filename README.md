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
