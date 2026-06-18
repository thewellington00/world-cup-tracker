// Converts football-data.org payloads into the flat shapes our frontend uses.
// Keeping this isolated means swapping the upstream provider only touches this
// folder.

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE"]);

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
  };
}

export function normalizeMatch(m) {
  const full = m.score?.fullTime ?? {};
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
      home: full.home ?? null,
      away: full.away ?? null,
      winner: m.score?.winner ?? null,
    },
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
