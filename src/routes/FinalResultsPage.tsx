import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Trophy, ArrowRight, BarChart3, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import { ResultsScoreCard } from "@/components/ResultsScoreCard";
import { PlayerStatsList } from "@/components/PlayerStatsList";
import { LeaderboardList } from "@/components/LeaderboardList";
import { fetchFinalResultsAPI, fetchTeamStatsAPI, type RawShot } from "@/api/game";
import { getSessionDetails, type Team } from "@/api/sessions";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";

type Winner = "me" | "opponent" | "tie" | null;

interface TeamResult {
  team_id: string;
  points: number;
  raw_shots: RawShot[];
}

interface LoadedResults {
  myPoints: number;
  opponents: TeamResult[];
  allTeams: TeamResult[];
  zoneStats: Record<number, ZoneStat>;
  winner: Winner;
}

function computeZoneStats(rawShots: RawShot[]): Record<number, ZoneStat> {
  const stats: Record<number, ZoneStat> = Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [i + 1, { makes: 0, attempts: 0, percentage: 0 }])
  );
  for (const s of rawShots) {
    const z = stats[s.zone];
    if (!z) continue;
    z.attempts += 1;
    if (s.shot_made) z.makes += 1;
  }
  for (const z of Object.values(stats)) {
    z.percentage = z.attempts > 0 ? (z.makes / z.attempts) * 100 : 0;
  }
  return stats;
}

function teamLabel(team: Team, fallbackIndex: number): string {
  const first = team.player?.[0]?.player_name;
  if (first) {
    return team.player.length > 1
      ? `${first} + ${team.player.length - 1}`
      : first;
  }
  return `Team ${fallbackIndex + 1}`;
}

interface CachedFinal {
  results: LoadedResults;
  teams: Team[];
  targetTeam: number;
  myTeamId: string;
  myPlayerStats: PlayerStats[];
}

export function FinalResultsPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  // Stale-while-revalidate cache for the final-results payload.
  // View Stats → back renders instantly; we still refetch in background.
  const cacheKey = sessionCode ? `finalResults_${sessionCode}` : "";
  const cachedInitial: CachedFinal | null = (() => {
    if (!cacheKey) return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as CachedFinal) : null;
    } catch {
      return null;
    }
  })();

  const [loading, setLoading] = useState(!cachedInitial);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [results, setResults] = useState<LoadedResults | null>(cachedInitial?.results ?? null);
  const [teams, setTeams] = useState<Team[]>(cachedInitial?.teams ?? []);
  const [targetTeam, setTargetTeam] = useState(cachedInitial?.targetTeam ?? 1);
  const [myTeamId, setMyTeamId] = useState(cachedInitial?.myTeamId ?? "");
  const [myPlayerStats, setMyPlayerStats] = useState<PlayerStats[]>(cachedInitial?.myPlayerStats ?? []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    // If we hydrated from cache, treat that as already-loaded so a transient
    // refetch failure doesn't blow away the page with an error screen.
    let resultsEverLoaded = !!cachedInitial;
    let consecutiveTransientMisses = 0;
    let cancelled = false;

    const loadData = async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
        if (!teamId || !sessionCode) throw new Error("Missing session or team info");
        if (!cancelled) setMyTeamId(teamId);

        const details = await getSessionDetails(sessionCode);
        if (cancelled) return;

        // Sanity-check the response. A transient backend hiccup or an empty
        // teams payload should not blow the page up — keep polling and let
        // the next tick try again.
        const teamsList = details.teams ?? [];
        const myTeam = teamsList.find((t) => t.team_id === teamId);
        if (!myTeam) {
          consecutiveTransientMisses += 1;
          // Only show a hard error if we never loaded results AND this has
          // been failing for a while. Otherwise: soft-fail, keep polling.
          if (!resultsEverLoaded && consecutiveTransientMisses >= 6) {
            throw new Error("Team not found");
          }
          console.warn(
            `FinalResultsPage: team ${teamId} not in session yet (miss ${consecutiveTransientMisses})`
          );
          return;
        }
        consecutiveTransientMisses = 0;

        setTargetTeam(details.session.target_team);
        setTeams(teamsList);

        // Multi-team: wait for every other team to finish round 2
        if (details.session.target_team > 1) {
          const allFinished = teamsList.every((t) => t.round_2_finished);
          if (!allFinished) {
            setWaiting(true);
            setLoading(false);
            return;
          }
        }

        const [final, round2Stats] = await Promise.all([
          fetchFinalResultsAPI(details.session.session_id),
          fetchTeamStatsAPI(teamId, 2).catch(() => ({ points: 0, raw_shots: [] as RawShot[] })),
        ]);
        if (cancelled) return;
        const myEntry = final.teams.find((t) => t.team_id === teamId);
        const opponents = final.teams.filter((t) => t.team_id !== teamId);

        // Multi-team mode: if the backend hasn't surfaced the opponents yet
        // (transient race during finalization), skip this update so we don't
        // briefly render "24 vs 0". Stay on the loading/waiting view; the
        // next poll will pick up the full payload.
        if (details.session.target_team > 1 && opponents.length === 0) {
          consecutiveTransientMisses += 1;
          console.warn("FinalResultsPage: no opponents in final_results yet, retrying");
          return;
        }

        const myPoints = myEntry?.points ?? 0;
        const myShots = round2Stats.raw_shots ?? [];

        // Winner logic
        let winner: Winner = null;
        if (details.session.target_team === 1) {
          winner = "me";
        } else if (opponents.length > 0) {
          const topOpponentPoints = Math.max(...opponents.map((o) => o.points));
          if (myPoints > topOpponentPoints) winner = "me";
          else if (myPoints < topOpponentPoints) winner = "opponent";
          else winner = "tie";
        }

        const nextResults: LoadedResults = {
          myPoints,
          opponents,
          allTeams: final.teams,
          zoneStats: computeZoneStats(myShots),
          winner,
        };
        setResults(nextResults);
        setWaiting(false);
        setLoading(false);
        resultsEverLoaded = true;
        // NOTE: do NOT clear interval here — keep polling so late score updates
        // (e.g. another teammate finishing on a different device) propagate
        // without requiring a manual refresh.

        const { players } = await fetchTeamPlayers(teamId);
        if (cancelled) return;
        setMyPlayerStats(players);

        // Persist for instant render on revisit (View Stats → back).
        if (cacheKey) {
          try {
            const payload: CachedFinal = {
              results: nextResults,
              teams: teamsList,
              targetTeam: details.session.target_team,
              myTeamId: teamId,
              myPlayerStats: players,
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(payload));
          } catch {
            // sessionStorage full or disabled — non-fatal.
          }
        }
      } catch (err: unknown) {
        // Once results have rendered once, never overwrite the page with an error
        // — just log and let the next poll try again.
        if (resultsEverLoaded) {
          console.error("Polling final results failed:", err);
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load final results");
          setLoading(false);
        }
        if (intervalId) clearInterval(intervalId);
      }
    };

    loadData();
    intervalId = setInterval(loadData, 1200);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
    // cachedInitial / cacheKey are stable per sessionCode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode]);

  if (loading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center p-4">
        <p className="text-destructive font-medium text-lg mb-4">{error}</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-blue-500/10 p-5 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
          <Trophy className="size-10 text-blue-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight">Round 2 Complete!</h2>
          <p className="text-muted-foreground text-center animate-pulse">
            Waiting for the other teams to finish their final shots...
          </p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const isMultiTeam = targetTeam > 1;
  const is4Team = targetTeam >= 3;
  const topOpponentPoints = results.opponents.length > 0
    ? Math.max(...results.opponents.map((o) => o.points))
    : 0;

  // Map backend team entries into leaderboard entries with friendly labels
  const leaderboardEntries = results.allTeams.map((entry) => {
    const sessionTeamIndex = teams.findIndex((t) => t.team_id === entry.team_id);
    const sessionTeam = sessionTeamIndex >= 0 ? teams[sessionTeamIndex] : undefined;
    return {
      team_id: entry.team_id,
      points: entry.points,
      label: sessionTeam ? teamLabel(sessionTeam, sessionTeamIndex) : "Team",
      isMe: entry.team_id === myTeamId,
    };
  });

  return (
    <div className="min-h-dvh bg-background px-4 py-6 flex flex-col items-center gap-5">
      <div className="text-center flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-black text-primary uppercase tracking-wider">Final Results</h1>
        <p className="text-sm text-muted-foreground">Rounds 1 & 2 combined</p>
      </div>

      {/* Scoreboard: 1v1 style for ≤2 teams, leaderboard for 4-team */}
      {is4Team ? (
        <LeaderboardList entries={leaderboardEntries} />
      ) : (
        <ResultsScoreCard
          myPoints={results.myPoints}
          oppPoints={topOpponentPoints}
          winner={results.winner}
          hasOpponent={isMultiTeam && results.opponents.length > 0}
        />
      )}

      {/* My team's court heatmap — aggregated across both rounds */}
      <div className="relative min-h-60 flex items-center justify-center scale-75 origin-center -my-10">
        <HalfCourt shots={[]} disabled={true} zoneStats={results.zoneStats} />
      </div>

      <div className="flex flex-col items-center shrink-0 z-10 -mt-4">
        <span className="text-4xl font-black text-primary leading-none">{results.myPoints}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          Your Total Points
        </span>
      </div>

      <div className="z-10">
        <PlayerStatsList players={myPlayerStats} />
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/session/${sessionCode}/stats`)}
        >
          <BarChart3 className="size-4" />
          View Stats
        </Button>
        <Button
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <Home className="size-4" />
          Home
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default FinalResultsPage;
