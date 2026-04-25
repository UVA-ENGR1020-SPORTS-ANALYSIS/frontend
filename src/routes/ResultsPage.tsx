import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import { PlayerStatsList } from "@/components/PlayerStatsList";
import { fetchTeamStatsAPI, fetchOpponentStatsAPI } from "@/api/game";
import type { RawShot } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";

interface RoundPlayerStat {
  player_id: string;
  player_name: string;
  total_makes: number;
  total_attempts: number;
  total_points: number;
  shooting_pct: number;
}

interface CachedR1 {
  targetTeam: number;
  sessionId: string;
  teamId: string;
  zoneStats: Record<number, ZoneStat>;
  totalPoints: number;
  playerStats: RoundPlayerStat[];
}

export function ResultsPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  // Stale-while-revalidate cache for the round-1 results payload.
  // View Stats → back renders instantly from cache; we still refetch
  // in the background to pick up any drift.
  const cacheKey = sessionCode ? `r1Results_${sessionCode}` : "";
  const cachedInitial: CachedR1 | null = (() => {
    if (!cacheKey) return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as CachedR1) : null;
    } catch {
      return null;
    }
  })();

  const [loading, setLoading] = useState(!cachedInitial);
  const [error, setError] = useState("");
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>(cachedInitial?.zoneStats ?? {});
  const [totalPoints, setTotalPoints] = useState(cachedInitial?.totalPoints ?? 0);

  const [targetTeam, setTargetTeam] = useState(cachedInitial?.targetTeam ?? 1);
  // True when the session physically has only one team — handles the case
  // where the backend stored target_team=2 for what was actually played as
  // a single-team session (no opponent will ever join).
  const [effectivelySolo, setEffectivelySolo] = useState(false);
  const [sessionId, setSessionId] = useState(cachedInitial?.sessionId ?? "");
  const [teamId, setTeamId] = useState(cachedInitial?.teamId ?? "");
  // Persist across navigations (e.g. View Stats → back) so we don't re-poll
  // and re-show "Waiting for opponent…" for something we already detected.
  const opponentReadyKey = sessionCode ? `opponentReady_r1_${sessionCode}` : "";
  const [opponentReady, setOpponentReady] = useState<boolean>(() => {
    if (!opponentReadyKey) return false;
    return sessionStorage.getItem(opponentReadyKey) === "1";
  });

  const [playerStats, setPlayerStats] = useState<RoundPlayerStat[]>(cachedInitial?.playerStats ?? []);

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

        // Defensive: backend has occasionally returned 0 points even though
        // raw_shots exist. Don't render that — and wipe any cached version
        // of it so View Stats -> back doesn't keep showing the bad value.
        const rawShotsPoints = stats.raw_shots.reduce(
          (sum, s) => sum + (s.points ?? 0),
          0
        );
        if (stats.raw_shots.length > 0 && stats.points === 0 && rawShotsPoints > 0) {
          if (cacheKey) {
            try {
              sessionStorage.removeItem(cacheKey);
            } catch {
              // ignore
            }
          }
          throw new Error("Backend returned 0 points despite shots existing");
        }

        setTargetTeam(details.session.target_team);
        setSessionId(details.session.session_id);
        setTotalPoints(stats.points);
        // If this session only has one team, there is no opponent to wait
        // for — show the finished view even if target_team was stored as >1.
        setEffectivelySolo((details.teams ?? []).length <= 1);

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

        // Build per-player stats by walking the team roster (not the shots),
        // so we always have a real player_name. Iterating shots first meant
        // a shot whose shot_player_id wasn't in the roster (or arrived
        // before the roster did) fell back to the raw UUID — bad UX.
        const ourTeam = details.teams.find((t) => t.team_id === tId);
        const roster = ourTeam?.player ?? [];
        const shotsByPlayer = new Map<string, { makes: number; attempts: number; points: number }>();
        for (const s of stats.raw_shots) {
          const pid = s.shot_player_id;
          if (!pid) continue;
          const cur = shotsByPlayer.get(pid) ?? { makes: 0, attempts: 0, points: 0 };
          cur.attempts += 1;
          if (s.shot_made) cur.makes += 1;
          cur.points += s.points ?? 0;
          shotsByPlayer.set(pid, cur);
        }
        const nextPlayerStats: RoundPlayerStat[] = roster.map((p, idx) => {
          const s = shotsByPlayer.get(p.player_id) ?? { makes: 0, attempts: 0, points: 0 };
          return {
            player_id: p.player_id,
            player_name: p.player_name || `Player ${idx + 1}`,
            total_makes: s.makes,
            total_attempts: s.attempts,
            total_points: s.points,
            shooting_pct: s.attempts > 0 ? Math.round((s.makes / s.attempts) * 100) : 0,
          };
        });
        setPlayerStats(nextPlayerStats);

        // Persist for instant render on revisit (View Stats → back).
        if (cacheKey) {
          try {
            const payload: CachedR1 = {
              targetTeam: details.session.target_team,
              sessionId: details.session.session_id,
              teamId: tId,
              zoneStats: zStats,
              totalPoints: stats.points,
              playerStats: nextPlayerStats,
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(payload));
          } catch {
            // sessionStorage full or disabled — non-fatal.
          }
        }
      } catch (err: unknown) {
        // If we have cached data, don't blow up the page on a transient error.
        if (cachedInitial) {
          console.warn("ResultsPage refetch failed, keeping cached data:", err);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load stats");
        }
      } finally {
        setLoading(false);
      }
    })();
    // cachedInitial / cacheKey are stable per sessionCode — eslint-disable below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode]);

  // Poll for opponent completion if multi-team. We cross-check two
  // sources because relying on /opponent_stats alone has been flaky in
  // practice — if it returns "no_opponent" or any non-"ready" status we
  // can still confirm via getSessionDetails that every other team has
  // round_1_finished=true.
  useEffect(() => {
    if (targetTeam === 1 || effectivelySolo || !sessionId || !teamId || !sessionCode || opponentReady) return;

    const checkOnce = async () => {
      try {
        const [opp, details] = await Promise.allSettled([
          fetchOpponentStatsAPI(sessionId, teamId),
          getSessionDetails(sessionCode),
        ]);

        if (opp.status === "fulfilled" && opp.value.status === "ready") {
          return true;
        }

        if (details.status === "fulfilled") {
          const others = details.value.teams.filter((t) => t.team_id !== teamId);
          if (others.length > 0 && others.every((t) => t.round_1_finished)) {
            return true;
          }
        }

        if (opp.status === "rejected") console.error("opponent_stats poll failed:", opp.reason);
        if (details.status === "rejected") console.error("session details poll failed:", details.reason);
      } catch (err) {
        console.error("Polling opponent failed:", err);
      }
      return false;
    };

    const markReady = () => {
      if (opponentReadyKey) sessionStorage.setItem(opponentReadyKey, "1");
      setOpponentReady(true);
    };

    // Fire one check immediately so a returning user (View Stats → back)
    // doesn't have to wait a full interval before the button shows again.
    (async () => {
      if (await checkOnce()) markReady();
    })();

    const intervalId = setInterval(async () => {
      if (await checkOnce()) {
        markReady();
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetTeam, effectivelySolo, sessionId, teamId, sessionCode, opponentReady, opponentReadyKey]);


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
        {targetTeam === 1 || effectivelySolo ? (
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
