import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { LocateFixed, RefreshCw } from "lucide-react";
import { fetchMatches, type Match } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
    // Poll every 30s while any match is in progress; otherwise stay idle.
    refetchInterval: (query) =>
      query.state.data?.some((m) => m.isLive) ? 30_000 : false,
  });

  const todayRef = useRef<HTMLElement | null>(null);
  const didScrollRef = useRef(false);
  const [showJump, setShowJump] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  // A "#match-<id>" hash means we're returning from the standings page (via its
  // "back to feed" link) and should land back on that exact card.
  const { hash } = useLocation();
  const returnMatchId = hash.startsWith("#match-") ? hash.slice(1) : null;

  // Once matches first load, jump to the card we came back to (if any),
  // otherwise to today's section.
  useEffect(() => {
    if (!data || didScrollRef.current) return;
    if (returnMatchId) {
      const el = document.getElementById(returnMatchId);
      if (!el) return; // wait until the target card has rendered
      didScrollRef.current = true;
      el.scrollIntoView({ block: "center" });
      setFlashId(returnMatchId);
      const timer = setTimeout(() => setFlashId(null), 2000);
      return () => clearTimeout(timer);
    }
    if (!todayRef.current) return;
    didScrollRef.current = true;
    todayRef.current.scrollIntoView({ block: "start" });
  }, [data, returnMatchId]);

  // Reveal the floating "jump to today" pill whenever today scrolls off-screen.
  useEffect(() => {
    const el = todayRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowJump(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  const scrollToToday = () =>
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <Badge variant="live" className="gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-current" />
              {liveCount} live now
            </Badge>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {days.map(([day, dayMatches]) => {
        const today = isToday(dayMatches[0].utcDate);
        return (
          <section
            key={day}
            ref={today ? todayRef : undefined}
            className={cn(
              "scroll-mt-24 space-y-3",
              today &&
                "-mx-3 rounded-xl bg-primary/[0.04] p-3 ring-1 ring-primary/15",
            )}
          >
            {today && (
              <div className="flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-primary/30" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Today
                </span>
                <span className="h-px flex-1 bg-primary/30" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <h2
                className={cn(
                  "text-sm font-semibold uppercase tracking-wide",
                  today ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {day}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dayMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  highlighted={flashId === `match-${m.id}`}
                />
              ))}
            </div>
          </section>
        );
      })}

      {showJump && (
        <button
          type="button"
          onClick={scrollToToday}
          className="fixed bottom-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-lg transition-colors hover:bg-accent"
        >
          <LocateFixed className="h-4 w-4" />
          Jump to today
        </button>
      )}
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
