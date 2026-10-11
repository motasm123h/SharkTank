import { getTranslations } from "next-intl/server";
import type { Locale, Report, TimingVerdict } from "@/domain";
import { directionOf } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import type { ReportRecord } from "@/server/sessions";
import { BudgetPanel, RadarPanel, ScenariosPanel } from "./charts/panels";
import { FigureBadge, FigureValue } from "./FigureValue";
import { PrintReady } from "./PrintReady";
import { ReportActions } from "./ReportActions";
import { BulletList, Section } from "./Section";
import { WorldFit } from "./world/WorldFit";

export type ReportMode = "owner" | "shared" | "print";

type Props = {
  record: ReportRecord;
  locale: Locale;
  mode: ReportMode;
  numericIds: Record<string, string>;
  countryNames: Record<string, string>;
  shareToken?: string;
};

const VERDICT_STYLE: Record<Report["canSell"]["verdict"], string> = {
  yes: "bg-ok/15 text-ok",
  conditional: "bg-accent/15 text-accent",
  no: "bg-danger/15 text-danger",
};
const TIMING: TimingVerdict[] = ["too_early", "right_time", "late"];

export async function ReportView({
  record,
  locale,
  mode,
  numericIds,
  countryNames,
  shareToken,
}: Props) {
  const t = await getTranslations("Report");
  const tPitch = await getTranslations("Pitch.fields.mode");
  const { report, input } = record;
  const print = mode === "print";
  // Report content is in the session language; the interface in the page locale.
  const lang = input.language;
  const contentDir = directionOf(lang);
  const country = countryNames[input.country] ?? input.country;
  const currency = report.marketing.totalMonthlyBudget.currency ?? input.budget.currency;

  return (
    <div className="flex flex-col gap-5">
      {print && <PrintReady />}

      {/* ---- header ---- */}
      <header className="flex flex-col gap-3">
        <p className="text-accent text-sm font-semibold">{t("eyebrow")}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="text-ink-muted">
          {t("subtitle", { city: input.city, country, date: formatDate(record.createdAt, locale) })}
        </p>
        <p lang={lang} dir={contentDir} className="bg-surface-2 rounded-2xl p-4 text-sm">
          {input.idea}
        </p>
        <p className="text-ink-muted flex flex-wrap items-center gap-2 text-xs">
          {t("legend.intro")}
          <FigureBadge figure={{ value: 0, unit: "count", isEstimate: true }} />
          <FigureBadge
            figure={{
              value: 0,
              unit: "count",
              isEstimate: false,
              source: { title: t("legend.sourceExample") },
            }}
          />
        </p>
        {mode === "shared" && <p className="text-ink-muted text-sm">{t("actions.sharedNotice")}</p>}
        {!print && (
          <ReportActions
            sessionId={record.id}
            shareToken={shareToken}
            canShare={mode === "owner"}
          />
        )}
      </header>

      {/* ---- verdict + breakdown ---- */}
      <Section id="verdict" title={t("verdict.title")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
              <FigureValue figure={report.overallScore} locale={locale} className="text-5xl" />
              <span className="text-ink-muted pb-8 text-lg">{t("verdict.outOf")}</span>
            </div>
            <p
              className={`w-fit rounded-full px-3 py-1 font-semibold ${VERDICT_STYLE[report.canSell.verdict]}`}
            >
              {t(`verdict.canSell.${report.canSell.verdict}`)}
            </p>
            <p lang={lang} dir={contentDir}>
              {report.canSell.summary}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">{t("verdict.breakdown")}</h3>
            <p className="text-ink-muted text-xs">{t("verdict.breakdownNote")}</p>
            <RadarPanel breakdown={report.scoreBreakdown} locale={locale} print={print} />
          </div>
        </div>
      </Section>

      {report.keyFigures.length > 0 && (
        <Section id="figures" title={t("figures.title")}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {report.keyFigures.map((k) => (
              <li key={k.label} className="bg-surface-2 flex flex-col gap-2 rounded-2xl p-4">
                <span lang={lang} dir={contentDir} className="text-ink-muted text-sm">
                  {k.label}
                </span>
                <FigureValue figure={k.figure} locale={locale} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- how to sell / what must change ---- */}
      {(report.salesPlan || report.whatMustChange.length > 0) && (
        <Section id="plan" title={report.salesPlan ? t("plan.title") : t("plan.titleNo")}>
          <div className="grid gap-6 md:grid-cols-2" lang={lang} dir={contentDir}>
            {report.salesPlan && (
              <>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold">{t("plan.price")}</h3>
                  <FigureValue figure={report.salesPlan.price} locale={locale} />
                  {report.salesPlan.price.note && (
                    <p className="text-ink-muted text-sm">{report.salesPlan.price.note}</p>
                  )}
                  <p className="text-sm">{report.salesPlan.pricingRationale}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="mb-1 font-semibold">{t("plan.channels")}</h3>
                    <BulletList items={report.salesPlan.channels} />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{t("plan.firstCustomers")}</h3>
                    <BulletList items={report.salesPlan.firstCustomers} />
                  </div>
                </div>
              </>
            )}
            {report.whatMustChange.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="mb-1 font-semibold">{t("plan.whatMustChange")}</h3>
                <BulletList items={report.whatMustChange} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ---- sales scenarios ---- */}
      <Section
        id="scenarios"
        title={t("scenarios.title")}
        subtitle={t("scenarios.note", { currency })}
      >
        <ScenariosPanel scenarios={report.salesScenarios} locale={locale} print={print} />
      </Section>

      {/* ---- success vs failure ---- */}
      <div className="grid gap-5 md:grid-cols-2">
        <Section id="success" title={t("reasons.success")} className="border-ok/40">
          <div lang={lang} dir={contentDir}>
            <ReasonList items={report.successReasons} icon="✓" tone="text-ok" />
          </div>
        </Section>
        <Section id="failure" title={t("reasons.failure")} className="border-danger/40">
          <div lang={lang} dir={contentDir}>
            <ReasonList items={report.failureReasons} icon="✕" tone="text-danger" />
          </div>
        </Section>
      </div>

      {/* ---- marketing ---- */}
      <Section id="marketing" title={t("marketing.title")}>
        <p lang={lang} dir={contentDir} className="mb-4">
          {report.marketing.summary}
        </p>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">{t("marketing.budgetTitle")}</h3>
          <span className="text-sm">
            {t("marketing.total")}{" "}
            <FigureValue
              figure={report.marketing.totalMonthlyBudget}
              locale={locale}
              className="text-base"
            />
          </span>
        </div>
        <BudgetPanel channels={report.marketing.channels} locale={locale} print={print} />
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {[...report.marketing.channels]
            .sort((a, b) => a.priority - b.priority)
            .map((c) => (
              <li
                key={c.channel}
                className="bg-surface-2 print-avoid-break flex flex-col gap-2 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{t(`marketing.channels.${c.channel}`)}</span>
                  <span className="text-ink-muted text-xs">
                    {t("marketing.priority", { n: c.priority })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-ink-muted text-xs">{t("marketing.monthly")}</p>
                    <FigureValue figure={c.monthlyBudget} locale={locale} className="text-lg" />
                  </div>
                  {c.expectedCac && (
                    <div>
                      <p className="text-ink-muted text-xs">{t("marketing.cac")}</p>
                      <FigureValue figure={c.expectedCac} locale={locale} className="text-lg" />
                    </div>
                  )}
                </div>
                <p lang={lang} dir={contentDir} className="text-sm">
                  {c.rationale}
                </p>
              </li>
            ))}
        </ol>
      </Section>

      {/* ---- location + timing ---- */}
      <div className="grid gap-5 md:grid-cols-2">
        <Section id="location" title={t("location.title")}>
          <p className="bg-accent/15 text-accent w-fit rounded-full px-3 py-1 font-semibold">
            {t("location.recommended", { mode: tPitch(`${report.location.recommendation}.title`) })}
          </p>
          <p lang={lang} dir={contentDir} className="mt-3">
            {report.location.rationale}
          </p>
        </Section>
        <Section id="timing" title={t("timing.title")}>
          <ol className="grid grid-cols-3 gap-1" aria-label={t("timing.scale")}>
            {TIMING.map((v) => {
              const active = v === report.timing.verdict;
              return (
                <li
                  key={v}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-xl px-2 py-2 text-center text-sm font-semibold ${
                    active ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-muted"
                  }`}
                >
                  {active && <span aria-hidden>● </span>}
                  {t(`timing.${v}`)}
                </li>
              );
            })}
          </ol>
          <p lang={lang} dir={contentDir} className="mt-3">
            {report.timing.rationale}
          </p>
          <h3 className="mt-3 mb-1 text-sm font-semibold">{t("timing.signals")}</h3>
          <div lang={lang} dir={contentDir} className="text-sm">
            <BulletList items={report.timing.signals} />
          </div>
        </Section>
      </div>

      {/* ---- local context ---- */}
      <Section id="local" title={t("local.title", { city: input.city })}>
        <div className="grid gap-5 md:grid-cols-3" lang={lang} dir={contentDir}>
          <div>
            <h3 className="mb-1 font-semibold">{t("local.payments")}</h3>
            <BulletList items={report.localContext.paymentMethods} />
          </div>
          <div>
            <h3 className="mb-1 font-semibold">{t("local.platforms")}</h3>
            <BulletList items={report.localContext.platforms} />
          </div>
          <div>
            <h3 className="mb-1 font-semibold">{t("local.realities")}</h3>
            <BulletList items={report.localContext.realities} />
          </div>
        </div>
      </Section>

      {/* ---- where else ---- */}
      <Section id="global" title={t("global.title")}>
        <div data-world>
          <WorldFit
            globalFit={report.globalFit}
            numericIds={numericIds}
            names={countryNames}
            homeCountry={input.country}
            language={lang}
            print={print}
          />
        </div>
      </Section>

      {/* ---- similar ideas ---- */}
      <Section id="similar" title={t("similar.title")}>
        {report.similarIdeas.length === 0 ? (
          <p className="text-ink-muted">{t("similar.none")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {report.similarIdeas.map((s) => (
              <li
                key={s.name}
                className="bg-surface-2 print-avoid-break flex flex-col gap-1 rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      {s.name}
                    </a>
                  ) : (
                    <span className="font-semibold">{s.name}</span>
                  )}
                  {s.country && (
                    <span className="text-ink-muted text-xs">
                      {countryNames[s.country] ?? s.country}
                    </span>
                  )}
                  <span className="border-border rounded-full border px-2 py-0.5 text-[11px]">
                    {t(`similar.status.${s.status}`)}
                  </span>
                </div>
                <p lang={lang} dir={contentDir} className="text-sm">
                  {s.description}
                </p>
                {s.source && (
                  <p className="text-ink-muted text-[11px]">
                    {t("legend.source")}: {s.source.title}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ---- improvements + first steps ---- */}
      <div className="grid gap-5 md:grid-cols-2">
        <Section id="improve" title={t("improve.title")}>
          <div lang={lang} dir={contentDir}>
            <BulletList items={report.improvements} />
          </div>
        </Section>
        <Section id="steps" title={t("steps.title")}>
          <ol className="flex flex-col gap-3" lang={lang} dir={contentDir}>
            {report.nextSteps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="bg-accent text-on-accent grid size-8 shrink-0 place-items-center rounded-full font-bold">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="text-sm">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}

function ReasonList({ items, icon, tone }: { items: string[]; icon: string; tone: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className={`${tone} font-bold`}>
            {icon}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
