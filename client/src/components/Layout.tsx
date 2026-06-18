import { useSyncExternalStore } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Trophy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDataSource, subscribeDataSource } from "@/lib/api";

const NAV = [
  { to: "/", label: "Feed", end: true },
  { to: "/standings", label: "Standings", end: false },
  { to: "/bracket", label: "Bracket", end: false },
];

export function Layout() {
  const dataSource = useSyncExternalStore(subscribeDataSource, getDataSource);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 font-bold">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>World Cup 2026</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {dataSource === "sample" && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10">
          <div className="container flex items-center gap-2 py-2 text-xs text-yellow-600 dark:text-yellow-400">
            <Info className="h-3.5 w-3.5" />
            Showing bundled sample data — add a football-data.org API key to
            <code className="rounded bg-muted px-1">server/.env</code> for live results.
          </div>
        </div>
      )}

      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
