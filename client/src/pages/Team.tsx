import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchTeam } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { TeamCrest } from "@/components/TeamCrest";
import { Skeleton } from "@/components/ui/skeleton";

export function Team() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeam(id!),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.fixtures.some((m) => m.isLive) ? 30_000 : false,
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  if (isError || !data)
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-destructive">Couldn't load this team.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex items-center gap-3">
        <TeamCrest team={data.team} className="h-12 w-12" />
        <h1 className="text-2xl font-bold tracking-tight">{data.team.name}</h1>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fixtures &amp; Results
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.fixtures.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back to feed
    </Link>
  );
}
