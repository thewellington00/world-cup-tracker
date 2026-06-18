import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function TeamCrest({
  team,
  className,
}: {
  team: Team | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const name = team?.name ?? "TBD";
  const showImg = team?.crest && !broken;

  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold text-muted-foreground",
        className,
      )}
      title={name}
    >
      {showImg ? (
        <img
          src={team!.crest!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
