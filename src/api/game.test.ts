import { expect, test, mock, spyOn, beforeEach, afterEach, describe } from "bun:test";
import { submitShotAPI } from "./game";

describe("apiFetch wrapper error paths", () => {
  let fetchMock: ReturnType<typeof spyOn>;
  let setTimeoutSpy: ReturnType<typeof spyOn>;
  let clearTimeoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    fetchMock = spyOn(global, "fetch");
    setTimeoutSpy = spyOn(global, "setTimeout");
    clearTimeoutSpy = spyOn(global, "clearTimeout");
  });

  afterEach(() => {
    mock.restore();
  });

  test("should clear timeout even if fetch throws a network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network Error"));

    await expect(submitShotAPI({
      player_id: "p1",
      team_id: "t1",
      session_id: "s1",
      round_number: 1,
      zone: 1,
      shot_made: true
    })).rejects.toThrow("Network Error");

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test("should clear timeout on successful fetch", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok", shot_id: "1", points_awarded: 2 }), { status: 200 }));

    await submitShotAPI({
      player_id: "p1",
      team_id: "t1",
      session_id: "s1",
      round_number: 1,
      zone: 1,
      shot_made: true
    });

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test("should abort fetch on timeout", async () => {
    // We want to test that if the timeout triggers, the abort controller aborts the fetch.

    // Intercept setTimeout to immediately call its callback (simulating a timeout)
    setTimeoutSpy.mockImplementation((cb: Function, _ms: number) => {
      cb(); // This triggers controller.abort()
      return 123 as any;
    });

    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      // By the time fetch is called, the abort controller should have triggered if our mock worked
      if (init?.signal?.aborted) {
        throw new Error("AbortError");
      }
      return new Response(JSON.stringify({ status: "ok", shot_id: "1", points_awarded: 2 }), { status: 200 });
    });

    await expect(submitShotAPI({
      player_id: "p1",
      team_id: "t1",
      session_id: "s1",
      round_number: 1,
      zone: 1,
      shot_made: true
    })).rejects.toThrow("AbortError");

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
