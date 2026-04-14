import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { joinTeam, JoinTeamRequest } from "./sessions";

const originalFetch = globalThis.fetch;

describe("joinTeam", () => {
  beforeEach(() => {
    globalThis.fetch = mock();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  it("should successfully join a team and return the response", async () => {
    const mockRequest: JoinTeamRequest = {
      player_names: ["Alice", "Bob"],
      session_code: 1234,
    };
    const mockResponse = {
      status: "success",
      team_id: "team-1",
      players: [{ name: "Alice" }, { name: "Bob" }],
      message: "Joined successfully",
    };

    (globalThis.fetch as any).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await joinTeam(mockRequest);

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toContain("/api/connect");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify(mockRequest));
    expect(options.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("should throw an error with the detail message if the response is not ok", async () => {
    const mockRequest: JoinTeamRequest = {
      player_names: ["Alice"],
    };
    const errorDetail = "Session not found";

    (globalThis.fetch as any).mockResolvedValue(
      new Response(JSON.stringify({ detail: errorDetail }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(joinTeam(mockRequest)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error message if response is not ok and JSON parsing fails", async () => {
    const mockRequest: JoinTeamRequest = {
      player_names: ["Alice"],
    };

    (globalThis.fetch as any).mockResolvedValue(
      new Response("Invalid JSON", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    );

    await expect(joinTeam(mockRequest)).rejects.toThrow("Failed to join team");
  });

  it("should throw a default error message if response is not ok and no detail is provided", async () => {
    const mockRequest: JoinTeamRequest = {
      player_names: ["Alice"],
    };

    (globalThis.fetch as any).mockResolvedValue(
      new Response(JSON.stringify({ some_other_field: "error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(joinTeam(mockRequest)).rejects.toThrow("Failed to join team");
  });
});
