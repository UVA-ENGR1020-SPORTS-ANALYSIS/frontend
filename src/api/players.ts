const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8000").replace(/\/$/, "");

export interface PlayerStats {
  player_id: string;
  player_team_id: string;
  player_name: string;
  total_points: number;
  total_makes: number;
  total_attempts: number;
  shooting_pct: number;
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStats> {
  const res = await fetch(`${BASE_URL}/api/players/${playerId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch player stats");
  }
  return res.json();
}

export async function fetchTeamPlayers(teamId: string): Promise<{ team_id: string; players: PlayerStats[] }> {
  const res = await fetch(`${BASE_URL}/api/players/team/${teamId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch team players");
  }
  return res.json();
}
