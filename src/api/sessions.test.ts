import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { createSession } from "./sessions";

describe("createSession", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset the mock before each test
    global.fetch = mock();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should make a POST request with correct payload and return response on success", async () => {
    const mockResponse = { session_code: 1234, session_id: "abc-123" };
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const data = { creator_name: "John", team_count: 2, admin_password: "pw" };
    const result = await createSession(data);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as ReturnType<typeof mock>).mock.calls[0];

    // Check URL pattern (BASE_URL might be http://localhost:8000 depending on env)
    expect(url).toMatch(/\/api\/sessions$/);

    expect(options).toBeDefined();
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).toBe(JSON.stringify(data));

    expect(result).toEqual(mockResponse);
  });

  it("should send an empty object payload when called with no arguments", async () => {
    const mockResponse = { session_code: 5678, session_id: "xyz-789" };
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await createSession();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as ReturnType<typeof mock>).mock.calls[0];

    expect(options.body).toBe("{}");
    expect(result).toEqual(mockResponse);
  });

  it("should throw a specific error when response is not OK and contains detail", async () => {
    const mockErrorResponse = { detail: "Invalid request data" };
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(
      new Response(JSON.stringify(mockErrorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(createSession({ team_count: -1 })).rejects.toThrow("Invalid request data");
  });

  it("should throw a default error when response is not OK and JSON parsing fails", async () => {
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(
      new Response("Internal Server Error - Not JSON", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    );

    await expect(createSession()).rejects.toThrow("Failed to create session");
  });
});
