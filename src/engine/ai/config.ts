import { z } from "zod";

export const PROVIDERS = ["google", "openrouter"] as const;
export type ProviderId = (typeof PROVIDERS)[number];

/** One entry in a fallback chain, e.g. google:gemini-3.5-flash. */
export type ModelRef = { provider: ProviderId; model: string };

export const modelKey = (ref: ModelRef) => `${ref.provider}:${ref.model}`;

/** The work the panel asks a model to do. Each task has its own chain. */
export type AiTask = "chat" | "report";

/** Free-tier friendly defaults (checked October 2026): fast first, slower but stronger after. */
const DEFAULT_CHAINS: Record<ProviderId, Record<AiTask, string>> = {
  google: {
    chat: "gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.8-flash",
    report: "gemini-3.5-flash,gemini-3.8-flash,gemini-3.5-flash-lite",
  },
  openrouter: {
    chat: "meta-llama/llama-3.3-70b-instruct:free",
    report: "meta-llama/llama-3.3-70b-instruct:free",
  },
};

/**
 * Parses "a,b,openrouter:c" into model refs. Entries without a provider use
 * the primary one. Unknown providers are rejected so typos fail loudly.
 */
export function parseChain(spec: string, primary: ProviderId): ModelRef[] {
  return spec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.indexOf(":");
      const maybeProvider = colon > 0 ? entry.slice(0, colon) : "";
      if ((PROVIDERS as readonly string[]).includes(maybeProvider)) {
        return { provider: maybeProvider as ProviderId, model: entry.slice(colon + 1) };
      }
      // "model:free" style suffixes (OpenRouter) are part of the model id.
      return { provider: primary, model: entry };
    });
}

export type LiveAiConfig = {
  primary: ProviderId;
  chains: Record<AiTask, ModelRef[]>;
  keys: Partial<Record<ProviderId, string>>;
  /** Web search for competitors (Gemini "grounding"). Off unless the plan includes it. */
  search: boolean;
  dailySessionLimit: number;
};

// An empty line in .env ("AI_SEARCH=") means "use the default".
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const LiveEnvSchema = z.object({
  AI_PROVIDER: z.enum(PROVIDERS),
  AI_MODEL: z.string().optional(),
  AI_REPORT_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_SEARCH: z.preprocess(emptyToUndefined, z.enum(["off", "google"]).optional()),
  AI_DAILY_SESSION_LIMIT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
});

const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

/** Builds the live config from environment variables. Throws on a missing key. */
export function liveConfigFrom(env: Record<string, string | undefined>): LiveAiConfig {
  const e = LiveEnvSchema.parse(env);
  const primary = e.AI_PROVIDER;
  const chat = parseChain(blank(e.AI_MODEL) ?? DEFAULT_CHAINS[primary].chat, primary);
  const report = parseChain(
    blank(e.AI_REPORT_MODEL) ?? blank(e.AI_MODEL) ?? DEFAULT_CHAINS[primary].report,
    primary,
  );
  const keys: LiveAiConfig["keys"] = {};
  const primaryKey = blank(e.AI_API_KEY);
  if (primaryKey) keys[primary] = primaryKey;
  const openrouterKey = blank(e.OPENROUTER_API_KEY);
  if (openrouterKey) keys.openrouter = openrouterKey;

  const usable = (ref: ModelRef) => !!keys[ref.provider];
  const chains = { chat: chat.filter(usable), report: report.filter(usable) };
  if (chains.chat.length === 0 || chains.report.length === 0) {
    throw new Error(
      `AI_PROVIDER=${primary} needs an API key: set AI_API_KEY in .env (and OPENROUTER_API_KEY for openrouter models)`,
    );
  }
  return {
    primary,
    chains,
    keys,
    search: e.AI_SEARCH === "google" && !!keys.google,
    dailySessionLimit: e.AI_DAILY_SESSION_LIMIT ?? 30,
  };
}
