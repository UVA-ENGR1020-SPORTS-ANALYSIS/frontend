import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  team_id: string;
  points: number;
  label: string;
  isMe: boolean;
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardList({ entries }: LeaderboardListProps) {
  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-sm space-y-1.5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">
        Leaderboard
      </h2>
      {entries.map((entry, idx) => {
        const rank = idx + 1;
        const isTop = rank === 1;
        return (
          <div
            key={entry.team_id}
            className={`flex justify-between items-center px-3 py-2 rounded-xl border gap-4 ${
              entry.isMe
                ? "bg-primary/10 border-primary/40"
                : "bg-card"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {isTop ? (
                  <Trophy className="size-3.5 text-yellow-500" />
                ) : rank === 2 ? (
                  <Medal className="size-3.5 text-muted-foreground" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                )}
              </div>
              <span className="font-semibold text-sm truncate">{entry.label}</span>
              {entry.isMe && (
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider">You</span>
              )}
            </div>
            <span className="font-black text-lg text-primary shrink-0">{entry.points}</span>
          </div>
        );
      })}
    </div>
  );
}

export default LeaderboardList;
