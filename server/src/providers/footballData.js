// Thin client for football-data.org v4. Competition code "WC" is the FIFA
// World Cup. The API key is read from the environment and never leaves the
// server.
const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export function hasApiKey() {
  return Boolean(process.env.FOOTBALL_DATA_API_KEY);
}

async function fetchUpstream(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY ?? "" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data ${res.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export function getRawMatches() {
  return fetchUpstream(`/competitions/${COMPETITION}/matches`);
}

export function getRawStandings() {
  return fetchUpstream(`/competitions/${COMPETITION}/standings`);
}
