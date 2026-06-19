import { useQuery } from "@tanstack/react-query";
import { fetchBracket, type Match } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import { stageLabel, kickoffTime, durationNote } from "@/lib/format";

function BracketMatch({ match }: { match: Match }) {
  const finished = match.status === "FINISHED";
  const note = finished ? durationNote(match) : null;
  return (
    <Card className="w-60 p-3 text-sm">
      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {finished ? (note ? `Full time · ${note}` : "Full time") : kickoffTime(match.utcDate)}
      </div>
      <BracketSide team={match.homeTeam} score={match.score.home} win={match.score.winner === "HOME_TEAM"} />
      <BracketSide team={match.awayTeam} score={match.score.away} win={match.score.winner === "AWAY_TEAM"} />
    </Card>
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
  });

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
                  <BracketMatch key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
