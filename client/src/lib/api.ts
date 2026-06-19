export type DataSource = "live" | "sample" | "unknown";

export interface Team {
  id: number | null;
  name: string;
  tla?: string | null;
  crest: string | null;
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED";

export type MatchDuration = "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";

export interface Score {
  home: number | null;
  away: number | null;
  winner: string | null;
  duration: MatchDuration | null;
}

export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  isLive: boolean;
  stage: string | null;
  group: string | null;
  matchday: number | null;
  minute: number | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  score: Score;
}

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  table: StandingRow[];
}

export interface BracketRound {
  stage: string;
  matches: Match[];
}

export interface TeamDetail {
  team: Team;
  fixtures: Match[];
}

// Tiny subscribable store for the latest data source reported by the backend
// (via the X-Data-Source header). The layout subscribes to show a "sample
// data" banner whenever any request falls back to bundled data.
let dataSource: DataSource = "unknown";
const listeners = new Set<() => void>();

export function getDataSource() {
  return dataSource;
}

export function subscribeDataSource(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setDataSource(next: DataSource) {
  if (next !== dataSource) {
    dataSource = next;
    listeners.forEach((cb) => cb());
  }
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status}`);
  }
  const source = res.headers.get("X-Data-Source");
  if (source === "live" || source === "sample") {
    setDataSource(source);
  }
  return res.json() as Promise<T>;
}

export const fetchMatches = () => getJSON<Match[]>("/api/matches");
export const fetchStandings = () => getJSON<GroupStanding[]>("/api/standings");
export const fetchBracket = () => getJSON<BracketRound[]>("/api/bracket");
export const fetchTeam = (id: string | number) =>
  getJSON<TeamDetail>(`/api/teams/${id}`);
