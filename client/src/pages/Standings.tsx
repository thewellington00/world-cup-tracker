import { useQuery } from "@tanstack/react-query";
import { fetchStandings, type GroupStanding } from "@/lib/api";
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

function GroupTable({ group }: { group: GroupStanding }) {
  return (
    <Card>
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
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Standings aren't available yet.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <GroupTable key={g.group} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
