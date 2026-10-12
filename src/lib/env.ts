import "server-only";
import { z } from "zod";

const aiSchema = z.object({
  AI_PROVIDER: z.enum(["mock", "google", "openrouter"]).default("mock"),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

const envSchema = aiSchema
  .extend({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    /** Signs short-lived links (PDF rendering). Required in production. */
    APP_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(32).optional()),
    /** Gotenberg (PDF renderer) base URL. */
    GOTENBERG_URL: z.url().default("http://gotenberg:3000"),
    /** How Gotenberg reaches this app from inside the Docker network. */
    INTERNAL_APP_URL: z.url().default("http://web:3000"),
  })
  .refine((e) => e.NODE_ENV !== "production" || e.APP_SECRET, {
    path: ["APP_SECRET"],
    message: "APP_SECRET (32+ characters) is required in production",
  });

export type Env = z.infer<typeof envSchema>;
export type AiEnv = z.infer<typeof aiSchema>;

let cached: Env | undefined;
let cachedAi: AiEnv | undefined;

/**
 * Validated server environment. Read lazily so `next build` does not need
 * runtime secrets such as DATABASE_URL.
 */
export function env(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}

/** Only the AI settings; safe to call where no database is configured (e.g. at build time). */
export function aiEnv(): AiEnv {
  cachedAi ??= aiSchema.parse(process.env);
  return cachedAi;
}

/** Development falls back to a fixed secret; production refuses to start without one. */
export function appSecret(): string {
  return env().APP_SECRET ?? "development-only-secret-do-not-use-in-production";
}
