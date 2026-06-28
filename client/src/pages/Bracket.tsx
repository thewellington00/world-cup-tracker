import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { fetchBracket, type Match } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import { stageLabel, kickoffTime, durationNote, shortDate } from "@/lib/format";

function BracketMatch({
  match,
  highlighted,
}: {
  match: Match;
  highlighted: boolean;
}) {
  const finished = match.status === "FINISHED";
  const note = finished ? durationNote(match) : null;
  return (
    // Tapping a tie jumps to that match in the feed (which scrolls to and
    // flashes the card). The reverse path is the round chip on each match card,
    // which links to this card's id (`#match-<id>`).
    <Link
      to={`/#match-${match.id}`}
      className="block transition-transform hover:-translate-y-0.5"
    >
      <Card
        id={`match-${match.id}`}
        className={cn(
          "w-60 scroll-mt-24 p-3 text-sm transition-shadow hover:ring-2 hover:ring-primary/40",
          highlighted && "ring-2 ring-primary",
        )}
      >
        <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
          {shortDate(match.utcDate)}
        </div>
        <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {finished ? (note ? `Full time · ${note}` : "Full time") : kickoffTime(match.utcDate)}
        </div>
        <BracketSide team={match.homeTeam} score={match.score.home} win={match.score.winner === "HOME_TEAM"} />
        <BracketSide team={match.awayTeam} score={match.score.away} win={match.score.winner === "AWAY_TEAM"} />
      </Card>
    </Link>
  );
}

function BracketSide({
  team,
  score,
  win,
}: {
  team: Match["homeTeam"];
  score: number | null;
  win: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 py-1", !win && score !== null && "text-muted-foreground")}>
      <TeamCrest team={team} className="h-5 w-5" />
      <span className={cn("min-w-0 flex-1 truncate", win && "font-semibold")}>
        {team?.name ?? "TBD"}
      </span>
      <span className="tabular-nums">{score ?? ""}</span>
    </div>
  );
}

export function Bracket() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bracket"],
    queryFn: fetchBracket,
    // Poll like the feed so the bracket picks up the knockout draw as slots fill
    // in (TBD -> real teams) and tracks live scores. 30s while a tie is live,
    // otherwise 60s. (Server caches upstream ~25s, so this stays under the limit.)
    refetchInterval: (query) =>
      query.state.data?.some((r) => r.matches.some((m) => m.isLive))
        ? 30_000
        : 60_000,
  });

  // When arriving via a match card's round chip (e.g. /bracket#match-2001),
  // scroll that tie into view and flash a highlight that fades out.
  const { hash } = useLocation();
  const targetId = hash.replace(/^#/, "");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId || !data) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
    setActiveId(targetId);
    const timer = setTimeout(() => setActiveId(null), 2000);
    return () => clearTimeout(timer);
  }, [targetId, data]);

  if (isLoading)
    return (
      <div className="flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-60" />
        ))}
      </div>
    );
  if (isError)
    return <p className="text-sm text-destructive">Couldn't load the bracket.</p>;

  const rounds = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Knockout Bracket</h1>
      {rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The knockout stage hasn't been drawn yet.
        </p>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-4">
          {rounds.map((round) => (
            <div key={round.stage} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {stageLabel(round.stage)}
              </h2>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {round.matches.map((m) => (
                  <BracketMatch
                    key={m.id}
                    match={m}
                    highlighted={activeId === `match-${m.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
