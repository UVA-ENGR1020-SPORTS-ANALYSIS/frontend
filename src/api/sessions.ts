const BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");

export interface CheckSessionResponse {
  status: string;
  session_code: number;
  session_id: string;
  current_teams_count: number;
  message: string;
}

export interface JoinTeamRequest {
  player_names: string[];
  session_id?: string;
  session_code?: number;
  team_count?: number;
}

export interface JoinTeamResponse {
  status: string;
  team_id: string;
  players: any[];
  message: string;
}

export interface CreateSessionRequest {
  creator_name?: string;
  admin_password?: string;
  team_count?: number;
}

export interface CreateSessionResponse {
  session_code: number;
  session_id: string;
}

export async function validateSessionCode(sessionCode: string): Promise<CheckSessionResponse> {
  const response = await fetch(`${BASE_URL}/api/connect/${sessionCode}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Session not found");
  }

  return response.json();
}

export async function joinTeam(data: JoinTeamRequest): Promise<JoinTeamResponse> {
  const response = await fetch(`${BASE_URL}/api/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to join team");
  }

  return response.json();
}

export async function createSession(data: CreateSessionRequest = {}): Promise<CreateSessionResponse> {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to create session");
  }

  return response.json();
}

export interface GetSessionDetailsResponse {
  session: {
    session_id: string;
    session_code: number;
    target_team: number;
    status: string;
  };
  teams: any[];
}

export async function getSessionDetails(sessionCode: string): Promise<GetSessionDetailsResponse> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch session metadata");
  }

  return response.json();
}

export async function toggleTeamReady(teamId: string, isReady: boolean): Promise<{ status: string; is_ready: boolean }> {
  const response = await fetch(`${BASE_URL}/api/connect/${teamId}/ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_ready: isReady }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to update ready status");
  }

  return response.json();
}
