import type { Match } from "./api";

export function kickoffTime(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayKey(utcDate: string) {
  return new Date(utcDate).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Compact date label (e.g. "Sat, Jun 20") for contexts that aren't grouped by
// day, such as a team's fixture list.
export function shortDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isToday(utcDate: string) {
  const d = new Date(utcDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Short human label for a match's status, shown on the card.
export function statusLabel(match: Match): string {
  switch (match.status) {
    case "IN_PLAY":
      return match.minute ? `${match.minute}'` : "LIVE";
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "Full time";
    case "POSTPONED":
      return "Postponed";
    case "CANCELLED":
      return "Cancelled";
    case "SUSPENDED":
      return "Suspended";
    default:
      return kickoffTime(match.utcDate);
  }
}

// Note for how a result was reached, shown next to a finished score. Returns
// null for a normal 90-minute result (the common case, no annotation needed).
export function durationNote(match: Match): string | null {
  switch (match.score.duration) {
    case "EXTRA_TIME":
      return "AET";
    case "PENALTY_SHOOTOUT":
      return "on penalties";
    default:
      return null;
  }
}

// Display label for a match group. The upstream API uses "GROUP_A"; the
// standings feed uses "Group A". Normalize both to "Group A".
export function groupLabel(group: string): string {
  return group
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Stable anchor slug for a group, shared by match-card links and the standings
// page (e.g. both "GROUP_A" and "Group A" -> "group-a").
export function groupSlug(group: string): string {
  return group
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third-place Play-off",
  FINAL: "Final",
};

export function stageLabel(stage: string | null): string {
  if (!stage) return "";
  return STAGE_LABELS[stage] ?? stage.replace(/_/g, " ");
}
