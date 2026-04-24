import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, RotateCcw, Undo2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ShotDot } from "@/components/HalfCourt";
import { PlayerPanel } from "@/components/PlayerPanel";
import { getSessionDetails } from "@/api/sessions";
import { submitShotAPI, finishRoundAPI } from "@/api/game";

// ── Constants ──
const SHOTS_PER_PLAYER = 5;

// ── Types ──
interface PlayerInfo {
  player_id: string;
  player_name: string;
}

type GamePhase = "loading" | "playing" | "finishing";

// ── Component ──

export function GamePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  // Session data
  const [sessionId, setSessionId] = useState("");
  const [teamId] = useState(() => sessionStorage.getItem("currentTeamId") || "");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [error, setError] = useState("");

  // Shot tracking
  const [shots, setShots] = useState<ShotDot[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [shotCounts, setShotCounts] = useState<Record<string, number>>({});

  // Game progression specific
  const [currentRound, setCurrentRound] = useState(1);
  const [bannedZone, setBannedZone] = useState<number | null>(null);

  // Animation
  const [courtVisible, setCourtVisible] = useState(false);
  const courtContainerRef = useRef<HTMLDivElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load session data ──
  useEffect(() => {
    if (!sessionCode) return;

    const currentTeamId = sessionStorage.getItem("currentTeamId") || "";

    (async () => {
      try {
        const details = await getSessionDetails(sessionCode);
        setSessionId(details.session.session_id);

        // Find our team's players
        const ourTeam = details.teams.find(
          (t) => t.team_id === currentTeamId
        );
        if (ourTeam) {
          if (ourTeam.round_2_finished) {
            navigate(`/session/${sessionCode}/final`);
            return;
          } else if (ourTeam.round_1_finished) {
            setCurrentRound(2);
            setBannedZone(ourTeam.banned_zone || null);
          } else {
            setCurrentRound(1);
          }

          if (ourTeam.player) {
            setPlayers(
              ourTeam.player.map((p) => ({
                player_id: p.player_id,
                player_name: p.player_name,
              }))
            );
          }
        }

        setPhase("playing");

        // Trigger entrance animation after a tick
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setCourtVisible(true));
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load game data");
      }
    })();
  }, [sessionCode, navigate]);

  // ── Active player ──
  const activePlayer = players[activePlayerIndex] || null;
  const activePlayerShotCount = activePlayer
    ? shotCounts[activePlayer.player_id] || 0
    : 0;

  // Check if all players have finished
  const allDone =
    players.length > 0 &&
    players.every((p) => (shotCounts[p.player_id] || 0) >= SHOTS_PER_PLAYER);

  // ── Shot handler — local state only, backend receives shots on Finish Round ──
  const handleShotPlaced = useCallback(
    (svgX: number, svgY: number, zone: number, made: boolean) => {
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

      // Auto-advance after 5 shots
      if (newCount >= SHOTS_PER_PLAYER) {
        const nextIndex = findNextPlayer(activePlayerIndex, players, {
          ...shotCounts,
          [activePlayer.player_id]: newCount,
        });
        if (nextIndex !== null) {
          advanceTimerRef.current = setTimeout(() => setActivePlayerIndex(nextIndex), 400);
        }
      }
    },
    [activePlayer, activePlayerIndex, activePlayerShotCount, players, shotCounts]
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

  // ── Finish round — submit all local shots to backend, then mark round done ──
  const handleFinishRound = useCallback(async () => {
    setPhase("finishing");
    try {
      await Promise.all(
        shots.map((shot) =>
          submitShotAPI({
            player_id: shot.playerId,
            team_id: teamId,
            session_id: sessionId,
            round_number: currentRound,
            zone: shot.zone,
            shot_made: shot.made,
          })
        )
      );
      await finishRoundAPI({ team_id: teamId, round_number: currentRound });
      if (currentRound === 2) {
        navigate(`/session/${sessionCode}/final`);
      } else {
        navigate(`/session/${sessionCode}/results`);
      }
    } catch (err) {
      console.error("Failed to finish round:", err);
      setPhase("playing");
    }
  }, [shots, teamId, sessionId, currentRound, navigate, sessionCode]);

  // ── Undo last shot — local state only ──
  const handleUndo = useCallback(() => {
    if (shots.length === 0) return;

    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    const lastShot = shots[shots.length - 1];
    const removedPlayerId = lastShot.playerId;

    setShots((prev) => prev.slice(0, -1));
    setShotCounts((prev) => ({
      ...prev,
      [removedPlayerId]: Math.max(0, (prev[removedPlayerId] || 0) - 1),
    }));

    const newActiveIndex = players.findIndex(
      (p) => p.player_id === removedPlayerId
    );
    if (newActiveIndex !== -1) {
      setActivePlayerIndex(newActiveIndex);
    }
  }, [shots, players]);

  // ── Reset — local state only ──
  const handleReset = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
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
          className="transition-all duration-[800ms] ease-out relative"
          style={{
            transform: courtVisible
              ? "rotateX(0deg)"
              : "rotateX(55deg)",
            opacity: courtVisible ? 1 : 0,
            transformOrigin: "center bottom",
          }}
        >
          {currentRound === 2 && bannedZone && (
            <div className="absolute -top-12 left-0 w-full text-center text-red-500 font-bold animate-pulse z-10 text-xl">
              Round 2: Zone {bannedZone} is BANNED!
            </div>
          )}
          <HalfCourt
            shots={shots}
            bannedZone={bannedZone}
            onShotPlaced={handleShotPlaced}
            disabled={allDone || phase === "finishing"}
          />
        </div>
      </div>

      {/* Player panel — extracted component */}
      <PlayerPanel
        players={players}
        activePlayerIndex={activePlayerIndex}
        shotCounts={shotCounts}
        shotsPerPlayer={SHOTS_PER_PLAYER}
        onPlayerClick={handlePlayerClick}
      />

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
          onClick={handleUndo}
          disabled={shots.length === 0 || phase === "finishing"}
        >
          <Undo2 className="size-3.5" />
          Undo
        </Button>

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
