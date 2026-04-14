import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { finishRoundAPI } from "./game";

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
