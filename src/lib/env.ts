import "server-only";
import { z } from "zod";

const aiSchema = z.object({
  AI_PROVIDER: z.enum(["mock"]).default("mock"),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

const envSchema = aiSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
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
