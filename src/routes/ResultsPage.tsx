import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import { PlayerStatsList } from "@/components/PlayerStatsList";
import { fetchTeamStatsAPI, fetchOpponentStatsAPI } from "@/api/game";
import type { RawShot } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";

export function ResultsPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  
  const [targetTeam, setTargetTeam] = useState(1);
  const [sessionId, setSessionId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [opponentReady, setOpponentReady] = useState(false);

  interface RoundPlayerStat {
    player_id: string;
    player_name: string;
    total_makes: number;
    total_attempts: number;
    total_points: number;
    shooting_pct: number;
  }
  const [playerStats, setPlayerStats] = useState<RoundPlayerStat[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const tId = sessionStorage.getItem("currentTeamId");
        if (!tId || !sessionCode) throw new Error("Missing session or team info");
        setTeamId(tId);

        const [details, stats] = await Promise.all([
          getSessionDetails(sessionCode),
          fetchTeamStatsAPI(tId, 1),
        ]);
        setTargetTeam(details.session.target_team);
        setSessionId(details.session.session_id);
        setTotalPoints(stats.points);

        // Build zone stats from round-specific raw_shots
        const zStats = stats.raw_shots.reduce((acc: Record<number, ZoneStat>, s: RawShot) => {
          const z = s.zone;
          if (!acc[z]) acc[z] = { makes: 0, attempts: 0, percentage: 0 };
          acc[z].attempts += 1;
          if (s.shot_made) acc[z].makes += 1;
          acc[z].percentage = (acc[z].makes / acc[z].attempts) * 100;
          return acc;
        }, Object.fromEntries(
          Array.from({ length: 6 }, (_, i) => [i + 1, { makes: 0, attempts: 0, percentage: 0 }])
        ) as Record<number, ZoneStat>);
        setZoneStats(zStats);

        // Build per-player stats from the same raw_shots — consistent with heatmap
        const ourTeam = details.teams.find((t) => t.team_id === tId);
        const nameMap = new Map(
          (ourTeam?.player ?? []).map((p) => [p.player_id, p.player_name])
        );
        const perPlayer = new Map<string, { makes: number; attempts: number; points: number }>();
        for (const s of stats.raw_shots) {
          const pid = s.shot_player_id;
          if (!pid) continue;
          const cur = perPlayer.get(pid) ?? { makes: 0, attempts: 0, points: 0 };
          cur.attempts += 1;
          if (s.shot_made) cur.makes += 1;
          cur.points += s.points ?? 0;
          perPlayer.set(pid, cur);
        }
        setPlayerStats(
          Array.from(perPlayer.entries()).map(([pid, s]) => ({
            player_id: pid,
            player_name: nameMap.get(pid) ?? pid,
            total_makes: s.makes,
            total_attempts: s.attempts,
            total_points: s.points,
            shooting_pct: s.attempts > 0 ? Math.round((s.makes / s.attempts) * 100) : 0,
          }))
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionCode]);

  // Poll for opponent completion if multi-team
  useEffect(() => {
    if (targetTeam === 1 || !sessionId || !teamId || opponentReady) return;

    const intervalId = setInterval(async () => {
      try {
        const { status } = await fetchOpponentStatsAPI(sessionId, teamId);
        if (status === "ready") {
          setOpponentReady(true);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling opponent stats failed:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [targetTeam, sessionId, teamId, opponentReady]);


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <p className="text-destructive font-medium text-lg mb-4">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden flex-col items-center justify-center px-4 py-2 gap-2">
      <div className="text-center flex flex-col gap-1 shrink-0 mt-4">
        <h1 className="text-2xl font-black">Round 1 Results</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your team's shooting performance
        </p>
      </div>

      <div className="relative shrink-1 min-h-[300px] flex items-center justify-center scale-75 origin-center -my-10">
        <HalfCourt shots={[]} disabled={true} zoneStats={zoneStats} />
      </div>

      <div className="flex flex-col items-center shrink-0 z-10">
        <span className="text-4xl font-black text-primary leading-none">{totalPoints}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          Total Points
        </span>
      </div>

      {/* Per-player breakdown — extracted component */}
      <div className="z-10">
        <PlayerStatsList players={playerStats} />
      </div>
      <Button variant="outline" onClick={() => navigate(`/session/${sessionCode}/stats`)}>
        View Stats
      </Button>
      <div className="h-14 flex items-center justify-center shrink-0 z-10 mt-2">
        {targetTeam === 1 ? (
          <div className="p-4 bg-green-500/10 text-green-600 font-bold rounded-lg border border-green-500/20">
            Game Finished! Excellent Performance.
          </div>
        ) : opponentReady ? (
          <Button 
            size="lg" 
            className="gap-2 text-lg h-14 animate-in fade-in zoom-in"
            onClick={() => navigate(`/session/${sessionCode}/ban`)}
          >
            Enter Ban Phase
            <ArrowRight className="size-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground font-medium animate-pulse">
            <Clock className="size-5" />
            Waiting for opponent to finish Round 1...
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
