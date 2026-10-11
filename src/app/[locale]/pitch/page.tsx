import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { PitchForm, type DemoOption } from "@/components/pitch/PitchForm";
import type { PitchInput } from "@/domain";
import { localize } from "@/engine/mock/localize";
import { MOCK_SCENARIOS } from "@/engine/mock/scenarios";
import type { Locale } from "@/i18n/routing";
import { countryOptions, currencyOptions } from "@/lib/countries";
import { aiEnv } from "@/lib/env";

type Props = { params: Promise<{ locale: Locale }> };

// Read AI_PROVIDER per request, so switching to a real model needs no rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pitch" });
  return { title: t("title") };
}

export default async function PitchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pitch");

  const demoNames: Record<string, string> = (await getMessages()).Pitch.demo.scenarios;
  const demos: DemoOption[] =
    aiEnv().AI_PROVIDER === "mock"
      ? MOCK_SCENARIOS.map((s) => ({
          id: s.id,
          label: demoNames[s.id] ?? s.id,
          input: localize<Omit<PitchInput, "language">>(s.input, locale),
        }))
      : [];

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
      <p className="text-ink-muted mt-2 mb-8 text-lg">{t("intro")}</p>
      <PitchForm
        locale={locale}
        countries={countryOptions(locale)}
        currencies={currencyOptions(locale)}
        demos={demos}
      />
    </main>
  );
}
