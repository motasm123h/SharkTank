import { describe, expect, it } from "vitest";
import { classifyAiError, UnusableOutputError } from "./classify";
import { parseChain, liveConfigFrom, type ModelRef } from "./config";
import { AllModelsFailedError, ModelRouter } from "./router";

const chain = parseChain("a,b,c", "google");
const apiError = (statusCode: number, responseBody = "") =>
  Object.assign(new Error("api"), { name: "AI_APICallError", statusCode, responseBody });

function setup(behaviour: Record<string, (() => unknown) | undefined>) {
  let clock = 0;
  const calls: string[] = [];
  const router = new ModelRouter({
    classify: classifyAiError,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
  });
  const call = async (ref: ModelRef) => {
    calls.push(ref.model);
    const fn = behaviour[ref.model];
    if (fn) return fn();
    return ref.model;
  };
  return { router, calls, call, advance: (ms: number) => (clock += ms) };
}

describe("ModelRouter", () => {
  it("uses the first model when it works", async () => {
    const { router, calls, call } = setup({});
    const result = await router.run("chat", chain, call);
    expect(result.value).toBe("a");
    expect(calls).toEqual(["a"]);
  });

  it("falls back when a model is out of quota, then skips it until it recovers", async () => {
    const { router, calls, call, advance } = setup({
      a: () => {
        throw apiError(429, '{"retryDelay": "30s"}');
      },
    });
    expect((await router.run("chat", chain, call)).value).toBe("b");
    expect((await router.run("chat", chain, call)).value).toBe("b");
    expect(calls).toEqual(["a", "b", "b"]);
    advance(32_000);
    await router.run("chat", chain, call).catch(() => undefined);
    expect(calls.at(-2)).toBe("a");
  });

  it("moves on without benching a model that returned unusable output", async () => {
    let first = true;
    const { router, call } = setup({
      a: () => {
        if (first) {
          first = false;
          throw new UnusableOutputError("bad");
        }
        return "a";
      },
    });
    expect((await router.run("chat", chain, call)).value).toBe("b");
    expect((await router.run("chat", chain, call)).value).toBe("a");
  });

  it("retries the chain once after a pause when every model was overloaded", async () => {
    let round = 0;
    const overloaded = () => {
      throw apiError(503);
    };
    const { router, calls, call } = setup({
      a: () => {
        round += 1;
        // Back after the pause.
        if (round > 1) return "a";
        throw apiError(503);
      },
      b: overloaded,
      c: overloaded,
    });
    const result = await router.run("chat", chain, call);
    expect(result.value).toBe("a");
    expect(calls).toEqual(["a", "b", "c", "a"]);
    // Recovered: no longer benched.
    expect(router.isBenched(chain[0]!)).toBe(false);
  });

  it("reports when the first model is expected back", async () => {
    const quota = () => {
      throw apiError(429, '{"quotaId": "GenerateRequestsPerDayPerProject"}');
    };
    const { router, call } = setup({ a: quota, b: quota, c: quota });
    const error = await router.run("chat", chain, call).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AllModelsFailedError);
    expect((error as AllModelsFailedError).retryAfterMs).toBe(3_600_000);
    expect((error as AllModelsFailedError).attempts.map((a) => a.reason)).toEqual([
      "daily quota used up",
      "daily quota used up",
      "daily quota used up",
    ]);
  });
});

describe("classifyAiError", () => {
  it("reads Google's retry delay", () => {
    expect(classifyAiError(apiError(429, '{"retryDelay": "41s"}')).cooldownMs).toBe(42_000);
  });
  it("treats overload and timeouts as transient", () => {
    expect(classifyAiError(apiError(503)).transient).toBe(true);
    expect(classifyAiError(Object.assign(new Error("x"), { name: "TimeoutError" })).transient).toBe(
      true,
    );
  });
  it("benches a model that no longer exists", () => {
    expect(classifyAiError(apiError(404)).reason).toBe("model not available");
  });
});

describe("config", () => {
  it("parses chains with and without provider prefixes", () => {
    expect(parseChain("gemini-x, openrouter:meta/llama:free", "google")).toEqual([
      { provider: "google", model: "gemini-x" },
      { provider: "openrouter", model: "meta/llama:free" },
    ]);
  });

  it("drops models whose provider has no key and requires at least one", () => {
    const config = liveConfigFrom({
      AI_PROVIDER: "google",
      AI_API_KEY: "k",
      AI_MODEL: "g1,openrouter:o1",
    });
    expect(config.chains.chat).toEqual([{ provider: "google", model: "g1" }]);
    expect(() => liveConfigFrom({ AI_PROVIDER: "google", AI_API_KEY: "" })).toThrow(/AI_API_KEY/);
  });

  it("treats empty settings as defaults", () => {
    const config = liveConfigFrom({
      AI_PROVIDER: "google",
      AI_API_KEY: "k",
      AI_SEARCH: "",
      AI_DAILY_SESSION_LIMIT: "",
    });
    expect(config.dailySessionLimit).toBe(30);
    expect(config.search).toBe(false);
  });

  it("keeps search off unless asked for", () => {
    expect(liveConfigFrom({ AI_PROVIDER: "google", AI_API_KEY: "k" }).search).toBe(false);
    expect(
      liveConfigFrom({ AI_PROVIDER: "google", AI_API_KEY: "k", AI_SEARCH: "google" }).search,
    ).toBe(true);
  });
});
