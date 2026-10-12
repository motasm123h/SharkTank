import "server-only";
import { aiEnv } from "@/lib/env";
import { AiEngine } from "./ai/AiEngine";
import { liveConfigFrom } from "./ai/config";
import { MockEngine } from "./mock/MockEngine";
import type { SessionEngine } from "./types";

export type { EngineContext, RunOptions, SessionEngine } from "./types";

// One live engine per process, so the router remembers which models are out of quota.
let live: AiEngine | undefined;

/** The engine selected by AI_PROVIDER: "mock" (no key needed) or a real provider. */
export function getEngine(): SessionEngine {
  if (aiEnv().AI_PROVIDER === "mock") return new MockEngine();
  live ??= new AiEngine(liveConfigFrom(process.env));
  return live;
}

/** Sessions a live engine may start per day (UTC); undefined with the mock. */
export function dailySessionLimit(): number | undefined {
  if (aiEnv().AI_PROVIDER === "mock") return undefined;
  return liveConfigFrom(process.env).dailySessionLimit;
}
