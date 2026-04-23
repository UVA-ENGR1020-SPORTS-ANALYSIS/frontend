import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User, Target, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";
import { fetchTeamStatsAPI } from "@/api/game";
import type { RawShot } from "@/api/game";
import { HalfCourt, type ZoneStat } from "@/components/HalfCourt";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function pctColor(pct: number | null): string {
  if (pct === null) return "hsl(var(--muted))";
  if (pct >= 60) return "hsl(142 71% 45%)";
  if (pct >= 40) return "hsl(48 96% 53%)";
  if (pct >= 20) return "hsl(25 95% 53%)";
  return "hsl(0 84% 60%)";
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {label}
    </button>
  );
}

export function StatsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [zoneStats, setZoneStats] = useState<Record<number, ZoneStat>>({});
  const [activeTab, setActiveTab] = useState<"players" | "zones" | "charts">("players");

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
            stats.raw_shots.forEach((s: RawShot) => {
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
          // zone data is optional
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
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center gap-4 p-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const hasZones = Object.values(zoneStats).some((z) => z.attempts > 0);
  const teamMakes = players.reduce((s, p) => s + p.total_makes, 0);
  const teamAttempts = players.reduce((s, p) => s + p.total_attempts, 0);
  const teamMisses = teamAttempts - teamMakes;
  const teamPoints = players.reduce((s, p) => s + (p.total_points ?? 0), 0);

  return (
    <div className="min-h-dvh bg-background p-4 pb-8">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight">Team Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Round 1 performance breakdown</p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 mb-5">
          <TabButton label="Players" active={activeTab === "players"} onClick={() => setActiveTab("players")} />
          <TabButton label="Zones" active={activeTab === "zones"} onClick={() => setActiveTab("zones")} />
          <TabButton label="Charts" active={activeTab === "charts"} onClick={() => setActiveTab("charts")} />
        </div>

        {/* ── PLAYERS TAB ── */}
        {activeTab === "players" && (
          <div className="space-y-4">
            {players.map((player) => {
              const misses = player.total_attempts - player.total_makes;
              const pct =
                player.shooting_pct ??
                (player.total_attempts > 0
                  ? Math.round((player.total_makes / player.total_attempts) * 100)
                  : null);

              return (
                <div key={player.player_id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="size-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">{player.player_name}</h2>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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
                </div>
              );
            })}
          </div>
        )}

        {/* ── ZONES TAB ── */}
        {activeTab === "zones" && (
          <div className="space-y-4">
            {hasZones ? (
              <>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-3">
                    Each zone is color-coded by shooting percentage.{" "}
                    <span className="font-semibold text-green-500">Green</span> = high,{" "}
                    <span className="font-semibold text-red-500">red</span> = low.
                  </p>
                  <HalfCourt shots={[]} zoneStats={zoneStats} disabled />
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground mt-3">
                    <div className="flex items-center gap-1">
                      <div className="size-2.5 rounded-full bg-red-500" />
                      0–19%
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-2.5 rounded-full bg-orange-500" />
                      20–39%
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-2.5 rounded-full bg-yellow-400" />
                      40–59%
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-2.5 rounded-full bg-green-500" />
                      60%+
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <TrendingUp className="size-3.5" />
                    Zone Breakdown
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((z) => {
                      const zs = zoneStats[z];
                      if (!zs || zs.attempts === 0) return (
                        <div key={z} className="rounded-lg bg-muted/30 p-2.5 text-center">
                          <div className="text-xs font-bold text-muted-foreground">Zone {z}</div>
                          <div className="text-xs text-muted-foreground">0 shots</div>
                        </div>
                      );
                      return (
                        <div key={z} className="rounded-lg bg-muted/30 p-2.5 text-center">
                          <div className="text-xs font-bold text-muted-foreground mb-1">Zone {z}</div>
                          <div
                            className="text-lg font-black"
                            style={{ color: pctColor(zs.percentage) }}
                          >
                            {zs.percentage !== null ? `${zs.percentage}%` : "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{zs.makes}/{zs.attempts}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">
                No zone data yet.
              </div>
            )}
          </div>
        )}

        {/* ── CHARTS TAB ── */}
        {activeTab === "charts" && (
          <div className="space-y-5">
            {/* Make vs Miss Doughnut */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                <BarChart3 className="size-3.5" />
                Shot Results
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                How many shots went in vs. how many missed for the whole team.
              </p>
              <div className="max-w-55 mx-auto">
                <Doughnut
                  data={{
                    labels: ["Makes", "Misses"],
                    datasets: [
                      {
                        data: [teamMakes, teamMisses],
                        backgroundColor: ["#22c55e", "#ef4444"],
                        borderColor: ["#16a34a", "#dc2626"],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    cutout: "60%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#888", font: { size: 12, weight: "bold" } },
                      },
                    },
                  }}
                />
              </div>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">{teamMakes}</strong> / {teamAttempts} shots made (
                {teamAttempts > 0 ? Math.round((teamMakes / teamAttempts) * 100) : 0}%)
              </div>
            </div>

            {/* Zone Accuracy Bar Chart */}
            {hasZones && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  <BarChart3 className="size-3.5" />
                  Accuracy by Zone
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Shooting percentage for each zone. Taller bar = higher accuracy in that zone.
                </p>
                <Bar
                  data={{
                    labels: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"],
                    datasets: [
                      {
                        label: "Accuracy %",
                        data: [1, 2, 3, 4, 5, 6].map((z) => zoneStats[z]?.percentage ?? 0),
                        backgroundColor: [1, 2, 3, 4, 5, 6].map((z) => {
                          const pct = zoneStats[z]?.percentage ?? 0;
                          if (pct >= 60) return "#22c55ecc";
                          if (pct >= 40) return "#eab308cc";
                          if (pct >= 20) return "#f97316cc";
                          return "#ef4444cc";
                        }),
                        borderRadius: 6,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: "#888", callback: (v) => `${v}%` },
                        grid: { color: "rgba(128,128,128,0.1)" },
                      },
                      x: {
                        ticks: { color: "#888", font: { weight: "bold" } },
                        grid: { display: false },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const z = ctx.dataIndex + 1;
                            const zs = zoneStats[z];
                            return zs && zs.percentage !== null
                              ? `${zs.percentage}% (${zs.makes}/${zs.attempts})`
                              : "—";
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Player Makes vs Misses Bar */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                <BarChart3 className="size-3.5" />
                Makes vs Misses per Player
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Each player's makes (green) and misses (red) stacked together.
              </p>
              <Bar
                data={{
                  labels: players.map((p) => p.player_name),
                  datasets: [
                    {
                      label: "Makes",
                      data: players.map((p) => p.total_makes),
                      backgroundColor: "#22c55ecc",
                      borderRadius: 4,
                    },
                    {
                      label: "Misses",
                      data: players.map((p) => p.total_attempts - p.total_makes),
                      backgroundColor: "#ef4444cc",
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      stacked: true,
                      ticks: { color: "#888", stepSize: 1 },
                      grid: { color: "rgba(128,128,128,0.1)" },
                    },
                    x: {
                      stacked: true,
                      ticks: { color: "#888", font: { weight: "bold" } },
                      grid: { display: false },
                    },
                  },
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#888", font: { size: 11, weight: "bold" } },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Team Summary — always visible */}
        {players.length > 0 && (
          <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <TrendingUp className="size-3.5" />
              Team Summary
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-green-500">{teamMakes}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Makes</div>
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">{teamAttempts}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Attempts</div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary">{teamPoints}</div>
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
