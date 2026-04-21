import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, LogOut, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LobbyTeamList } from "@/components/LobbyTeamList";
import { getSessionDetails, toggleTeamReady, type GetSessionDetailsResponse } from "@/api/sessions";

export function LobbyPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<GetSessionDetailsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [isReadying, setIsReadying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionCode) return;
    try {
      const details = await getSessionDetails(sessionCode);
      setData(details);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lobby.");
    } finally {
      setLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    fetchSession();
    // Poll every 3 seconds to check for new teams and ready status
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const session = data?.session;
  const teams = data?.teams || [];
  const numTeams = teams.length;
  const targetTeams = session?.target_team || 0;
  const currentTeamId = sessionStorage.getItem("currentTeamId");
  const isFilled = targetTeams > 0 && numTeams >= targetTeams;
  
  // Make sure ALL target teams have joined and ARE ready
  const allReady = isFilled && teams.length === targetTeams && teams.every(t => t.is_ready === true);
  
  const currentTeam = teams.find(t => t.team_id === currentTeamId);
  const isCurrentTeamReady = currentTeam?.is_ready || false;

  useEffect(() => {
    if (allReady) {
      setCountdown((prev) => (prev === null ? 3 : prev));
    } else {
      setCountdown(null);
    }
  }, [allReady]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate(`/session/${sessionCode}/game`);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, sessionCode]);

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-destructive font-medium text-lg">{error || "Lobby not found"}</p>
        <Button onClick={() => navigate("/")} variant="outline">Return Home</Button>
      </div>
    );
  }

  const handleReadyToggle = async () => {
    if (!currentTeamId) return;
    setIsReadying(true);
    try {
      await toggleTeamReady(currentTeamId, !isCurrentTeamReady);
      await fetchSession(); // Immediately update UI
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle ready";
      setError(message);
    } finally {
      setIsReadying(false);
    }
  };

  const formattedTeams = teams.map((t, idx) => ({
    teamNumber: idx + 1,
    teamId: t.team_id,
    isReady: t.is_ready,
    players: (t.player || []).map((p: any) => p.player_name || p.name)
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
          
          {/* Extracted team list component */}
          <LobbyTeamList
            teams={formattedTeams}
            currentTeamId={currentTeamId}
            targetTeams={targetTeams}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {!isFilled ? (
            <p className="text-center text-sm font-medium text-muted-foreground animate-pulse">
              Waiting for {targetTeams - numTeams} more {targetTeams - numTeams === 1 ? 'team' : 'teams'}...
            </p>
          ) : countdown !== null ? (
            <div className="text-center animate-bounce">
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Starting in</p>
              <p className="text-5xl font-black text-primary">{countdown}</p>
            </div>
          ) : (
            <p className="text-center text-sm font-medium text-green-600 animate-pulse">
              Waiting for all teams to ready up...
            </p>
          )}

          {isFilled && countdown === null && currentTeamId && (
            <Button
              size="lg"
              variant={isCurrentTeamReady ? "secondary" : "default"}
              className={cn(
                "w-full gap-2 text-lg h-14 transition-all shadow-md",
                isCurrentTeamReady ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100" : ""
              )}
              onClick={handleReadyToggle}
              disabled={isReadying}
            >
              <Play className={cn("size-5", isCurrentTeamReady ? "fill-green-600 text-green-600" : "fill-current")} />
              {isReadying ? "Updating..." : isCurrentTeamReady ? "CANCEL READY" : "READY UP"}
            </Button>
          )}
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
