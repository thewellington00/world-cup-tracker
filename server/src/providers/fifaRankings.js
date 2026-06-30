// FIFA world rankings for the 48 World Cup teams, going into the tournament.
// football-data.org does not expose rankings, so we keep this static reference
// here (keyed by the upstream three-letter team code, `tla`) and attach it in
// `normalizeTeam`. Update these values if the published rankings change.
export const FIFA_RANKINGS = {
  ARG: 1,
  ESP: 2,
  FRA: 3,
  ENG: 4,
  BRA: 5,
  NED: 6,
  POR: 7,
  BEL: 8,
  GER: 10,
  CRO: 11,
  MAR: 12,
  COL: 13,
  MEX: 14,
  URU: 15,
  USA: 16,
  SUI: 17,
  SEN: 18,
  JPN: 19,
  IRN: 21,
  KOR: 22,
  ECU: 23,
  AUT: 24,
  AUS: 25,
  TUR: 27,
  CAN: 28,
  EGY: 29,
  PAN: 30,
  NOR: 31,
  SWE: 32,
  CIV: 34,
  TUN: 36,
  KSA: 37,
  RSA: 38,
  CZE: 40,
  SCO: 41,
  PAR: 42,
  ALG: 43,
  COD: 44,
  GHA: 45,
  QAT: 46,
  UZB: 48,
  IRQ: 55,
  JOR: 64,
  CPV: 70,
  BIH: 74,
  HAI: 83,
  NZL: 86,
  CUW: 90,
};

export function rankingFor(tla) {
  if (!tla) return null;
  return FIFA_RANKINGS[tla] ?? null;
}
