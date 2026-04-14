import {
  expect,
  test,
  describe,
  mock,
  afterEach,
} from "bun:test";
import { fetchOpponentStatsAPI } from "./game";

describe("fetchOpponentStatsAPI", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("should return data on successful fetch", async () => {
    const mockData = { stats: "some data" };
    global.fetch = mock().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;

    const result = await fetchOpponentStatsAPI("session123", "team456");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain(
      "/api/game/opponent_stats/session123/team456"
    );
  });

  test("should throw error with detail message on non-OK response", async () => {
    const errorData = { detail: "Opponent not found" };
    global.fetch = mock().mockResolvedValue(
      new Response(JSON.stringify(errorData), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;

    expect(fetchOpponentStatsAPI("session123", "team456")).rejects.toThrow(
      "Opponent not found"
    );
  });

  test("should throw default error when non-OK response has no valid JSON", async () => {
    global.fetch = mock().mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    ) as unknown as typeof fetch;

    expect(fetchOpponentStatsAPI("session123", "team456")).rejects.toThrow(
      "Failed to fetch opponent stats"
    );
  });
});
