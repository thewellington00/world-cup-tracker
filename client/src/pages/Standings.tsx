import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { fetchStandings, type GroupStanding } from "@/lib/api";
import { groupSlug } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function GroupTable({
  group,
  highlighted,
}: {
  group: GroupStanding;
  highlighted: boolean;
}) {
  return (
    <Card
      id={groupSlug(group.group)}
      className={cn(
        "scroll-mt-24 transition-shadow",
        highlighted && "ring-2 ring-primary",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{group.group}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">GD</TableHead>
              <TableHead className="text-center font-semibold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.table.map((row) => (
              <TableRow
                key={row.team.id ?? row.position}
                className={cn(row.position <= 2 && "bg-emerald-500/5")}
              >
                <TableCell className="text-muted-foreground">
                  <span
                    className={cn(
                      "inline-block w-4",
                      row.position <= 2 &&
                        "border-l-2 border-emerald-500 pl-1 font-medium text-foreground",
                    )}
                  >
                    {row.position}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    to={row.team.id ? `/team/${row.team.id}` : "#"}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <TeamCrest team={row.team} className="h-5 w-5" />
                    <span className="truncate">{row.team.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                <TableCell className="text-center tabular-nums">{row.won}</TableCell>
                <TableCell className="text-center tabular-nums">{row.draw}</TableCell>
                <TableCell className="text-center tabular-nums">{row.lost}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </TableCell>
                <TableCell className="text-center font-semibold tabular-nums">
                  {row.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function Standings() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
  });

  // When arriving via a match-card group link (e.g. /standings#group-a),
  // scroll that group into view and flash a highlight that fades out.
  const location = useLocation();
  const targetSlug = decodeURIComponent(location.hash.replace(/^#/, ""));
  // Set when we arrived from a feed match card; lets us offer a link back to
  // that exact card rather than the top of the feed.
  const fromMatchId = (location.state as { fromMatchId?: number } | null)
    ?.fromMatchId;
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!targetSlug || !data) return;
    const el = document.getElementById(targetSlug);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSlug(targetSlug);
    const timer = setTimeout(() => setActiveSlug(null), 2000);
    return () => clearTimeout(timer);
  }, [targetSlug, data]);

  if (isLoading)
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  if (isError)
    return <p className="text-sm text-destructive">Couldn't load standings.</p>;

  const groups = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Standings</h1>
        <p className="text-sm text-muted-foreground">
          Top two of each group advance to the knockout stage.
        </p>
      </div>

      {/* Floating pill so the return path stays visible even after the page
          auto-scrolls to the tapped group (which pushes the header off-screen). */}
      {fromMatchId != null && (
        <Link
          to={`/#match-${fromMatchId}`}
          className="fixed bottom-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-lg transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
      )}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Standings aren't available yet.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <GroupTable
              key={g.group}
              group={g}
              highlighted={activeSlug === groupSlug(g.group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
