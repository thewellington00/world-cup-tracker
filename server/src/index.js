import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cached } from "./cache.js";
import { hasApiKey, getRawMatches, getRawStandings } from "./providers/footballData.js";
import { normalizeMatches, normalizeStandings } from "./providers/normalize.js";

const PORT = process.env.PORT || 4000;

const sampleUrl = new URL("./providers/sample.json", import.meta.url);
const SAMPLE = JSON.parse(await readFile(fileURLToPath(sampleUrl), "utf8"));

// Knockout stages in bracket order.
const KNOCKOUT_ORDER = [
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

// The sample fixtures are authored around this date (its live matchday). When
// serving sample data we shift every fixture by whole days so the "live"
// matchday always lands on today — keeping the no-API-key demo current.
const SAMPLE_ANCHOR = Date.UTC(2026, 5, 17);

function localizeSampleMatches(payload) {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const offsetMs = todayUTC - SAMPLE_ANCHOR;
  if (offsetMs === 0) return payload;
  return {
    matches: payload.matches.map((m) => ({
      ...m,
      utcDate: new Date(new Date(m.utcDate).getTime() + offsetMs).toISOString(),
    })),
  };
}

// Loads a raw upstream payload, falling back to bundled sample data whenever
// there's no API key or the upstream call fails. `source` lets the UI show a
// "sample data" banner.
function samplePayload(kind) {
  return kind === "matches" ? localizeSampleMatches(SAMPLE.matches) : SAMPLE[kind];
}

async function loadRaw(kind) {
  if (!hasApiKey()) {
    return { payload: samplePayload(kind), source: "sample" };
  }
  try {
    if (kind === "matches") {
      const payload = await cached("raw:matches", 25_000, getRawMatches);
      return { payload, source: "live" };
    }
    const payload = await cached("raw:standings", 300_000, getRawStandings);
    return { payload, source: "live" };
  } catch (err) {
    console.warn(`[wc] upstream ${kind} failed, serving sample data:`, err.message);
    return { payload: samplePayload(kind), source: "sample" };
  }
}

async function getMatches() {
  const { payload, source } = await loadRaw("matches");
  return { matches: normalizeMatches(payload), source };
}

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: hasApiKey() });
});

app.get("/api/matches", async (_req, res, next) => {
  try {
    const { matches, source } = await getMatches();
    res.set("X-Data-Source", source);
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

app.get("/api/standings", async (_req, res, next) => {
  try {
    const { payload, source } = await loadRaw("standings");
    res.set("X-Data-Source", source);
    res.json(normalizeStandings(payload));
  } catch (err) {
    next(err);
  }
});

app.get("/api/bracket", async (_req, res, next) => {
  try {
    const { matches, source } = await getMatches();
    const rounds = KNOCKOUT_ORDER.map((stage) => ({
      stage,
      matches: matches.filter((m) => m.stage === stage),
    })).filter((round) => round.matches.length > 0);
    res.set("X-Data-Source", source);
    res.json(rounds);
  } catch (err) {
    next(err);
  }
});

app.get("/api/teams/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { matches, source } = await getMatches();
    const fixtures = matches.filter(
      (m) => m.homeTeam?.id === id || m.awayTeam?.id === id,
    );
    if (fixtures.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    const first = fixtures[0];
    const team = first.homeTeam?.id === id ? first.homeTeam : first.awayTeam;
    res.set("X-Data-Source", source);
    res.json({ team, fixtures });
  } catch (err) {
    next(err);
  }
});

// In production we serve the built frontend from the same service (single
// origin, so the client's relative /api calls just work). Skipped in dev,
// where Vite serves the client and proxies /api here.
const clientDist = fileURLToPath(new URL("../../client/dist", import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: let React Router handle any non-API route.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  console.log(`[wc] serving frontend from ${clientDist}`);
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[wc] error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  const mode = hasApiKey() ? "live (football-data.org)" : "sample data (no API key)";
  console.log(`[wc] API listening on http://localhost:${PORT} — ${mode}`);
});
