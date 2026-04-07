import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getSessionDetails, type GetSessionDetailsResponse } from "@/api/sessions";
import { 
  submitShotAPI, 
  finishRoundAPI, 
  fetchOpponentStatsAPI, 
  banOpponentZoneAPI 
} from "@/api/game";
import { HalfCourt } from "@/components/HalfCourt";
import { cn } from "@/lib/utils";

// MakeMiss Dialog overlay component
function MakeMissOverlay({ 
  visible, zone, onDecision, onCancel 
}: { 
  visible: boolean; zone: number | null; 
  onDecision: (made: boolean) => void; onCancel: () => void 
}) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border-2 shadow-xl rounded-2xl p-6 flex flex-col gap-6 max-w-sm w-full animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-center">Zone {zone} Shot Result</h3>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => onDecision(true)} className="flex-1 bg-green-600 hover:bg-green-700 h-16 text-lg">MAKE</Button>
          <Button size="lg" onClick={() => onDecision(false)} variant="destructive" className="flex-1 h-16 text-lg">MISS</Button>
        </div>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function GamePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  
  // Data State
  const [data, setData] = useState<GetSessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Game State
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<"SHOOTING" | "WAITING" | "BANNING">("SHOOTING");
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [shotsTaken, setShotsTaken] = useState<Record<string, number>>({});
  
  // UI State
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Opponent State
  const [opponentParams, setOpponentParams] = useState<any>(null);
  
  const currentTeamId = localStorage.getItem("currentTeamId");
  
  useEffect(() => {
    if (sessionCode) {
      getSessionDetails(sessionCode).then(res => {
        setData(res);
        const myTeam = res.teams.find(t => t.team_id === currentTeamId);
        if (myTeam && myTeam.player?.length > 0) {
           setActivePlayerId(myTeam.player[0].player_id || myTeam.player[0].id);
           const initialShots: Record<string, number> = {};
           myTeam.player.forEach((p: any) => initialShots[p.player_id || p.id] = 0);
           setShotsTaken(initialShots);
        }
        setLoading(false);
      });
    }
  }, [sessionCode, currentTeamId]);

  // Poll for opponent stats when waiting
  useEffect(() => {
    if (phase !== "WAITING" || !data) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetchOpponentStatsAPI(data.session.session_id, currentTeamId!);
        if (res.status === "ready") {
          setOpponentParams(res);
          setPhase("BANNING");
        }
      } catch (err) {
        console.error("Poll error", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, data]);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const session = data.session;
  const myTeam = data.teams.find(t => t.team_id === currentTeamId);
  const players = myTeam?.player || [];
  
  // Is this specific player allowed to shoot?
  const canActivePlayerShoot = activePlayerId && shotsTaken[activePlayerId] < 5;
  
  // Check if round is completely done (all players took 5 shots)
  const isRoundComplete = Object.values(shotsTaken).length > 0 && Object.values(shotsTaken).every(v => v >= 5);

  const handleZoneClick = (zoneId: number) => {
    if (isRoundComplete || !canActivePlayerShoot) return;
    setSelectedZone(zoneId);
  };

  const handleShotDecision = async (made: boolean) => {
    if (!activePlayerId || !selectedZone || !currentTeamId) return;
    setIsSubmitting(true);
    try {
      await submitShotAPI({
        player_id: activePlayerId,
        team_id: currentTeamId,
        session_id: session.session_id,
        round_number: currentRound,
        zone: selectedZone,
        shot_made: made
      });
      // Increment tally
      setShotsTaken(prev => ({ ...prev, [activePlayerId]: prev[activePlayerId] + 1 }));
    } catch (e) {
      alert("Failed to submit shot");
    } finally {
      setSelectedZone(null);
      setIsSubmitting(false);
    }
  };

  const completeRound = async () => {
    setIsSubmitting(true);
    await finishRoundAPI({ team_id: currentTeamId!, round_number: currentRound });
    setIsSubmitting(false);
    
    if (session.target_team === 1) {
      navigate(`/session/${sessionCode}/results`);
      return;
    }
    
    if (currentRound === 1) {
      setPhase("WAITING");
    } else {
      navigate(`/session/${sessionCode}/results`);
    }
  };

  const handleBanZone = async (zone: number) => {
    setIsSubmitting(true);
    try {
      await banOpponentZoneAPI({
        opponent_team_id: opponentParams.opponent_team_id,
        zone
      });
      // Setup Round 2
      const freshShots: Record<string, number> = {};
      players.forEach((p: any) => freshShots[p.player_id || p.id] = 0);
      setShotsTaken(freshShots);
      setCurrentRound(2);
      setPhase("SHOOTING");
    } catch (e) {
      alert("Failed to ban zone");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <MakeMissOverlay 
        visible={selectedZone !== null} 
        zone={selectedZone}
        onDecision={handleShotDecision}
        onCancel={() => setSelectedZone(null)}
      />

      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-card">
        <div>
          <h2 className="font-bold text-lg">Game On</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
            Round {currentRound} • Code: {sessionCode}
          </p>
        </div>
        {isRoundComplete && phase === "SHOOTING" && (
           <Button onClick={completeRound} disabled={isSubmitting}>
             COMPLETE ROUND
           </Button>
        )}
      </div>

      {phase === "SHOOTING" && (
        <div className="flex-1 flex flex-col md:flex-row shadow-inner">
          {/* Main Court Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6 relative bg-muted/10">
             <HalfCourt 
               onZoneClick={handleZoneClick} 
               bannedZone={currentRound === 2 ? myTeam?.banned_zone : null} 
             />
             <div className="text-center space-y-1">
               <h3 className="text-lg font-bold">
                 {canActivePlayerShoot ? "Select a Zone" : "Player Finished"}
               </h3>
               <p className="text-sm text-muted-foreground">
                 Click on the map to record {players.find((p:any) => p.player_id === activePlayerId || p.id === activePlayerId)?.player_name}'s shot
               </p>
             </div>
          </div>
          
          {/* Player Sidebar */}
          <div className="w-full md:w-80 border-l bg-card p-4 space-y-2 flex flex-col overflow-y-auto max-h-[40vh] md:max-h-none">
            <h3 className="font-bold text-sm tracking-wider uppercase text-muted-foreground mb-2">Team Roster</h3>
            {players.map((p: any) => {
              const pid = p.player_id || p.id;
              const name = p.player_name || p.name;
              const shots = shotsTaken[pid] || 0;
              const isDone = shots >= 5;
              const isActive = activePlayerId === pid;
              return (
                <button
                  key={pid}
                  className={cn(
                    "flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left",
                    isActive ? "border-primary bg-primary/10 shadow-sm" : "border-transparent hover:bg-muted hover:border-muted",
                    isDone ? "opacity-50" : ""
                  )}
                  onClick={() => setActivePlayerId(pid)}
                >
                  <span className="font-semibold">{name}</span>
                  <span className={cn(
                    "font-mono font-bold text-sm",
                    isDone ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {shots}/5
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "WAITING" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <h2 className="text-2xl font-bold">Waiting for Opponent</h2>
          <p className="text-muted-foreground text-center">
            Your opponent is still taking their Round 1 shots.<br/>You will be able to ban their zone once they finish.
          </p>
        </div>
      )}

      {phase === "BANNING" && opponentParams && (
        <div className="flex-1 flex flex-col items-center p-8 gap-8 overflow-y-auto">
          <div className="text-center">
             <h2 className="text-3xl font-black uppercase text-destructive tracking-tight">Ban Phase</h2>
             <p className="text-muted-foreground">Review opponent's Round 1 performance and ban a zone.</p>
          </div>
          
          <div className="bg-card border-2 p-6 rounded-2xl w-full max-w-md shadow-sm text-center space-y-2">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Opponent Points</span>
            <div className="text-6xl font-black text-foreground">{opponentParams.points}</div>
          </div>
          
          <div className="w-full max-w-md space-y-4">
             <h3 className="font-bold text-lg text-center">Select Zone to Ban for Round 2:</h3>
             <div className="grid grid-cols-2 gap-3">
               {[1,2,3,4,5,6].map(z => (
                 <Button key={z} variant="outline" className="h-16 text-lg hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleBanZone(z)} disabled={isSubmitting}>
                   Ban Zone {z}
                 </Button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
