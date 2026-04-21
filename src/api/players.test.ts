import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { fetchPlayerStats, fetchTeamPlayers, PlayerStats } from "./players";

describe("fetchPlayerStats", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockPlayerId = "player_1";
  const mockPlayerStats: PlayerStats = {
    player_id: "player_1",
    player_team_id: "team_1",
    player_name: "John Doe",
    total_points: 10,
    total_makes: 5,
    total_attempts: 10,
    shooting_pct: 50.0,
  };

  it("should successfully fetch player stats", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPlayerStats),
    });

    const result = await fetchPlayerStats(mockPlayerId);

    expect(result).toEqual(mockPlayerStats);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/players/${mockPlayerId}`)
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Player not found";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(fetchPlayerStats(mockPlayerId)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(fetchPlayerStats(mockPlayerId)).rejects.toThrow("Failed to fetch player stats");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(fetchPlayerStats(mockPlayerId)).rejects.toThrow("Failed to fetch player stats");
  });
});

describe("fetchTeamPlayers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockTeamId = "team_1";
  const mockTeamPlayers = {
    team_id: "team_1",
    players: [
      {
        player_id: "player_1",
        player_team_id: "team_1",
        player_name: "John Doe",
        total_points: 10,
        total_makes: 5,
        total_attempts: 10,
        shooting_pct: 50.0,
      }
    ],
  };

  it("should successfully fetch team players", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTeamPlayers),
    });

    const result = await fetchTeamPlayers(mockTeamId);

    expect(result).toEqual(mockTeamPlayers);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/players/team/${mockTeamId}`)
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Team not found";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(fetchTeamPlayers(mockTeamId)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(fetchTeamPlayers(mockTeamId)).rejects.toThrow("Failed to fetch team players");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(fetchTeamPlayers(mockTeamId)).rejects.toThrow("Failed to fetch team players");
  });
});
