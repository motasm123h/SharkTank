import type { CountryCode } from "@/domain";
import type { MockScenario } from "../scenario";
import { cairoWaterApp } from "./cairo-water-app";
import { damascusHealthyFood } from "./damascus-healthy-food";
import { mumbaiTutoring } from "./mumbai-tutoring";

export const MOCK_SCENARIOS: readonly MockScenario[] = [
  damascusHealthyFood,
  mumbaiTutoring,
  cairoWaterApp,
];

/** Pinned scenario first, then a country match, then the first scenario. */
export function pickScenario(
  scenarios: readonly MockScenario[],
  scenarioId: string | undefined,
  country: CountryCode,
): MockScenario {
  const pinned = scenarioId ? scenarios.find((s) => s.id === scenarioId) : undefined;
  const byCountry = scenarios.find((s) => s.countries.includes(country));
  const chosen = pinned ?? byCountry ?? scenarios[0];
  if (!chosen) throw new Error("No mock scenarios configured");
  return chosen;
}
