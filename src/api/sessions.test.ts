import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { validateSessionCode } from "./sessions";

describe("validateSessionCode", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return parsed JSON when the response is ok", async () => {
    const mockResponseData = {
      status: "success",
      session_code: 1234,
      session_id: "test-session-id",
      current_teams_count: 2,
      message: "Session is valid",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const result = await validateSessionCode("1234");
    expect(result).toEqual(mockResponseData);

    // Check that fetch was called correctly
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/connect/1234");
  });

  it("should throw an error with detail message when response is not ok and JSON has detail", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid session code" }),
    });

    await expect(validateSessionCode("9999")).rejects.toThrow("Invalid session code");
  });

  it("should throw a default error when response is not ok and JSON parsing fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error("JSON Parse Error"); },
    });

    await expect(validateSessionCode("9999")).rejects.toThrow("Session not found");
  });
});
