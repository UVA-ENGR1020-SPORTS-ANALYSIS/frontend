import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldBan, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import { fetchOpponentStatsAPI, banOpponentZoneAPI } from "@/api/game";
import { getSessionDetails } from "@/api/sessions";

export function BanZonePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [error, setError] = useState("");
  
  const [opponentTeamId, setOpponentTeamId] = useState("");
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>({});
  const [pendingBanZone, setPendingBanZone] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
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

  // Poll for opponent's ban
  useEffect(() => {
    if (!waitingForOpponent || !sessionCode) return;
    
    const interval = setInterval(async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
        const details = await getSessionDetails(sessionCode);
        const myTeam = details.teams.find((t: any) => t.team_id === teamId);
        if (myTeam && myTeam.banned_zone !== null) {
          clearInterval(interval);
          navigate(`/session/${sessionCode}/game`);
        }
      } catch (err) {
        console.error("Failed checking if opponent banned us:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waitingForOpponent, sessionCode, navigate]);

  const handleZoneClick = (zone: number) => {
    if (!opponentTeamId || banning) return;
    setPendingBanZone(zone);
  };

  const handleConfirmBan = async () => {
    if (pendingBanZone === null) return;
    const zone = pendingBanZone;
    setPendingBanZone(null);
    setBanning(true);
    try {
      await banOpponentZoneAPI({ opponent_team_id: opponentTeamId, zone });
      setBanning(false);
      setWaitingForOpponent(true);
    } catch (err: any) {
      setError("Failed to ban zone: " + err.message);
      setBanning(false);
    }
  };

  if (loading || banning || waitingForOpponent) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        {banning && <p className="text-muted-foreground font-medium animate-pulse">Confirming Ban...</p>}
        {waitingForOpponent && <p className="text-red-500 font-bold animate-pulse">Waiting for opponent to ban...</p>}
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
    <div className="flex h-[100dvh] overflow-hidden flex-col items-center justify-center px-4 py-2 gap-2">
      <div className="text-center flex flex-col gap-1 relative z-10 shrink-0 mt-4">
        <div className="flex justify-center mb-1">
          <div className="rounded-full bg-red-500/10 p-3 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldBan className="size-6 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-red-500 tracking-tight">Ban Phase</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Tap an area below to <strong className="text-red-400">BAN</strong> the opponent from shooting there next round!
        </p>
      </div>

      <div className="relative shrink-1 min-h-[300px] flex items-center justify-center scale-75 origin-center -my-10">
        <div className="border-[3px] border-red-500/40 rounded-xl p-2 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all duration-1000 ease-in-out">
          <HalfCourt
            shots={[]}
            disabled={true}
            zoneStats={zoneStats}
            interactiveBanMode={true}
            onZoneClick={handleZoneClick}
          />
        </div>
      </div>

      {/* Inline confirmation — replaces window.confirm */}
      {pendingBanZone !== null && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="w-full max-w-sm rounded-2xl border-2 border-red-500/40 bg-card shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-base">
                Ban <span className="text-red-500">Zone {pendingBanZone}</span> for the opponent?
              </p>
              <button
                onClick={() => setPendingBanZone(null)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                aria-label="Cancel"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              This cannot be undone. The opponent will not be able to shoot from Zone {pendingBanZone} in Round 2.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPendingBanZone(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmBan}>
                Confirm Ban
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BanZonePage;
