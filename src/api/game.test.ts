import { describe, expect, test, mock, afterEach } from "bun:test";
import { submitShotAPI } from "./game";

describe("game API", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("submitShotAPI", () => {
    test("throws fallback error when response is not ok and JSON parsing fails", async () => {
      // Mock fetch to return a non-ok response with invalid JSON
      global.fetch = mock().mockResolvedValue(
        new Response("Invalid JSON string", {
          status: 400,
          statusText: "Bad Request",
        })
      );

      const requestData = {
        player_id: "p1",
        team_id: "t1",
        session_id: "s1",
        round_number: 1,
        zone: 1,
        shot_made: true,
      };

      await expect(submitShotAPI(requestData)).rejects.toThrow("Failed to submit shot");
    });
  });
});
