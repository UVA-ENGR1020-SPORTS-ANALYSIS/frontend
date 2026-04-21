import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { joinTeam } from "./sessions";

describe("joinTeam", () => {
  const mockData = {
    player_names: ["Alice", "Bob"],
    session_id: "session_1",
    session_code: 1234,
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully join a team and return data", async () => {
    const mockResponse = { status: "success", team_id: "team_1", players: [], message: "Joined" };
    (global.fetch as any).mockResolvedValue({
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
      })
    );
  });

  it("should throw an error with detail message on non-ok response", async () => {
    const errorDetail = "Team is full";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: errorDetail }),
    });

    await expect(joinTeam(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error on non-ok response without detail", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ someOtherField: "error" }),
    });

    await expect(joinTeam(mockData)).rejects.toThrow("Failed to join team");
  });

  it("should throw a default error when response is not ok and json parsing fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(joinTeam(mockData)).rejects.toThrow("Failed to join team");
  });
});
