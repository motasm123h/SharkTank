import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Boardroom } from "@/components/boardroom/Boardroom";
import type { Locale } from "@/i18n/routing";
import { readAnonId } from "@/lib/anon";
import { loadOwnSession } from "@/server/sessions";

type Props = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Boardroom" });
  return { title: t("title") };
}

export default async function PitchSessionPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await loadOwnSession(id, await readAnonId());
  if (!session) notFound();
  const { input } = session;

  const t = await getTranslations();
  const regions = new Intl.DisplayNames([locale], { type: "region" });
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: input.budget.currency,
    maximumFractionDigits: 0,
  });
  const demoNames: Record<string, string> = (await getMessages()).Pitch.demo.scenarios;

  const rows: [string, string][] = [
    [t("Saved.idea"), input.idea],
    [
      t("Saved.place"),
      t("Saved.placeValue", {
        city: input.city,
        country: regions.of(input.country) ?? input.country,
      }),
    ],
    [t("Saved.budget"), money.formatRange(input.budget.min, input.budget.max)],
    [t("Saved.mode"), t(`Pitch.fields.mode.${input.mode}.title`)],
    [t("Saved.stage"), t(`Pitch.fields.stage.${input.stage}.title`)],
    [t("Saved.language"), t(`Pitch.fields.language.${input.language}`)],
  ];
  if (session.scenarioId) {
    rows.push([t("Saved.demo"), demoNames[session.scenarioId] ?? session.scenarioId]);
  }

  return (
    <main id="main" className="mx-auto max-w-4xl px-2 py-4 sm:px-4 sm:py-8">
      <h1 className="sr-only">{t("Boardroom.title")}</h1>
      <Boardroom sessionId={session.id} transcript={session.transcript} language={input.language} />

      <details className="bg-surface border-border mt-4 rounded-2xl border p-4">
        <summary className="cursor-pointer font-medium">{t("Boardroom.yourPitch")}</summary>
        <dl className="mt-3 divide-y divide-[var(--border)]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-ink-muted text-sm font-medium">{label}</dt>
              <dd className="whitespace-pre-line">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </main>
  );
}
