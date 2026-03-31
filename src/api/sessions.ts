// ------------------------------------------------------------------
// Interfaces mapping directly to our Backend Pydantic Schemas
// ------------------------------------------------------------------
export interface JoinTeamResponse {
  status: string;
  team_id: string;
  players: any[];
  message: string;
}

export interface CheckSessionResponse {
  status: string;
  session_code: number;
  session_id: string;
  current_teams_count: number;
  message: string;
}

// ------------------------------------------------------------------
// Frontend Component Payloads
// ------------------------------------------------------------------
export interface JoinSessionPayload {
  sessionCode: string;
  teamCount: number;
  members: string[];
}

export interface JoinSinglePayload {
  sessionCode: string;
  playerName: string;
}

// ------------------------------------------------------------------
// API Functions
// ------------------------------------------------------------------

export async function initializeSession(data: JoinSessionPayload): Promise<JoinTeamResponse> {
  // Convert frontend camelCase payload to backend schema (JoinTeamRequest)
  const isSolo = data.sessionCode === "solo" || !data.sessionCode;
  
  const requestBody = {
    session_code: isSolo ? null : parseInt(data.sessionCode, 10),
    team_count: data.teamCount,
    player_names: data.members,
  };

  const response = await fetch("/api/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to initialize session");
  }

  return response.json();
}

export async function joinSessionSingle(data: JoinSinglePayload): Promise<JoinTeamResponse> {
  const isSolo = data.sessionCode === "solo" || !data.sessionCode;

  // Convert frontend camelCase payload to backend schema (JoinTeamRequest)
  const requestBody = {
    session_code: isSolo ? null : parseInt(data.sessionCode, 10),
    player_names: [data.playerName], // We wrap it in an array because backend expects List[str]
    team_count: 1, 
  };

  const response = await fetch("/api/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to join session");
  }

  return response.json();
}

export async function validateSessionCode(sessionCode: string): Promise<CheckSessionResponse> {
  const response = await fetch(`/api/connect/${sessionCode}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Session not found");
  }

  return response.json();
}
