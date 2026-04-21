import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Trophy, ArrowRight, Minus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamStatsAPI } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";

export function FinalResultsPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [results, setResults] = useState<{
    myTeam: any;
    opponentTeam: any;
    myPoints: number;
    oppPoints: number;
    winner: 'me' | 'opponent' | 'tie' | null;
  } | null>(null);

  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [myPlayerStats, setMyPlayerStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let intervalId: ReturnType<typeof setInterval>;
    let initialLoadDone = false;

    const loadData = async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
        if (!teamId || !sessionCode) throw new Error("Missing info");

        const details = await getSessionDetails(sessionCode);

        const myTeam = details.teams.find((t: any) => t.team_id === teamId);
        const oppTeam = details.teams.find((t: any) => t.team_id !== teamId);

        if (!myTeam) throw new Error("Team not found");

        if (details.session.target_team === 1) {
          const myStats = await fetchTeamStatsAPI(teamId, 2);
          setResults({
            myTeam,
            opponentTeam: null,
            myPoints: myStats.points,
            oppPoints: 0,
            winner: 'me'
          });
          setWaitingForOpponent(false);
          setLoading(false);
          clearInterval(intervalId);

          // Fetch per-player stats for my team
          const { players } = await fetchTeamPlayers(teamId);
          setMyPlayerStats(players);
          return;
        }

        if (oppTeam && oppTeam.round_2_finished) {
          const myStats = await fetchTeamStatsAPI(teamId, 2);
          const oppStats = await fetchTeamStatsAPI(oppTeam.team_id, 2);

          let winner: 'me' | 'opponent' | 'tie' = 'tie';
          if (myStats.points > oppStats.points) winner = 'me';
          else if (oppStats.points > myStats.points) winner = 'opponent';

          setResults({
            myTeam,
            opponentTeam: oppTeam,
            myPoints: myStats.points,
            oppPoints: oppStats.points,
            winner
          });
          setWaitingForOpponent(false);
          setLoading(false);
          clearInterval(intervalId);

          // Fetch per-player stats for my team
          const { players } = await fetchTeamPlayers(teamId);
          setMyPlayerStats(players);
        } else {
          setWaitingForOpponent(true);
          setLoading(false);
        }
      } catch (err: any) {
        if (!initialLoadDone) {
          // Only surface errors to the UI on the first load attempt;
          // transient poll failures are silently logged so polling continues.
          setError(err.message || "Failed to load final results");
          setLoading(false);
          clearInterval(intervalId);
        } else {
          console.error("Polling final results failed:", err);
        }
      } finally {
        initialLoadDone = true;
      }
    };

    loadData();
    intervalId = setInterval(loadData, 3000);

    return () => clearInterval(intervalId);
  }, [sessionCode]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center p-4">
        <p className="text-destructive font-medium text-lg mb-4">{error}</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (waitingForOpponent) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-blue-500/10 p-5 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
          <Trophy className="size-10 text-blue-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight">Round 2 Complete!</h2>
          <p className="text-muted-foreground text-center animate-pulse">
            Waiting for the opponent to finish their final shots...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background h-[100dvh] overflow-hidden flex-col items-center justify-center px-4 py-2 gap-6">
      
      <div className="text-center flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-black text-primary uppercase tracking-wider">Final Results</h1>
        <p className="text-sm text-muted-foreground">Round 2 Showdown</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 p-6 rounded-2xl bg-card border-2 shadow-xl ring-1 ring-black/5 items-center">
        {results?.winner === 'me' && (
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
            <Trophy className="size-5" />
            <span>VICTORY!</span>
          </div>
        )}
        {results?.winner === 'opponent' && (
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
            <Minus className="size-5" />
            <span>DEFEAT</span>
          </div>
        )}
        {results?.winner === 'tie' && (
          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full font-black animate-in zoom-in duration-500">
            <Minus className="size-5" />
            <span>DRAW</span>
          </div>
        )}

        <div className="w-full flex justify-between items-center px-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-muted-foreground">YOU</span>
            <span className={`text-6xl font-black ${results?.winner === 'me' ? 'text-green-500' : 'text-foreground'}`}>
              {results?.myPoints}
            </span>
          </div>

          <div className="text-muted-foreground opacity-50 font-black text-2xl">VS</div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-muted-foreground">OPP</span>
            <span className={`text-6xl font-black ${results?.winner === 'opponent' ? 'text-red-500' : 'text-foreground'}`}>
              {results?.oppPoints ?? 0}
            </span>
          </div>
        </div>
      </div>

      <Button size="lg" className="mt-4 gap-2" onClick={() => navigate("/")}>
        Back to Home
        <ArrowRight className="size-4" />
      </Button>

      {/* Per-player breakdown */}
      {myPlayerStats.length > 0 && (
        <div className="w-full max-w-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">Your Players</h2>
          <div className="space-y-1.5">
            {myPlayerStats.map((p) => (
              <div key={p.player_id} className="flex justify-between items-center px-3 py-2 rounded-xl bg-card border transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="font-semibold text-sm">{p.player_name}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground font-medium">
                  <span className="text-primary font-bold">{p.total_points} pts</span>
                  <span>{p.total_makes}/{p.total_attempts}</span>
                  <span>{p.shooting_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalResultsPage;
