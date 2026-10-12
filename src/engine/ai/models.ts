import { createGoogleGenerativeAI, type GoogleProvider } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { LiveAiConfig, ModelRef, ProviderId } from "./config";

/** Builds AI SDK models for the refs in a config, one client per provider. */
export class ModelFactory {
  private google?: GoogleProvider;
  private openrouter?: ReturnType<typeof createOpenAICompatible>;

  constructor(private readonly keys: LiveAiConfig["keys"]) {}

  model(ref: ModelRef): LanguageModel {
    switch (ref.provider) {
      case "google":
        return this.googleProvider()(ref.model);
      case "openrouter":
        this.openrouter ??= createOpenAICompatible({
          name: "openrouter",
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: this.key("openrouter"),
          supportsStructuredOutputs: true,
        });
        return this.openrouter(ref.model);
    }
  }

  /** Gemini's built-in Google Search (grounding). */
  googleSearchTool() {
    return this.googleProvider().tools.googleSearch({});
  }

  private googleProvider(): GoogleProvider {
    this.google ??= createGoogleGenerativeAI({ apiKey: this.key("google") });
    return this.google;
  }

  private key(provider: ProviderId): string {
    const key = this.keys[provider];
    if (!key) throw new Error(`No API key for ${provider}`);
    return key;
  }
}

/** Provider-specific settings: short thinking for chat keeps Gemini replies quick. */
export function providerOptionsFor(ref: ModelRef, task: "chat" | "report") {
  if (ref.provider !== "google") return undefined;
  return {
    google: { thinkingConfig: { thinkingLevel: task === "chat" ? "low" : "medium" } },
  } as const;
}
