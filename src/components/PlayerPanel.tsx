import { Trophy } from "lucide-react";

interface PlayerInfo {
  player_id: string;
  player_name: string;
}

interface PlayerPanelProps {
  players: PlayerInfo[];
  activePlayerIndex: number;
  shotCounts: Record<string, number>;
  shotsPerPlayer: number;
  onPlayerClick: (index: number) => void;
}

/**
 * Renders the row of player selection buttons on the GamePage.
 */
export function PlayerPanel({
  players,
  activePlayerIndex,
  shotCounts,
  shotsPerPlayer,
  onPlayerClick,
}: PlayerPanelProps) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {players.map((player, i) => {
        const count = shotCounts[player.player_id] || 0;
        const isActive = i === activePlayerIndex;
        const isDone = count >= shotsPerPlayer;

        return (
          <button
            key={player.player_id}
            onClick={() => onPlayerClick(i)}
            className={`
              px-4 py-3 rounded-xl text-sm font-semibold
              transition-all duration-200 min-w-[120px]
              border-2 cursor-pointer
              ${
                isActive
                  ? "bg-red-700 border-red-500 text-white font-extrabold shadow-[0_0_16px_rgba(210,30,30,0.65)]"
                  : isDone
                  ? "bg-green-900/20 border-green-700/40 text-green-400 opacity-60"
                  : "bg-sky-400/80 border-sky-500 text-sky-950 hover:bg-sky-300"
              }
            `}
          >
            <div>{player.player_name}</div>
            <div className="text-xs mt-0.5 opacity-80">
              {isDone ? (
                <span className="flex items-center justify-center gap-1">
                  <Trophy className="size-3" /> Done
                </span>
              ) : (
                `${count} / ${shotsPerPlayer}`
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default PlayerPanel;
