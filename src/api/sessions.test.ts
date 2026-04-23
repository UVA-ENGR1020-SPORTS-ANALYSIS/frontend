import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { createSession, getSessionDetails, joinTeam, toggleTeamReady, validateSessionCode } from "./sessions";

const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof mock>;

beforeEach(() => {
  mockFetch = mock();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("joinTeam", () => {
  const mockData = {
    player_names: ["Alice", "Bob"],
    session_id: "session_1",
    session_code: 1234,
  };

  it("should successfully join a team and return data", async () => {
    const mockResponse = { status: "success", team_id: "team_1", players: [], message: "Joined" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await joinTeam(mockData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/connect"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Team is full";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(joinTeam(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(joinTeam(mockData)).rejects.toThrow("Failed to join team");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(joinTeam(mockData)).rejects.toThrow("Failed to join team");
  });
});

describe("validateSessionCode", () => {
  const sessionCode = "123456";

  it("should successfully validate a session code and return data", async () => {
    const mockResponse = {
      status: "valid",
      session_code: 123456,
      session_id: "session_1",
      current_teams_count: 1,
      message: "Room is ready. Please enter your team's players.",
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await validateSessionCode(sessionCode);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/connect/${sessionCode}`),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Room is already full.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(validateSessionCode(sessionCode)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(validateSessionCode(sessionCode)).rejects.toThrow("Session not found");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(validateSessionCode(sessionCode)).rejects.toThrow("Session not found");
  });
});

describe("createSession", () => {
  const mockData = {
    creator_name: "Coach",
    admin_password: "secret",
    team_count: 4,
  };

  it("should successfully create a session with an explicit payload", async () => {
    const mockResponse = { session_code: 654321, session_id: "session_2" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await createSession(mockData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should successfully create a session with the default payload", async () => {
    const mockResponse = { session_code: 111111, session_id: "session_3" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await createSession();

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Could not generate a unique session code. Try again.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(createSession(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(createSession(mockData)).rejects.toThrow("Failed to create session");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(createSession(mockData)).rejects.toThrow("Failed to create session");
  });
});

describe("getSessionDetails", () => {
  const sessionCode = "123456";

  it("should successfully fetch session details and return data", async () => {
    const mockResponse = {
      session: {
        session_id: "session_1",
        session_code: 123456,
        target_team: 2,
        status: "waiting",
      },
      teams: [
        {
          team_id: "team_1",
          is_ready: false,
          round_1_finished: false,
          round_2_finished: false,
          banned_zone: null,
          player: [{ player_id: "p1", player_name: "Alice" }],
        },
      ],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getSessionDetails(sessionCode);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/sessions/${sessionCode}`),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Session not found";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(getSessionDetails(sessionCode)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(getSessionDetails(sessionCode)).rejects.toThrow("Failed to fetch session metadata");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(getSessionDetails(sessionCode)).rejects.toThrow("Failed to fetch session metadata");
  });
});

describe("toggleTeamReady", () => {
  const teamId = "team_1";

  it("should successfully toggle team ready status and return data", async () => {
    const mockResponse = { status: "success", is_ready: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await toggleTeamReady(teamId, true);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/connect/${teamId}/ready`),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ready: true }),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Team not found or could not update status.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(toggleTeamReady(teamId, true)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(toggleTeamReady(teamId, true)).rejects.toThrow("Failed to update ready status");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(toggleTeamReady(teamId, true)).rejects.toThrow("Failed to update ready status");
  });
});
