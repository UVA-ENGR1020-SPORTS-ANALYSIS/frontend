import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User, MapPin, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";
import { fetchTeamStatsAPI } from "@/api/game";

type ZoneStat = { makes: number; attempts: number; percentage: number | null };

function pctColor(pct: number | null): string {
  if (pct === null) return "hsl(var(--muted))";
  if (pct >= 60) return "hsl(142 71% 45%)";
  if (pct >= 40) return "hsl(48 96% 53%)";
  if (pct >= 20) return "hsl(25 95% 53%)";
  return "hsl(0 84% 60%)";
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
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
    <div className="min-h-[100dvh] bg-background p-4 pb-8">
      {/* Header */}
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight">Team Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Round 1 performance breakdown</p>
        </div>

        {/* Player Cards */}
        <div className="space-y-4">
          {players.map((player) => {
            const misses = player.total_attempts - player.total_makes;
            const pct = player.shooting_pct ?? (player.total_attempts > 0 ? Math.round((player.total_makes / player.total_attempts) * 100) : null);

            return (
              <div key={player.player_id} className="rounded-xl border bg-card p-4 shadow-sm">
                {/* Player name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">{player.player_name}</h2>
                </div>

                {/* Overall stat row */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Target className="size-3" />
                      Overall
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>
                        <span className="font-bold text-green-500">{player.total_makes}</span>
                        <span className="text-muted-foreground"> made</span>
                      </span>
                      <span>
                        <span className="font-bold text-red-500">{misses}</span>
                        <span className="text-muted-foreground"> missed</span>
                      </span>
                    </div>
                  </div>
                  <div
                    className="size-14 rounded-lg flex items-center justify-center text-lg font-black text-white shadow-sm"
                    style={{ backgroundColor: pctColor(pct) }}
                  >
                    {pct !== null ? `${pct}%` : "—"}
                  </div>
                </div>

                {/* Zone stats grid */}
                {hasZones && (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((z) => {
                      const zs = zoneStats[z];
                      if (!zs) return null;
                      return (
                        <div key={z} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              <MapPin className="size-2.5" />
                              Zone {z}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {zs.makes}/{zs.attempts}
                            </div>
                          </div>
                          <div
                            className="size-9 rounded-md flex items-center justify-center text-xs font-black text-white shadow-sm"
                            style={{ backgroundColor: pctColor(zs.percentage) }}
                          >
                            {zs.percentage !== null ? `${zs.percentage}%` : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary card */}
        {players.length > 0 && (
          <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <TrendingUp className="size-3.5" />
              Team Summary
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-green-500">
                  {players.reduce((s, p) => s + p.total_makes, 0)}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Total Makes</div>
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">
                  {players.reduce((s, p) => s + p.total_attempts, 0)}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Attempts</div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary">
                  {players.reduce((s, p) => s + (p.total_points ?? 0), 0)}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Points</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPage;