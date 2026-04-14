const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8000").replace(/\/$/, "");

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface SubmitShotRequest {
  player_id: string;
  team_id: string;
  session_id: string;
  round_number: number;
  zone: number;
  shot_made: boolean;
}

export interface SubmitShotResponse {
  status: string;
  shot_id: string;
  points_awarded: number;
}

export interface FinishRoundRequest {
  team_id: string;
  round_number: number;
}

export interface BanZoneRequest {
  opponent_team_id: string;
  zone: number;
}

export async function submitShotAPI(data: SubmitShotRequest): Promise<SubmitShotResponse> {
  const response = await apiFetch(`${BASE_URL}/api/game/shot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to submit shot");
  }
  return response.json() as any;
}

export async function finishRoundAPI(data: FinishRoundRequest): Promise<{ status: string; message: string }> {
  const response = await apiFetch(`${BASE_URL}/api/game/finish_round`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to finish round");
  }
  return response.json() as any;
}

export async function fetchOpponentStatsAPI(sessionId: string, myTeamId: string) {
  const response = await apiFetch(`${BASE_URL}/api/game/opponent_stats/${sessionId}/${myTeamId}`);
  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch opponent stats");
  }
  return response.json() as any;
}

export async function fetchTeamStatsAPI(teamId: string, roundNumber: number) {
  const response = await apiFetch(`${BASE_URL}/api/game/team_stats/${teamId}/${roundNumber}`);
  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch team stats");
  }
  return response.json() as any;
}

export async function banOpponentZoneAPI(data: BanZoneRequest) {
  const response = await apiFetch(`${BASE_URL}/api/game/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to ban zone");
  }
  return response.json() as any;
}
