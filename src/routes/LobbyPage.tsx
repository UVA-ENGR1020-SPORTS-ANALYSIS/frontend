import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TeamCard } from "@/components/TeamCard";
import { Users, LogOut, Play, Loader2 } from "lucide-react";
import { getSessionDetails, type GetSessionDetailsResponse } from "@/api/sessions";

export function LobbyPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<GetSessionDetailsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionCode) return;

    const fetchSession = async () => {
      try {
        const details = await getSessionDetails(sessionCode);
        setData(details);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to load lobby.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
    // Poll every 3 seconds to check for new teams
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [sessionCode]);

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-destructive font-medium text-lg">{error || "Lobby not found"}</p>
        <Button onClick={() => navigate("/")} variant="outline">Return Home</Button>
      </div>
    );
  }

  const { session, teams } = data;
  const numTeams = teams.length;
  const targetTeams = session.target_team;
  const isFilled = numTeams >= targetTeams;

  const gridClasses = 
    targetTeams === 1 ? "grid-cols-1" :
    targetTeams === 2 ? "grid-cols-2" :
    "grid-cols-2"; 

  // Format team API response to match TeamCard prop specs
  const formattedTeams = teams.map((t, idx) => ({
    teamNumber: idx + 1,
    players: (t.player || []).map((p: any) => p.name)
  }));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-muted-foreground">Waiting Lobby</h1>
          <div className="w-full rounded-2xl border-2 border-dashed bg-card p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Room Code</span>
            <span className="text-5xl md:text-6xl font-black tracking-[0.2em] text-foreground">
              {sessionCode}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              Teams Joined
            </h2>
            <span className={`text-sm border rounded-full px-2.5 py-0.5 font-medium ${isFilled ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}>
              {numTeams} / {targetTeams}
            </span>
          </div>
          
          {numTeams === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Waiting for teams to join...
            </div>
          ) : (
            <div className={`grid gap-3 ${gridClasses}`}>
              {formattedTeams.map((team) => (
                <TeamCard
                  key={team.teamNumber}
                  teamNumber={team.teamNumber}
                  players={team.players}
                  className="hover:scale-[1.02] transition-transform duration-300"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {!isFilled && (
            <p className="text-center text-sm font-medium text-muted-foreground animate-pulse">
              Waiting for {targetTeams - numTeams} more {targetTeams - numTeams === 1 ? 'team' : 'teams'}...
            </p>
          )}
          <Button
            size="lg"
            className="w-full gap-2 text-lg h-14 transition-all"
            disabled={!isFilled}
            onClick={() => navigate(`/session/${sessionCode}/game`)}
          >
            <Play className="size-5 fill-current" />
            {isFilled ? "Start Game" : "Not Ready"}
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => navigate("/")}
          >
            <LogOut className="size-4" />
            Leave Session
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LobbyPage;
