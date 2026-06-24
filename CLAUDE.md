# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # installs both workspaces (root postinstall not needed; npm workspaces)
npm run dev        # concurrently: API on :4000 + Vite client on :5173 (open :5173)
npm run build      # builds client/dist (tsc -b && vite build)
npm run start      # production: Express serves client/dist + /api on :4000
```

Workspace-scoped commands use `npm -w server ...` / `npm -w client ...` (e.g.
`npm -w client run build`). There is no test runner or linter configured.

To verify a production build locally, run `npm run build` then `npm run start`
and open http://localhost:4000 (Express serves the built SPA when `client/dist`
exists).

## Environment

Live data needs `FOOTBALL_DATA_API_KEY` in `server/.env` (copy from
`server/.env.example`; token from https://www.football-data.org/client/register).
**With no key the app runs entirely on bundled sample data** — fully functional,
with a "sample data" banner in the UI. Both `dev` and `start` load `.env` via
Node's `--env-file-if-exists`.

## Architecture

Two npm workspaces, one data flow: **football-data.org → Express proxy →
normalizer → React Query → pages**.

### Backend (`server/`, plain JS ESM, Express)

- `src/index.js` — routes + the dev/prod serving split. In production it also
  serves `client/dist` as static files with an SPA fallback (`/^\/(?!api\/).*/`)
  so React Router handles client routes; in dev Vite proxies `/api` here.
- `src/providers/footballData.js` — thin football-data.org v4 client. The API
  key is read from `process.env` and **never leaves the server**. Competition
  code is hardcoded to `"WC"`.
- `src/providers/normalize.js` — converts upstream payloads into the flat shapes
  the frontend consumes. **Isolating provider quirks here is intentional**:
  swapping data providers should only touch `src/providers/`.
- `src/cache.js` — tiny in-memory TTL cache. Matches cached ~25s, standings
  ~5min, to stay under the free tier's ~10 req/min limit. The UI can poll freely
  because polls hit this cache, not the upstream.
- `src/providers/sample.json` — bundled fallback dataset.

**Fallback is layered**: `loadRaw()` in `index.js` serves sample data when there
is no API key *and* when any upstream call throws. Every response sets an
`X-Data-Source: live|sample` header that the client surfaces.

**Sample-data date shifting**: sample fixtures are authored around
`SAMPLE_ANCHOR` (2026-06-17 UTC). `localizeSampleMatches()` shifts every fixture
by whole days so the "live" matchday always lands on today — keep this in mind if
sample matches appear at unexpected dates.

The `/api/bracket` and `/api/teams/:id` endpoints derive their data by filtering
the same normalized match list (knockout stages via `KNOCKOUT_ORDER`; team
fixtures by matching team id), so they share the matches cache.

### Frontend (`client/`, Vite + React + TS)

- `src/lib/api.ts` — typed fetch layer **and** the shared `Match`/`Team`/etc.
  type definitions (the contract with the backend; keep in sync with
  `normalize.js`). Also a tiny subscribable store that tracks the latest
  `X-Data-Source` header so `Layout` can show the sample-data banner.
- `src/pages/` — `Feed`, `Standings`, `Bracket`, `Team` (routes wired in
  `App.tsx`). Live scores poll every 30s via TanStack Query.
- `src/components/ui/` — hand-rolled shadcn/ui-style primitives (card, badge,
  table, skeleton); not the shadcn CLI. `src/lib/utils.ts` has the `cn()` helper.
- `@/` is aliased to `client/src/` (vite.config.ts + tsconfig paths).
- Tailwind for styling.

## Deploy

`render.yaml` is a Render Blueprint: one web service builds the frontend and
serves it from Express (single origin, so the in-memory cache is shared). Build
`npm ci --include=dev && npm run build`, start `npm run start`, health check
`/api/health`. Set `FOOTBALL_DATA_API_KEY` in the dashboard for live data.
