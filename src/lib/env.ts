import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  AI_PROVIDER: z.enum(["mock"]).default("mock"),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validated server environment. Read lazily so `next build` does not need
 * runtime secrets such as DATABASE_URL.
 */
export function env(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
