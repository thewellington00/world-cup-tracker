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
