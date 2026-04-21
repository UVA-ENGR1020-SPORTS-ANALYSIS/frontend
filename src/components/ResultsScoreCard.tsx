import { Trophy, Minus } from "lucide-react";

interface ResultsScoreCardProps {
  myPoints: number;
  oppPoints: number;
  winner: "me" | "opponent" | "tie" | null;
  hasOpponent: boolean;
}

/**
 * Displays the final score comparison card with victory/defeat/tie badge.
 */
export function ResultsScoreCard({
  myPoints,
  oppPoints,
  winner,
  hasOpponent,
}: ResultsScoreCardProps) {
  return (
    <div className="w-full max-w-sm flex flex-col gap-6 p-6 rounded-2xl bg-card border-2 shadow-xl ring-1 ring-black/5 items-center">
      {winner === "me" && (
        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
          <Trophy className="size-5" />
          <span>VICTORY!</span>
        </div>
      )}
      {winner === "opponent" && (
        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
          <Minus className="size-5" />
          <span>DEFEAT</span>
        </div>
      )}
      {winner === "tie" && (
        <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
          <Minus className="size-5" />
          <span>DRAW</span>
        </div>
      )}

      <div className="w-full flex justify-between items-center px-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-muted-foreground">YOU</span>
          <span
            className={`text-6xl font-black ${
              winner === "me" ? "text-green-500" : "text-foreground"
            }`}
          >
            {myPoints}
          </span>
        </div>

        {hasOpponent && (
          <>
            <div className="text-muted-foreground opacity-50 font-black text-2xl">
              VS
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-muted-foreground">
                OPP
              </span>
              <span
                className={`text-6xl font-black ${
                  winner === "opponent" ? "text-red-500" : "text-foreground"
                }`}
              >
                {oppPoints}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultsScoreCard;
