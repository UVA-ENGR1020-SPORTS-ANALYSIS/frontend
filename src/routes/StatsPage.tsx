import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User, MapPin, Target, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTeamPlayers, type PlayerStats } from "@/api/players";
import { fetchTeamStatsAPI } from "@/api/game";
import type { RawShot } from "@/api/game";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

type ZoneStat = { makes: number; attempts: number; percentage: number | null };

function pctColor(pct: number | null): string {
  if (pct === null) return "hsl(var(--muted))";
  if (pct >= 60) return "hsl(142 71% 45%)";
  if (pct >= 40) return "hsl(48 96% 53%)";
  if (pct >= 20) return "hsl(25 95% 53%)";
  return "hsl(0 84% 60%)";
}

// ── Tab Button ──
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

  // ── Computed chart data ──
  const teamMakes = players.reduce((s, p) => s + p.total_makes, 0);
  const teamAttempts = players.reduce((s, p) => s + p.total_attempts, 0);
  const teamMisses = teamAttempts - teamMakes;
  const teamPoints = players.reduce((s, p) => s + (p.total_points ?? 0), 0);

  return (
    <div className="min-h-[100dvh] bg-background p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight">Team Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Round 1 performance breakdown</p>
        </div>

        {/* Tabs */}
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
              const pct = player.shooting_pct ?? (player.total_attempts > 0 ? Math.round((player.total_makes / player.total_attempts) * 100) : null);

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
        {activeTab === "zones" && hasZones && (
          <div className="space-y-4">
            {/* Heatmap-style zone grid */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                <MapPin className="size-3.5" />
                Zone Accuracy Heatmap
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Each zone shows your team's shooting percentage. <strong className="text-foreground">Green = hot</strong>, <strong className="text-foreground">red = cold</strong>. Use this to identify where you shoot best and worst.
              </p>

              {/* Visual heatmap grid matching court layout */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Row 1: Zone 2, Zone 1, Zone 3 (inside the arc) */}
                {[2, 1, 3].map((z) => {
                  const zs = zoneStats[z];
                  if (!zs) return <div key={z} />;
                  return (
                    <div
                      key={z}
                      className="relative flex flex-col items-center justify-center rounded-xl p-4 text-white font-black transition-transform hover:scale-105"
                      style={{ backgroundColor: pctColor(zs.percentage), minHeight: 80 }}
                    >
                      <span className="text-2xl">{zs.percentage !== null ? `${zs.percentage}%` : "—"}</span>
                      <span className="text-[10px] opacity-80 mt-0.5">Zone {z}</span>
                      <span className="text-[10px] opacity-70">{zs.makes}/{zs.attempts}</span>
                    </div>
                  );
                })}
                {/* Row 2: Zone 4, Zone 5, Zone 6 (outside the arc) */}
                {[4, 5, 6].map((z) => {
                  const zs = zoneStats[z];
                  if (!zs) return <div key={z} />;
                  return (
                    <div
                      key={z}
                      className="relative flex flex-col items-center justify-center rounded-xl p-4 text-white font-black transition-transform hover:scale-105"
                      style={{ backgroundColor: pctColor(zs.percentage), minHeight: 80 }}
                    >
                      <span className="text-2xl">{zs.percentage !== null ? `${zs.percentage}%` : "—"}</span>
                      <span className="text-[10px] opacity-80 mt-0.5">Zone {z}</span>
                      <span className="text-[10px] opacity-70">{zs.makes}/{zs.attempts}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: "hsl(0 84% 60%)" }} />
                  0-19%
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: "hsl(25 95% 53%)" }} />
                  20-39%
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: "hsl(48 96% 53%)" }} />
                  40-59%
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: "hsl(142 71% 45%)" }} />
                  60%+
                </div>
              </div>
            </div>

            {/* Key insight card */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <TrendingUp className="size-3.5" />
                Key Insight
              </div>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const zones = Object.entries(zoneStats)
                    .filter(([, s]) => s.attempts > 0)
                    .map(([z, s]) => ({ zone: parseInt(z), ...s }));
                  if (zones.length === 0) return "No shots recorded yet.";
                  const best = zones.reduce((a, b) => ((a.percentage ?? 0) > (b.percentage ?? 0) ? a : b));
                  const worst = zones.reduce((a, b) => ((a.percentage ?? 0) < (b.percentage ?? 0) ? a : b));
                  return (
                    <>
                      Your strongest zone is <strong className="text-green-500">Zone {best.zone}</strong> at {best.percentage}%.
                      Consider avoiding <strong className="text-red-500">Zone {worst.zone}</strong> ({worst.percentage}%) — 
                      the opponent might ban your best zone in Round 2!
                    </>
                  );
                })()}
              </p>
            </div>
          </div>
        )}

        {/* ── CHARTS TAB ── */}
        {activeTab === "charts" && (
          <div className="space-y-5">
            {/* Make vs Miss Doughnut */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                <BarChart3 className="size-3.5" />
                Shot Outcome Distribution
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                This chart shows the ratio of <span className="text-green-500 font-semibold">makes</span> vs <span className="text-red-500 font-semibold">misses</span> for the whole team. A larger green section = higher accuracy.
              </p>
              <div className="max-w-[220px] mx-auto">
                <Doughnut
                  data={{
                    labels: ["Makes", "Misses"],
                    datasets: [{
                      data: [teamMakes, teamMisses],
                      backgroundColor: ["#22c55e", "#ef4444"],
                      borderColor: ["#16a34a", "#dc2626"],
                      borderWidth: 2,
                    }],
                  }}
                  options={{
                    responsive: true,
                    cutout: "60%",
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#888", font: { size: 12, weight: "bold" } } },
                    },
                  }}
                />
              </div>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">{teamMakes}</strong> / {teamAttempts} shots made
                ({teamAttempts > 0 ? Math.round((teamMakes / teamAttempts) * 100) : 0}%)
              </div>
            </div>

            {/* Zone Accuracy Bar Chart */}
            {hasZones && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  <BarChart3 className="size-3.5" />
                  Zone Accuracy Comparison
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Compare shooting percentages across all 6 zones. Taller bars = more accurate zones. Use this to find patterns in your shooting.
                </p>
                <Bar
                  data={{
                    labels: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"],
                    datasets: [{
                      label: "Accuracy %",
                      data: [1, 2, 3, 4, 5, 6].map(z => zoneStats[z]?.percentage ?? 0),
                      backgroundColor: [1, 2, 3, 4, 5, 6].map(z => {
                        const pct = zoneStats[z]?.percentage ?? 0;
                        if (pct >= 60) return "#22c55ecc";
                        if (pct >= 40) return "#eab308cc";
                        if (pct >= 20) return "#f97316cc";
                        return "#ef4444cc";
                      }),
                      borderRadius: 6,
                      borderSkipped: false,
                    }],
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
                            return zs ? `${zs.percentage}% (${zs.makes}/${zs.attempts})` : "—";
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Player Comparison Radar */}
            {players.length > 1 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  <BarChart3 className="size-3.5" />
                  Player Comparison
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  This radar chart compares each player across key metrics. A larger area = better overall performance.
                </p>
                <Radar
                  data={{
                    labels: ["Accuracy %", "Makes", "Attempts", "Points"],
                    datasets: players.map((p, i) => {
                      const colors = [
                        { bg: "rgba(34,197,94,0.15)", border: "#22c55e" },
                        { bg: "rgba(59,130,246,0.15)", border: "#3b82f6" },
                        { bg: "rgba(168,85,247,0.15)", border: "#a855f7" },
                        { bg: "rgba(249,115,22,0.15)", border: "#f97316" },
                        { bg: "rgba(236,72,153,0.15)", border: "#ec4899" },
                      ];
                      const c = colors[i % colors.length];
                      return {
                        label: p.player_name,
                        data: [
                          p.shooting_pct ?? 0,
                          p.total_makes,
                          p.total_attempts,
                          p.total_points ?? 0,
                        ],
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        borderWidth: 2,
                        pointBackgroundColor: c.border,
                      };
                    }),
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      r: {
                        beginAtZero: true,
                        ticks: { color: "#888", backdropColor: "transparent" },
                        grid: { color: "rgba(128,128,128,0.15)" },
                        pointLabels: { color: "#888", font: { size: 11, weight: "bold" } },
                      },
                    },
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#888", font: { size: 11, weight: "bold" } } },
                    },
                  }}
                />
              </div>
            )}

            {/* Player Makes Bar Chart */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                <BarChart3 className="size-3.5" />
                Shots Made vs Missed per Player
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                This stacked bar shows each player's makes and misses side by side. Helps identify who was the most efficient shooter.
              </p>
              <Bar
                data={{
                  labels: players.map(p => p.player_name),
                  datasets: [
                    {
                      label: "Makes",
                      data: players.map(p => p.total_makes),
                      backgroundColor: "#22c55ecc",
                      borderRadius: 4,
                    },
                    {
                      label: "Misses",
                      data: players.map(p => p.total_attempts - p.total_makes),
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
                    legend: { position: "bottom", labels: { color: "#888", font: { size: 11, weight: "bold" } } },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Team Summary — always visible at bottom */}
        {players.length > 0 && (
          <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <TrendingUp className="size-3.5" />
              Team Summary
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-green-500">{teamMakes}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">Total Makes</div>
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