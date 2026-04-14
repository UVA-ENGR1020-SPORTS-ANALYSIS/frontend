import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { fetchTeamStatsAPI } from "./game";

describe("fetchTeamStatsAPI", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // We mock global.fetch
    global.fetch = mock();
  });

  afterEach(() => {
    // Restore global.fetch
    global.fetch = originalFetch;
  });

  it("should successfully fetch team stats", async () => {
    const mockData = { points: 10, rebounds: 5 };
    const mockTeamId = "team1";
    const mockRoundNumber = 1;

    (global.fetch as ReturnType<typeof mock>).mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await fetchTeamStatsAPI(mockTeamId, mockRoundNumber);

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Get the first argument of the first call
    const fetchCallUrl = (global.fetch as ReturnType<typeof mock>).mock.calls[0][0];
    // BASE_URL is http://localhost:8000 in test environment
    expect(fetchCallUrl).toBe(`http://localhost:8000/api/game/team_stats/${mockTeamId}/${mockRoundNumber}`);
  });

  it("should throw an error with detail message on non-OK response with JSON", async () => {
    const mockErrorDetail = "Team not found";
    const mockTeamId = "team1";
    const mockRoundNumber = 1;

    (global.fetch as ReturnType<typeof mock>).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: mockErrorDetail }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(fetchTeamStatsAPI(mockTeamId, mockRoundNumber)).rejects.toThrow(mockErrorDetail);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should throw a generic error on non-OK response with invalid JSON", async () => {
    const mockTeamId = "team1";
    const mockRoundNumber = 1;

    (global.fetch as ReturnType<typeof mock>).mockResolvedValueOnce(
      new Response("Invalid JSON", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    );

    await expect(fetchTeamStatsAPI(mockTeamId, mockRoundNumber)).rejects.toThrow("Failed to fetch team stats");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
