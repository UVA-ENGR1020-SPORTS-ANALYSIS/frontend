import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Trophy, ArrowRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamStatsAPI } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";

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

  useEffect(() => {
    let intervalId: any;

    const loadData = async () => {
      try {
        const teamId = localStorage.getItem("currentTeamId");
        if (!teamId || !sessionCode) throw new Error("Missing info");

        const details = await getSessionDetails(sessionCode);
        
        // Find teams
        const myTeam = details.teams.find((t: any) => t.team_id === teamId);
        const oppTeam = details.teams.find((t: any) => t.team_id !== teamId);

        if (!myTeam) throw new Error("Team not found");

        if (details.session.target_team === 1) {
          // Single player mode => Just show round 2 stats
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
          return;
        }

        // Multi player mode => wait for opponent's round 2 to finish
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
          if (intervalId) clearInterval(intervalId);
        } else {
          setWaitingForOpponent(true);
          setLoading(false);
        }

      } catch (err: any) {
        if (intervalId) clearInterval(intervalId);
        setError(err.message || "Failed to load final results");
        setLoading(false);
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
    </div>
  );
}

export default FinalResultsPage;
