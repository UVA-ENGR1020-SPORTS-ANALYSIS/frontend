import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { submitShotAPI, SubmitShotRequest } from "./game";

describe("submitShotAPI", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockData: SubmitShotRequest = {
    player_id: "player1",
    team_id: "team1",
    session_id: "session1",
    round_number: 1,
    zone: 3,
    shot_made: true,
  };

  it("should submit a shot successfully", async () => {
    const mockResponse = { status: "success", shot_id: "shot1", points_awarded: 2 };

    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));

    const result = await submitShotAPI(mockData);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (global.fetch as ReturnType<typeof mock>).mock.calls[0];

    // Check URL starts with the base URL (which defaults to http://localhost:8000 if not set)
    expect(fetchArgs[0]).toContain("/api/game/shot");

    // Check request options
    const options = fetchArgs[1];
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).toBe(JSON.stringify(mockData));

    expect(result).toEqual(mockResponse);
  });

  it("should throw an error with detail message on non-OK response", async () => {
    const errorDetail = "Invalid zone";
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response(JSON.stringify({ detail: errorDetail }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    }));

    await expect(submitShotAPI(mockData)).rejects.toThrow(errorDetail);
  });

  it("should throw a default error message on non-OK response without detail", async () => {
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response(JSON.stringify({ otherError: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));

    await expect(submitShotAPI(mockData)).rejects.toThrow("Failed to submit shot");
  });

  it("should throw a default error message on non-OK response with invalid JSON", async () => {
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    }));

    await expect(submitShotAPI(mockData)).rejects.toThrow("Failed to submit shot");
  });
});
