import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { banOpponentZoneAPI, fetchOpponentStatsAPI, fetchTeamStatsAPI, finishRoundAPI, submitShotAPI } from "./game";

const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof mock>;

beforeEach(() => {
  mockFetch = mock();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("fetchTeamStatsAPI", () => {
  const teamId = "team_1";
  const roundNumber = 1;

  it("should successfully fetch team stats and return data", async () => {
    const mockResponse = { team_id: "team_1", score: 10 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchTeamStatsAPI(teamId, roundNumber);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/game/team_stats/${teamId}/${roundNumber}`),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Team not found";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(fetchTeamStatsAPI(teamId, roundNumber)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(fetchTeamStatsAPI(teamId, roundNumber)).rejects.toThrow("Failed to fetch team stats");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(fetchTeamStatsAPI(teamId, roundNumber)).rejects.toThrow("Failed to fetch team stats");
  });
});

describe("finishRoundAPI", () => {
  const mockData = {
    team_id: "team_1",
    round_number: 1,
  };

  it("should successfully finish a round and return data", async () => {
    const mockResponse = { status: "success", message: "Round finished" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await finishRoundAPI(mockData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/game/finish_round"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Round already finished";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow("Failed to finish round");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow("Failed to finish round");
  });
});

describe("submitShotAPI", () => {
  const mockData = {
    player_id: "player_1",
    team_id: "team_1",
    session_id: "session_1",
    round_number: 1,
    zone: 4,
    shot_made: true,
  };

  it("should successfully submit a shot and return data", async () => {
    const mockResponse = { status: "success", shot_id: "shot_1", points_awarded: 3 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await submitShotAPI(mockData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/game/shot"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Failed to record shot.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(submitShotAPI(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(submitShotAPI(mockData)).rejects.toThrow("Failed to submit shot");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(submitShotAPI(mockData)).rejects.toThrow("Failed to submit shot");
  });
});

describe("fetchOpponentStatsAPI", () => {
  const sessionId = "session_1";
  const myTeamId = "team_1";

  it("should successfully fetch opponent stats and return data", async () => {
    const mockResponse = {
      status: "ready",
      opponent_team_id: "team_2",
      shots_taken: 6,
      points: 12,
      raw_shots: [{ zone: 4, shot_made: true }],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchOpponentStatsAPI(sessionId, myTeamId);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/game/opponent_stats/${sessionId}/${myTeamId}`),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Failed to fetch teams.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(fetchOpponentStatsAPI(sessionId, myTeamId)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(fetchOpponentStatsAPI(sessionId, myTeamId)).rejects.toThrow("Failed to fetch opponent stats");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(fetchOpponentStatsAPI(sessionId, myTeamId)).rejects.toThrow("Failed to fetch opponent stats");
  });
});

describe("banOpponentZoneAPI", () => {
  const mockData = {
    opponent_team_id: "team_2",
    zone: 5,
  };

  it("should successfully ban an opponent zone and return data", async () => {
    const mockResponse = { status: "success", message: "Banned zone 5 for opponent." };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await banOpponentZoneAPI(mockData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/game/ban"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Failed to set banned zone.";
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(banOpponentZoneAPI(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(banOpponentZoneAPI(mockData)).rejects.toThrow("Failed to ban zone");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(banOpponentZoneAPI(mockData)).rejects.toThrow("Failed to ban zone");
  });
});
