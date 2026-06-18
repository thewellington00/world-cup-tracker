import { useQuery } from "@tanstack/react-query";
import { fetchMatches, type Match } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKey, isToday } from "@/lib/format";

function groupByDay(matches: Match[]) {
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const key = dayKey(m.utcDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return [...groups.entries()];
}

export function Feed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
    // Poll every 30s while any match is in progress; otherwise stay idle.
    refetchInterval: (query) =>
      query.state.data?.some((m) => m.isLive) ? 30_000 : false,
  });

  if (isLoading) return <FeedSkeleton />;
  if (isError)
    return (
      <p className="text-sm text-destructive">
        Couldn't load matches. Is the API server running?
      </p>
    );

  const matches = data ?? [];
  const liveCount = matches.filter((m) => m.isLive).length;
  const days = groupByDay(matches);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Match Feed</h1>
        {liveCount > 0 && (
          <Badge variant="live" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-current" />
            {liveCount} live now
          </Badge>
        )}
      </div>

      {days.map(([day, dayMatches]) => {
        const today = isToday(dayMatches[0].utcDate);
        return (
          <section key={day} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </h2>
              {today && <Badge variant="default">Today</Badge>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dayMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
