import "server-only";
import { aiEnv } from "@/lib/env";
import { MockEngine } from "./mock/MockEngine";
import type { SessionEngine } from "./types";

export type { EngineContext, RunOptions, SessionEngine } from "./types";

/** The engine selected by AI_PROVIDER. Real providers arrive in Phase 7. */
export function getEngine(): SessionEngine {
  switch (aiEnv().AI_PROVIDER) {
    case "mock":
      return new MockEngine();
  }
}
