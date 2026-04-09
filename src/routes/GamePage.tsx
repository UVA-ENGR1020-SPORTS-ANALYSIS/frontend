import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2, RotateCcw, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ShotDot } from "@/components/HalfCourt";
import { getSessionDetails } from "@/api/sessions";
import { submitShotAPI, finishRoundAPI } from "@/api/game";

// ── Constants ──
const SHOTS_PER_PLAYER = 5;

// ── Types ──
interface PlayerInfo {
  player_id: string;
  player_name: string;
}

type GamePhase = "loading" | "playing" | "finishing" | "waiting";

// ── Component ──

export function GamePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();

  // Session data
  const [sessionId, setSessionId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [targetTeam, setTargetTeam] = useState(2);
  const [error, setError] = useState("");

  // Shot tracking
  const [shots, setShots] = useState<ShotDot[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [shotCounts, setShotCounts] = useState<Record<string, number>>({});

  // Animation
  const [courtVisible, setCourtVisible] = useState(false);
  const courtContainerRef = useRef<HTMLDivElement>(null);

  // ── Load session data ──
  useEffect(() => {
    if (!sessionCode) return;

    const currentTeamId = localStorage.getItem("currentTeamId") || "";
    setTeamId(currentTeamId);

    (async () => {
      try {
        const details = await getSessionDetails(sessionCode);
        setSessionId(details.session.session_id);
        setTargetTeam(details.session.target_team);

        // Find our team's players
        const ourTeam = details.teams.find(
          (t: any) => t.team_id === currentTeamId
        );
        if (ourTeam?.player) {
          setPlayers(
            ourTeam.player.map((p: any) => ({
              player_id: p.player_id,
              player_name: p.player_name,
            }))
          );
        }

        setPhase("playing");

        // Trigger entrance animation after a tick
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setCourtVisible(true));
        });
      } catch (err: any) {
        setError(err.message || "Failed to load game data");
      }
    })();
  }, [sessionCode]);

  // ── Active player ──
  const activePlayer = players[activePlayerIndex] || null;
  const activePlayerShotCount = activePlayer
    ? shotCounts[activePlayer.player_id] || 0
    : 0;

  // Check if all players have finished
  const allDone =
    players.length > 0 &&
    players.every((p) => (shotCounts[p.player_id] || 0) >= SHOTS_PER_PLAYER);

  // ── Shot handler ──
  const handleShotPlaced = useCallback(
    async (svgX: number, svgY: number, zone: number, made: boolean) => {
      if (!activePlayer || activePlayerShotCount >= SHOTS_PER_PLAYER) return;

      const newShot: ShotDot = {
        id: `${activePlayer.player_id}-${Date.now()}`,
        svgX,
        svgY,
        made,
        zone,
        playerId: activePlayer.player_id,
      };

      setShots((prev) => [...prev, newShot]);

      const newCount = activePlayerShotCount + 1;
      setShotCounts((prev) => ({
        ...prev,
        [activePlayer.player_id]: newCount,
      }));

      // Submit to backend (fire and forget, don't block UI)
      submitShotAPI({
        player_id: activePlayer.player_id,
        team_id: teamId,
        session_id: sessionId,
        round_number: 1,
        zone,
        shot_made: made,
      }).catch((err) => console.error("Failed to record shot:", err));

      // Auto-advance after 5 shots
      if (newCount >= SHOTS_PER_PLAYER) {
        // Find next player who hasn't finished
        const nextIndex = findNextPlayer(activePlayerIndex, players, {
          ...shotCounts,
          [activePlayer.player_id]: newCount,
        });
        if (nextIndex !== null) {
          // Small delay so user sees the last dot land
          setTimeout(() => setActivePlayerIndex(nextIndex), 400);
        }
      }
    },
    [activePlayer, activePlayerIndex, activePlayerShotCount, players, shotCounts, teamId, sessionId]
  );

  // ── Player switching ──
  const handlePlayerClick = useCallback(
    (index: number) => {
      if (index === activePlayerIndex) return;

      const currentCount = activePlayer
        ? shotCounts[activePlayer.player_id] || 0
        : 0;

      // Can't switch away from a player who has started but not finished (1-4 shots)
      if (currentCount > 0 && currentCount < SHOTS_PER_PLAYER) return;

      // Can't switch to a player who is already done
      const targetPlayer = players[index];
      if ((shotCounts[targetPlayer.player_id] || 0) >= SHOTS_PER_PLAYER) return;

      setActivePlayerIndex(index);
    },
    [activePlayerIndex, activePlayer, players, shotCounts]
  );

  // ── Finish round ──
  const handleFinishRound = useCallback(async () => {
    setPhase("finishing");
    try {
      await finishRoundAPI({ team_id: teamId, round_number: 1 });
      setPhase("waiting");
    } catch (err) {
      console.error("Failed to finish round:", err);
      setPhase("playing");
    }
  }, [teamId]);

  // ── Reset (test button) ──
  const handleReset = useCallback(() => {
    setShots([]);
    setShotCounts({});
    setActivePlayerIndex(0);
    setPhase("playing");
    // Re-trigger animation
    setCourtVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setCourtVisible(true));
    });
  }, []);

  // ── Loading state ──
  if (phase === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        {error ? (
          <p className="text-destructive font-medium text-lg">{error}</p>
        ) : (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  // ── Waiting state ──
  if (phase === "waiting") {
    const totalPoints = shots.reduce((sum, s) => {
      if (!s.made) return sum;
      if (s.zone === 1) return sum + 1;
      if (s.zone <= 3) return sum + 2;
      return sum + 3;
    }, 0);

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Clock className="size-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold">Round Complete!</h1>
          <p className="text-muted-foreground max-w-xs">
            {targetTeam === 1
              ? "All your shots have been recorded! Great job."
              : "Waiting for the other team to finish their round..."}
          </p>
        </div>

        <div className="flex gap-6 text-center">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-primary">{totalPoints}</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Points
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-black text-green-500">
              {shots.filter((s) => s.made).length}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Makes
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-black text-red-500">
              {shots.filter((s) => !s.made).length}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Misses
            </span>
          </div>
        </div>

        <Button variant="outline" size="lg" className="gap-2" onClick={handleReset}>
          <RotateCcw className="size-4" />
          Reset & Test Again
        </Button>
      </div>
    );
  }

  // ── Main game view ──
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-6">
      {/* Perspective container for 3D court animation */}
      <div
        ref={courtContainerRef}
        style={{ perspective: "1200px" }}
        className="w-full max-w-[540px]"
      >
        <div
          className="transition-all duration-[800ms] ease-out"
          style={{
            transform: courtVisible
              ? "rotateX(0deg)"
              : "rotateX(55deg)",
            opacity: courtVisible ? 1 : 0,
            transformOrigin: "center bottom",
          }}
        >
          <HalfCourt
            shots={shots}
            onShotPlaced={handleShotPlaced}
            disabled={allDone || phase === "finishing"}
          />
        </div>
      </div>

      {/* Player panel */}
      <div className="flex gap-3 flex-wrap justify-center">
        {players.map((player, i) => {
          const count = shotCounts[player.player_id] || 0;
          const isActive = i === activePlayerIndex;
          const isDone = count >= SHOTS_PER_PLAYER;

          return (
            <button
              key={player.player_id}
              onClick={() => handlePlayerClick(i)}
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
                  `${count} / ${SHOTS_PER_PLAYER}`
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 items-center">
        {allDone && phase === "playing" && (
          <Button
            size="lg"
            className="gap-2 text-lg h-14 animate-pulse"
            onClick={handleFinishRound}
          >
            <Trophy className="size-5" />
            Finish Round
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={handleReset}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}

// ── Helpers ──

function findNextPlayer(
  currentIndex: number,
  players: PlayerInfo[],
  counts: Record<string, number>
): number | null {
  for (let offset = 1; offset < players.length; offset++) {
    const idx = (currentIndex + offset) % players.length;
    if ((counts[players[idx].player_id] || 0) < SHOTS_PER_PLAYER) {
      return idx;
    }
  }
  return null;
}

export default GamePage;
