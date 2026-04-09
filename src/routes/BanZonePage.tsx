import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import { fetchOpponentStatsAPI, banOpponentZoneAPI } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";

export function BanZonePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(false);
  const [error, setError] = useState("");
  
  const [opponentTeamId, setOpponentTeamId] = useState("");
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>({});

  useEffect(() => {
    (async () => {
      try {
        const teamId = localStorage.getItem("currentTeamId");
        if (!teamId || !sessionCode) throw new Error("Missing info");

        const details = await getSessionDetails(sessionCode);
        const { status, opponent_team_id, raw_shots } = await fetchOpponentStatsAPI(details.session.session_id, teamId);
        
        if (status !== "ready") {
          throw new Error("Opponent is not ready yet! Please wait.");
        }

        setOpponentTeamId(opponent_team_id);

        const zStats: Record<number, ZoneStat> = {};
        for (let i = 1; i <= 6; i++) {
          zStats[i] = { makes: 0, attempts: 0, percentage: 0 };
        }

        raw_shots.forEach((s: any) => {
          const z = s.zone;
          if (zStats[z]) {
            zStats[z].attempts += 1;
            if (s.shot_made) zStats[z].makes += 1;
          }
        });

        for (let i = 1; i <= 6; i++) {
          if (zStats[i].attempts > 0) {
            zStats[i].percentage = (zStats[i].makes / zStats[i].attempts) * 100;
          }
        }
        setZoneStats(zStats);
      } catch (err: any) {
        setError(err.message || "Failed to load opponent stats");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionCode]);

  const handleZoneClick = async (zone: number) => {
    if (!opponentTeamId || banning) return;
    
    const conf = window.confirm(`Are you sure you want to ban zone ${zone}?`);
    if (!conf) return;

    setBanning(true);
    try {
      await banOpponentZoneAPI({ opponent_team_id: opponentTeamId, zone });
      // Go back to game page for round 2
      navigate(`/session/${sessionCode}/game`);
    } catch (err: any) {
      alert("Failed to ban zone: " + err.message);
      setBanning(false);
    }
  };

  if (loading || banning) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        {banning && <p className="text-muted-foreground font-medium animate-pulse">Confirming Ban...</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <p className="text-destructive font-medium text-lg mb-4">{error}</p>
        <Button onClick={() => navigate(`/session/${sessionCode}/results`)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-8">
      <div className="text-center flex flex-col gap-2 relative z-10">
        <div className="flex justify-center mb-2">
          <div className="rounded-full bg-red-500/10 p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldBan className="size-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-red-500 tracking-tight">Ban Phase</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Review the opponent's shooting performance. Tap on an area to <strong className="text-red-400">BAN</strong> them from shooting there next round!
        </p>
      </div>

      <div className="relative border-[3px] border-red-500/40 rounded-xl p-2 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all duration-1000 ease-in-out">
        <HalfCourt 
          shots={[]} 
          disabled={true} 
          zoneStats={zoneStats} 
          interactiveBanMode={true} 
          onZoneClick={handleZoneClick} 
        />
      </div>
    </div>
  );
}

export default BanZonePage;
