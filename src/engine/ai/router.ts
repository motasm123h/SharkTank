import { modelKey, type ModelRef } from "./config";

/** How a failed call should affect the model that made it. */
export type Failure = {
  /** Skip this model for this long. 0 = try it again next time. */
  cooldownMs: number;
  /** Worth another pass over the chain after a short wait (overload, network). */
  transient: boolean;
  reason: string;
};

export type Attempt = { model: string; ok: boolean; ms: number; reason?: string };

export class AllModelsFailedError extends Error {
  constructor(
    readonly attempts: Attempt[],
    /** When the first model is expected back, so the UI can say "try again in…". */
    readonly retryAfterMs: number,
  ) {
    super(
      `Every model failed: ${attempts.map((a) => `${a.model} (${a.reason ?? "?"})`).join(", ")}`,
    );
    this.name = "AllModelsFailedError";
  }
}

export type RouterOptions = {
  classify: (error: unknown) => Failure;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Passes over the chain when every failure was transient. */
  passes?: number;
  pauseBetweenPassesMs?: number;
  onAttempt?: (task: string, attempt: Attempt) => void;
};

/**
 * Sends a call to the first available model in a chain and falls back to the
 * next one on failure. A model that ran out of quota is benched for a while,
 * so later calls go straight to one that works.
 */
export class ModelRouter {
  private readonly benchedUntil = new Map<string, number>();
  private readonly now: () => number;
  private readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;

  constructor(private readonly options: RouterOptions) {
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
  }

  isBenched(ref: ModelRef): boolean {
    return (this.benchedUntil.get(modelKey(ref)) ?? 0) > this.now();
  }

  async run<T>(
    task: string,
    chain: readonly ModelRef[],
    call: (ref: ModelRef) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<{ value: T; model: ModelRef }> {
    const attempts: Attempt[] = [];
    const passes = this.options.passes ?? 2;

    // First pass: every model that is not benched (calling a benched one would only
    // spend quota on a refusal). Later passes: only the ones that failed for a
    // passing reason (overload, network), after a short pause.
    let candidates = chain.filter((ref) => !this.isBenched(ref));
    for (let pass = 0; pass < passes && candidates.length > 0; pass++) {
      const retryLater: ModelRef[] = [];

      for (const ref of candidates) {
        signal?.throwIfAborted();
        const started = this.now();
        try {
          const value = await call(ref);
          this.benchedUntil.delete(modelKey(ref));
          this.record(task, attempts, { model: modelKey(ref), ok: true, ms: this.now() - started });
          return { value, model: ref };
        } catch (error) {
          if (signal?.aborted) throw error;
          const failure = this.options.classify(error);
          this.record(task, attempts, {
            model: modelKey(ref),
            ok: false,
            ms: this.now() - started,
            reason: failure.reason,
          });
          if (failure.cooldownMs > 0) {
            this.benchedUntil.set(modelKey(ref), this.now() + failure.cooldownMs);
          }
          if (failure.transient) retryLater.push(ref);
        }
      }
      candidates = retryLater;
      if (candidates.length > 0 && pass < passes - 1) {
        await this.sleep(this.options.pauseBetweenPassesMs ?? 1500, signal);
      }
    }

    const soonest = Math.min(...chain.map((ref) => this.benchedUntil.get(modelKey(ref)) ?? 0));
    throw new AllModelsFailedError(attempts, Math.max(0, soonest - this.now()));
  }

  private record(task: string, attempts: Attempt[], attempt: Attempt) {
    attempts.push(attempt);
    this.options.onAttempt?.(task, attempt);
  }
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
