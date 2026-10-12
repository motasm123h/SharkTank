import type { Failure } from "./router";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** The model answered, but not in a usable shape. Try the next model; no cooldown. */
export class UnusableOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnusableOutputError";
  }
}

type ApiLike = { statusCode?: number; responseBody?: string; name?: string; message?: string };

/** Google returns e.g. `"retryDelay": "41s"` with a 429. */
function retryDelayMs(body: string | undefined): number | undefined {
  const match = body && /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  return match ? Math.ceil(Number(match[1]) * SECOND) + SECOND : undefined;
}

/**
 * Decides what a failed model call means for the router. Works on the shapes
 * of AI SDK errors without importing them, so it stays easy to test.
 */
export function classifyAiError(error: unknown): Failure {
  const e = (error ?? {}) as ApiLike & { lastError?: ApiLike; cause?: unknown };
  const api: ApiLike = e.lastError ?? e;
  const status = api.statusCode;
  const body = api.responseBody;
  const name = e.name ?? "";

  if (name === "UnusableOutputError" || /NoObjectGenerated|TypeValidation|JSONParse/.test(name)) {
    return { cooldownMs: 0, transient: false, reason: "unusable output" };
  }
  if (name === "TimeoutError" || /timed? ?out/i.test(e.message ?? "")) {
    return { cooldownMs: 30 * SECOND, transient: true, reason: "timeout" };
  }
  if (status === 429) {
    const daily = body ? /PerDay|per day|daily/i.test(body) : false;
    return {
      cooldownMs: daily ? HOUR : (retryDelayMs(body) ?? MINUTE),
      transient: false,
      reason: daily ? "daily quota used up" : "rate limited",
    };
  }
  if (status === 401 || status === 403) {
    return { cooldownMs: 6 * HOUR, transient: false, reason: "key rejected" };
  }
  if (status === 404) {
    return { cooldownMs: 6 * HOUR, transient: false, reason: "model not available" };
  }
  if (status === 400) {
    return { cooldownMs: 0, transient: false, reason: "request rejected" };
  }
  if (status !== undefined && status >= 500) {
    return { cooldownMs: 8 * SECOND, transient: true, reason: `overloaded (${status})` };
  }
  // Network failures and anything unexpected: brief pause, worth a retry.
  return { cooldownMs: 10 * SECOND, transient: true, reason: name || "unknown error" };
}
