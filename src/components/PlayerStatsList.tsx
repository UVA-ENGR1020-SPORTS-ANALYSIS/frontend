import { User } from "lucide-react";
import type { PlayerStats } from "@/api/players";

interface PlayerStatsListProps {
  players: PlayerStats[];
}

/**
 * Renders a per-player stat breakdown list used on the FinalResultsPage.
 */
export function PlayerStatsList({ players }: PlayerStatsListProps) {
  if (players.length === 0) return null;

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">
        Your Players
      </h2>
      <div className="space-y-1.5">
        {players.map((p) => (
          <div
            key={p.player_id}
            className="flex justify-between items-center px-3 py-2 rounded-xl bg-card border transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-sm">{p.player_name}</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground font-medium">
              <span className="text-primary font-bold">{p.total_points} pts</span>
              <span>
                {p.total_makes}/{p.total_attempts}
              </span>
              <span>{p.shooting_pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerStatsList;
