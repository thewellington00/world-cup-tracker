import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/api";
import {
  durationNote,
  groupLabel,
  groupSlug,
  kickoffTime,
  liveClock,
  penaltyScore,
  shortDate,
  stageLabel,
  statusLabel,
} from "@/lib/format";

function googleSearchUrl(home: string, away: string) {
  const query = `${home} vs ${away} world cup`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function TeamName({
  team,
  winner,
  side,
}: {
  team: Team | null;
  winner: boolean;
  side: "home" | "away";
}) {
  const name = team?.name ?? "TBD";
  const label = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={cn("truncate", winner && "font-semibold")}>{name}</span>
      {team?.ranking != null && (
        <span
          className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground"
          title="FIFA ranking"
        >
          #{team.ranking}
        </span>
      )}
    </span>
  );
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        side === "home" ? "flex-row-reverse text-right" : "flex-row text-left",
      )}
    >
      <TeamCrest team={team} />
      {team?.id ? (
        <Link to={`/team/${team.id}`} className="min-w-0 hover:underline">
          {label}
        </Link>
      ) : (
        <span className="min-w-0 text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export function MatchCard({
  match,
  showDate = false,
  highlighted = false,
}: {
  match: Match;
  // When true (e.g. team fixture lists that aren't grouped by day), show the
  // match date on the card.
  showDate?: boolean;
  // Briefly ring-highlighted when the feed scrolls back to this card after a
  // round trip to the standings (see Feed's "back to feed" handling).
  highlighted?: boolean;
}) {
  const live = match.isLive;
  const finished = match.status === "FINISHED";
  const hasScore = match.score.home !== null && match.score.away !== null;

  // Extra context shown under the score: how a finished result was reached
  // (AET). Null for a normal 90-minute result.
  const scoreDetail = finished ? durationNote(match) : null;
  // Shootout score, shown in parentheses next to the on-pitch score.
  const pens = penaltyScore(match);

  // Only link to Google once both opponents are known (skips TBD knockout slots).
  const home = match.homeTeam;
  const away = match.awayTeam;
  const searchable = Boolean(home?.id && away?.id);
  const googleLabel = live
    ? "Live on Google"
    : finished
      ? "Results on Google"
      : "Preview on Google";

  return (
    <Card
      id={`match-${match.id}`}
      className={cn(
        "scroll-mt-24 p-4 transition-shadow",
        live && "border-destructive/60 ring-1 ring-destructive/30",
        highlighted && "ring-2 ring-primary",
      )}
    >
      {showDate && (
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          {shortDate(match.utcDate)}
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        {live ? (
          <Badge variant="live" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-current" />
            LIVE
          </Badge>
        ) : finished ? (
          <Badge variant="secondary">{statusLabel(match)}</Badge>
        ) : (
          <Badge variant="outline">{kickoffTime(match.utcDate)}</Badge>
        )}
        {match.group ? (
          <Link
            to={`/standings#${groupSlug(match.group)}`}
            // Remember which match this jump came from so the standings page can
            // offer a "back to feed" link that returns to this exact card.
            state={{ fromMatchId: match.id }}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {groupLabel(match.group)}
          </Link>
        ) : match.stage && match.stage !== "GROUP_STAGE" ? (
          // Knockout ties have no group; show the round and link to this exact
          // match in the bracket (which scrolls to and flashes it).
          <Link
            to={`/bracket#match-${match.id}`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {stageLabel(match.stage)}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">Upcoming</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamName team={match.homeTeam} winner={finished && match.score.winner === "HOME_TEAM"} side="home" />
        <div className="flex flex-col items-center justify-center gap-1 px-2">
          {hasScore ? (
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold tabular-nums">
                {match.score.home}
                <span className="mx-1.5 text-muted-foreground">–</span>
                {match.score.away}
              </span>
              {pens && (
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  ({pens})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">vs</span>
          )}
          {live && (
            <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-current" />
              {liveClock(match)}
            </span>
          )}
        </div>
        <TeamName team={match.awayTeam} winner={finished && match.score.winner === "AWAY_TEAM"} side="away" />
      </div>

      {scoreDetail && (
        <div className="mt-1.5 text-center text-xs text-muted-foreground tabular-nums">
          {scoreDetail}
        </div>
      )}

      {searchable && (
        <div className="mt-3 flex justify-end border-t pt-2">
          <a
            href={googleSearchUrl(home!.name, away!.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-3 w-3" />
            {googleLabel}
          </a>
        </div>
      )}
    </Card>
  );
}
