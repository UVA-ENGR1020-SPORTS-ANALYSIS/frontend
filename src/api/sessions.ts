export interface JoinSessionPayload {
  sessionCode: string;
  teamCount: number;
  members: string[];
}

export async function initializeSession(data: JoinSessionPayload) {
  const response = await fetch("/api/sessions/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to initialize session");
  }

  return response.json();
}

export interface JoinSinglePayload {
  sessionCode: string;
  playerName: string;
}

export async function joinSessionSingle(data: JoinSinglePayload) {
  const response = await fetch("/api/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_code: data.sessionCode,
      player_name: data.playerName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to join session");
  }

  return response.json();
}

export async function validateSessionCode(sessionCode: string) {
  const response = await fetch(`/api/connect/${sessionCode}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Session not found");
  }

  return response.json();
}
