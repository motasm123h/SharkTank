import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";
import { getDb } from "@/db";
import { pitchSessions } from "@/db/schema";
import { PitchInputSchema } from "@/domain";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { readAnonId } from "@/lib/anon";

type Props = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Saved" });
  return { title: t("title") };
}

async function loadOwnSession(id: string) {
  if (!z.uuid().safeParse(id).success) return undefined;
  const anonId = await readAnonId();
  if (!anonId) return undefined;
  const [row] = await getDb()
    .select()
    .from(pitchSessions)
    .where(and(eq(pitchSessions.id, id), eq(pitchSessions.anonId, anonId)))
    .limit(1);
  return row;
}

/** Placeholder until the boardroom scene (Phase 3) mounts here. */
export default async function PitchSessionPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const row = await loadOwnSession(id);
  if (!row) notFound();
  const input = PitchInputSchema.parse(row.input);

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
  if (row.scenarioId) rows.push([t("Saved.demo"), demoNames[row.scenarioId] ?? row.scenarioId]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold">{t("Saved.title")}</h1>
      <p className="text-ink-muted mt-2 text-lg">{t("Saved.body")}</p>
      <dl className="bg-surface border-border mt-8 divide-y divide-[var(--border)] rounded-2xl border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-ink-muted text-sm font-medium">{label}</dt>
            <dd className="whitespace-pre-line">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href="/pitch" className="text-accent mt-8 inline-block font-semibold underline">
        {t("Saved.newPitch")}
      </Link>
    </main>
  );
}
