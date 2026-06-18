import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/api";
import { kickoffTime, shortDate, statusLabel } from "@/lib/format";

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
    <span className={cn("truncate", winner && "font-semibold")}>{name}</span>
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
}: {
  match: Match;
  // When true (e.g. team fixture lists that aren't grouped by day), show the
  // match date on the card.
  showDate?: boolean;
}) {
  const live = match.isLive;
  const finished = match.status === "FINISHED";
  const hasScore = match.score.home !== null && match.score.away !== null;

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
      className={cn(
        "p-4 transition-colors",
        live && "border-destructive/60 ring-1 ring-destructive/30",
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
            {statusLabel(match)}
          </Badge>
        ) : finished ? (
          <Badge variant="secondary">{statusLabel(match)}</Badge>
        ) : (
          <Badge variant="outline">{kickoffTime(match.utcDate)}</Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {match.group ?? "Upcoming"}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamName team={match.homeTeam} winner={finished && match.score.winner === "HOME_TEAM"} side="home" />
        <div className="flex items-center justify-center gap-2 px-2">
          {hasScore ? (
            <span className="text-xl font-bold tabular-nums">
              {match.score.home}
              <span className="mx-1.5 text-muted-foreground">–</span>
              {match.score.away}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">vs</span>
          )}
        </div>
        <TeamName team={match.awayTeam} winner={finished && match.score.winner === "AWAY_TEAM"} side="away" />
      </div>

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
