// Converts football-data.org payloads into the flat shapes our frontend uses.
// Keeping this isolated means swapping the upstream provider only touches this
// folder.

import { rankingFor } from "./fifaRankings.js";

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE"]);

// Remembers the resolved score for a finished penalty shootout, keyed by match
// id. The upstream feed occasionally reports a shootout with contradictory
// numbers (a tied `fullTime`, a `penalties` field that's always level) and no
// winner, and flickers between good and bad reads request to request. Once
// we've derived a clear winner for a tie we keep it here so the result doesn't
// revert to a bogus draw on a later bad read. Real live data is consistent, so
// this never overrides anything there.
const SHOOTOUT_RESULTS = new Map();

export function isLiveStatus(status) {
  return LIVE_STATUSES.has(status);
}

function normalizeTeam(team) {
  if (!team) return null;
  return {
    id: team.id ?? null,
    name: team.name ?? team.shortName ?? "TBD",
    tla: team.tla ?? null,
    crest: team.crest ?? null,
    ranking: rankingFor(team.tla),
  };
}

export function normalizeMatch(m) {
  const score = m.score ?? {};
  const full = score.fullTime ?? {};

  let home = full.home ?? null;
  let away = full.away ?? null;
  let winner = score.winner ?? null;
  let penalties = null;

  // For a shootout, upstream `fullTime` is the *combined* total (the on-pitch
  // score plus the shootout), which misrepresents the result. Recover the
  // on-pitch (tied) score and derive the shootout as `fullTime − onPitch`. We
  // deliberately do NOT trust the upstream `penalties` field — the feed reports
  // it inconsistently (e.g. a 4–4 shootout with a clear winner) — but `fullTime`
  // reliably reflects who advanced, so we derive everything from it.
  if (score.duration === "PENALTY_SHOOTOUT") {
    const onPitch = afterExtraTime(score);
    const ph = onPitch ? full.home - (onPitch.home ?? 0) : -1;
    const pa = onPitch ? full.away - (onPitch.away ?? 0) : -1;
    if (onPitch && full.home != null && full.away != null && ph >= 0 && pa >= 0) {
      // The on-pitch score is the real result the match finished at.
      home = onPitch.home ?? null;
      away = onPitch.away ?? null;
      // Only surface the shootout when the derived tally has a winner
      // (ph !== pa). A shootout can't end level, so equal values mean the
      // upstream numbers are inconsistent — show just the on-pitch draw instead
      // of a bogus tied shootout.
      if (ph !== pa) {
        penalties = { home: ph, away: pa };
        if (!winner) winner = ph > pa ? "HOME_TEAM" : "AWAY_TEAM";
      }
    }

    // Stick to a finished shootout's resolved result across flickering reads:
    // remember it once decided, and reuse it whenever the current read can't
    // produce a winner (see SHOOTOUT_RESULTS).
    if (m.status === "FINISHED") {
      if (penalties && winner) {
        SHOOTOUT_RESULTS.set(m.id, { home, away, penalties, winner });
      } else {
        const remembered = SHOOTOUT_RESULTS.get(m.id);
        if (remembered) ({ home, away, penalties, winner } = remembered);
      }
    }
  }

  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    isLive: isLiveStatus(m.status),
    stage: m.stage ?? null,
    group: m.group ?? null,
    matchday: m.matchday ?? null,
    minute: m.minute ?? null,
    homeTeam: normalizeTeam(m.homeTeam),
    awayTeam: normalizeTeam(m.awayTeam),
    score: {
      home,
      away,
      winner,
      // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT — how the result was reached.
      duration: score.duration ?? null,
      // Shootout score, when the tie was decided on penalties; null otherwise.
      penalties,
    },
  };
}

// The on-pitch score a tie finished at, before any shootout. football-data
// reports `extraTime` cumulatively in some payloads (>= regulation) and as
// extra-time-only goals in others, so detect which: a cumulative value is at
// least the regulation score, otherwise the two are added together.
function afterExtraTime(score) {
  const reg = score.regularTime ?? null;
  const et = score.extraTime ?? null;
  if (!et) return reg ?? score.fullTime ?? null;
  if (!reg) return et;
  const cumulative =
    (et.home ?? 0) >= (reg.home ?? 0) && (et.away ?? 0) >= (reg.away ?? 0);
  if (cumulative) return et;
  return {
    home: (reg.home ?? 0) + (et.home ?? 0),
    away: (reg.away ?? 0) + (et.away ?? 0),
  };
}

export function normalizeMatches(payload) {
  const matches = payload?.matches ?? [];
  return matches
    .map(normalizeMatch)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
}

export function normalizeStandings(payload) {
  // Group-stage standings come back as one entry per group with type "TOTAL".
  const groups = (payload?.standings ?? [])
    .filter((s) => s.type === "TOTAL")
    .map((s) => ({
      group: s.group ?? "Group",
      table: (s.table ?? []).map((row) => ({
        position: row.position,
        team: normalizeTeam(row.team),
        played: row.playedGames ?? 0,
        won: row.won ?? 0,
        draw: row.draw ?? 0,
        lost: row.lost ?? 0,
        goalsFor: row.goalsFor ?? 0,
        goalsAgainst: row.goalsAgainst ?? 0,
        goalDifference: row.goalDifference ?? 0,
        points: row.points ?? 0,
      })),
    }));
  return groups;
}
