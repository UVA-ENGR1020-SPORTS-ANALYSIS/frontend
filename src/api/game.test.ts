import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { finishRoundAPI, fetchTeamStatsAPI } from "./game";

describe("fetchTeamStatsAPI", () => {
  const teamId = "team_1";
  const roundNumber = 1;

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully fetch team stats and return data", async () => {
    const mockResponse = { team_id: "team_1", score: 10 };
    (global.fetch as any).mockResolvedValue({
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
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(fetchTeamStatsAPI(teamId, roundNumber)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(fetchTeamStatsAPI(teamId, roundNumber)).rejects.toThrow("Failed to fetch team stats");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    (global.fetch as any).mockResolvedValue({
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

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully finish a round and return data", async () => {
    const mockResponse = { status: "success", message: "Round finished" };
    (global.fetch as any).mockResolvedValue({
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
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Round already finished";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow("Failed to finish round");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(finishRoundAPI(mockData)).rejects.toThrow("Failed to finish round");
  });
});
