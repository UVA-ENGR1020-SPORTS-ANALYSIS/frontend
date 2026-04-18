import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";
import { fetchTeamStatsAPI } from "@/api/game";

type ZoneStat = { makes: number; attempts: number; percentage: number | null };

function pctColor(pct: number | null): string {
  if (pct === null) return "#9e9e9e";
  if (pct >= 80) return "#1a5c1a";
  if (pct >= 60) return "#4ca84c";
  if (pct >= 40) return "#e8c020";
  if (pct >= 20) return "#c87818";
  return "#b82020";
}

export function StatsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
        if (!teamId) throw new Error("No team found");

        const { players: fetched } = await fetchTeamPlayers(teamId);
        setPlayers(fetched);

        try {
          const stats = await fetchTeamStatsAPI(teamId, 1);
          if (stats?.raw_shots) {
            const computed: Record<number, ZoneStat> = {};
            for (let i = 1; i <= 6; i++) {
              computed[i] = { makes: 0, attempts: 0, percentage: null };
            }
            stats.raw_shots.forEach((s: any) => {
              const z = s.zone;
              if (computed[z]) {
                computed[z].attempts += 1;
                if (s.shot_made) computed[z].makes += 1;
              }
            });
            for (let i = 1; i <= 6; i++) {
              if (computed[i].attempts > 0) {
                computed[i].percentage = Math.round(
                  (computed[i].makes / computed[i].attempts) * 100
                );
              }
            }
            setZoneStats(computed);
          }
        } catch {
          // Zone data optional
        }
      } catch (err: any) {
        setError(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center gap-4 p-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const hasZones = Object.keys(zoneStats).length > 0;

  return (
    <div style={{ background: "#f0d898", minHeight: "100dvh", padding: "14px 16px 24px", fontFamily: "Arial, sans-serif", userSelect: "none" }}>
      <Button variant="ghost" size="sm" className="mb-3 gap-1" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ padding: "7px 20px", border: "2px solid #666", borderBottom: "none", borderRadius: "7px 7px 0 0", background: "#dcc878", fontSize: 14, fontWeight: 600, color: "#111" }}>
          Player stats
        </div>
        <div style={{ padding: "7px 20px", border: "2px solid #888", borderBottom: "none", borderRadius: "7px 7px 0 0", background: "#c8c8c8", fontSize: 14, fontWeight: 600, color: "#222" }}>
          Location stats
        </div>
      </div>

      <div style={{ border: "4px solid #8b1010", borderRadius: "0 10px 10px 10px", background: "#f0d898", padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {players.map((player) => {
            const misses = player.total_attempts - player.total_makes;
            const pct = player.shooting_pct ?? (player.total_attempts > 0 ? Math.round((player.total_makes / player.total_attempts) * 100) : null);

            return (
              <div key={player.player_id} style={{ border: "3px solid #8b1010", borderRadius: 10, background: "#f5dfa8", padding: "14px 14px 12px" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 10 }}>
                  {player.player_name}:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1.5px solid #c0b090", borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 5 }}>Overall</div>
                      <div style={{ fontSize: 12, color: "#333", marginBottom: 3 }}>
                        Shots made: <span style={{ fontWeight: 700 }}>{player.total_makes}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#333" }}>
                        Shots missed: <span style={{ fontWeight: 700 }}>{misses}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, width: 68, height: 52, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 900, color: "#fff", background: pctColor(pct) }}>
                      {pct !== null ? `${pct}%` : "—"}
                    </div>
                  </div>

                  {hasZones && [1, 2, 3, 4, 5, 6].map((z) => {
                    const zs = zoneStats[z];
                    if (!zs) return null;
                    return (
                      <div key={z} style={{ background: "#fff", border: "1.5px solid #c0b090", borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#222", marginBottom: 4 }}>Zone {z}</div>
                          <div style={{ fontSize: 11, color: "#333", marginBottom: 2 }}>Made: {zs.makes}</div>
                          <div style={{ fontSize: 11, color: "#333" }}>Missed: {zs.attempts - zs.makes}</div>
                        </div>
                        <div style={{ flexShrink: 0, width: 52, height: 44, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", background: pctColor(zs.percentage) }}>
                          {zs.percentage !== null ? `${zs.percentage}%` : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;