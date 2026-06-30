import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { fetchBracket, type BracketRound, type Match } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import { stageLabel, kickoffTime, durationNote, shortDate } from "@/lib/format";

// The bracket "spine" — the rounds that flow into one another, in order. The
// third-place play-off is drawn off to the side since it isn't part of the
// flow to the final.
const SPINE_STAGES = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
];

function BracketMatch({
  match,
  highlighted,
}: {
  match: Match;
  highlighted: boolean;
}) {
  const finished = match.status === "FINISHED";
  const note = finished ? durationNote(match) : null;
  const pens = match.score.penalties;
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
        <BracketSide
          team={match.homeTeam}
          score={match.score.home}
          pen={pens?.home ?? null}
          win={match.score.winner === "HOME_TEAM"}
        />
        <BracketSide
          team={match.awayTeam}
          score={match.score.away}
          pen={pens?.away ?? null}
          win={match.score.winner === "AWAY_TEAM"}
        />
      </Card>
    </Link>
  );
}

function BracketSide({
  team,
  score,
  pen,
  win,
}: {
  team: Match["homeTeam"];
  score: number | null;
  pen: number | null;
  win: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 py-1", !win && score !== null && "text-muted-foreground")}>
      <TeamCrest team={team} className="h-5 w-5" />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className={cn("truncate", win && "font-semibold")}>
          {team?.name ?? "TBD"}
        </span>
        {team?.ranking != null && (
          <span
            className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground"
            title="FIFA ranking"
          >
            #{team.ranking}
          </span>
        )}
      </span>
      <span className="shrink-0 tabular-nums">
        {score ?? ""}
        {pen != null && (
          <span className="ml-1 text-xs text-muted-foreground">({pen})</span>
        )}
      </span>
    </div>
  );
}

// A column of cards for one round. Each card sits in an equal-height slot and is
// vertically centered, so adjacent rounds line up and the connector elbows
// (drawn by `Connectors`) hit the card centers exactly.
function RoundColumn({
  round,
  activeId,
}: {
  round: BracketRound;
  activeId: string | null;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <RoundHeading>{stageLabel(round.stage)}</RoundHeading>
      <div className="flex flex-1 flex-col">
        {round.matches.map((m) => (
          <div key={m.id} className="flex flex-1 items-center justify-center">
            <BracketMatch match={m} highlighted={activeId === `match-${m.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundHeading({
  children,
  hidden,
}: {
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <h2
      className={cn(
        "mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground",
        hidden && "invisible",
      )}
      aria-hidden={hidden}
    >
      {children}
    </h2>
  );
}

// Connector lines between a round of `leftCount` cards and the next round of
// `rightCount` cards. Only drawn for a clean halving (each next-round card fed
// by two cards), which is the normal single-elimination shape; otherwise we
// just reserve the gap. The empty heading keeps the slots aligned with the
// neighbouring columns' cards.
function Connectors({
  leftCount,
  rightCount,
}: {
  leftCount: number;
  rightCount: number;
}) {
  const elbows = rightCount > 0 && leftCount === rightCount * 2;
  return (
    <div className="flex w-16 shrink-0 flex-col">
      <RoundHeading hidden>·</RoundHeading>
      <div className="flex flex-1 flex-col">
        {elbows
          ? Array.from({ length: rightCount }).map((_, i) => (
              // Classic bracket elbow: a stub out of each of the two feeder
              // cards (at 1/4 and 3/4 height), joined by a vertical line, then a
              // single line out to the next round's card at the centre.
              <div key={i} className="relative flex-1">
                {/* Stub from the upper feeder card. */}
                <span className="absolute left-0 top-1/4 h-px w-1/2 bg-border" />
                {/* Stub from the lower feeder card. */}
                <span className="absolute bottom-1/4 left-0 h-px w-1/2 bg-border" />
                {/* Vertical line joining the two stubs. */}
                <span className="absolute bottom-1/4 left-1/2 top-1/4 w-px bg-border" />
                {/* Line out to the next round's card. */}
                <span className="absolute left-1/2 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              </div>
            ))
          : null}
      </div>
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
  const spine = SPINE_STAGES.map((stage) =>
    rounds.find((r) => r.stage === stage),
  ).filter((r): r is BracketRound => Boolean(r));
  const thirdPlace = rounds.find((r) => r.stage === "THIRD_PLACE");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Knockout Bracket</h1>
      {rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The knockout stage hasn't been drawn yet.
        </p>
      ) : (
        <div className="flex items-stretch overflow-x-auto pb-4">
          {spine.map((round, i) => (
            <div key={round.stage} className="flex items-stretch">
              <RoundColumn round={round} activeId={activeId} />
              {i < spine.length - 1 && (
                <Connectors
                  leftCount={round.matches.length}
                  rightCount={spine[i + 1].matches.length}
                />
              )}
            </div>
          ))}
          {thirdPlace && (
            <div className="ml-10 flex items-stretch border-l pl-10">
              <RoundColumn round={thirdPlace} activeId={activeId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
