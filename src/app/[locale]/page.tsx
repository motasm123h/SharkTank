import { getTranslations, setRequestLocale } from "next-intl/server";
import { JudgeCard } from "@/components/judges/JudgeCard";
import { JUDGES } from "@/domain";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const STEPS = ["pitch", "qa", "debate", "report"] as const;

type Props = { params: Promise<{ locale: Locale }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 pb-20">
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <p className="text-accent text-sm font-semibold tracking-wide uppercase">{t("eyebrow")}</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          {t("title")}
        </h1>
        <p className="text-ink-muted max-w-2xl text-lg text-pretty sm:text-xl">{t("tagline")}</p>
        <Link
          href="/pitch"
          className="bg-accent text-on-accent hover:bg-accent-strong rounded-xl px-7 py-3.5 text-lg font-semibold shadow-sm transition-colors"
        >
          {t("cta")}
        </Link>
        <p className="text-ink-muted text-sm">{t("honesty")}</p>
      </section>

      <section aria-labelledby="panel-title" className="py-10">
        <h2 id="panel-title" className="text-2xl font-bold sm:text-3xl">
          {t("panelTitle")}
        </h2>
        <p className="text-ink-muted mt-2">{t("panelIntro")}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-5">
          {JUDGES.map((judge) => (
            <JudgeCard key={judge.id} judge={judge} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-title" className="py-10">
        <h2 id="how-title" className="text-2xl font-bold sm:text-3xl">
          {t("howTitle")}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step} className="bg-surface border-border rounded-2xl border p-5">
              <span className="bg-accent text-on-accent grid size-8 place-items-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{t(`steps.${step}.title`)}</h3>
              <p className="text-ink-muted mt-1 text-sm">{t(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface-2 mt-10 rounded-3xl p-6 sm:p-10">
        <h2 className="text-2xl font-bold">{t("localTitle")}</h2>
        <p className="text-ink-muted mt-3 max-w-3xl text-lg">{t("localBody")}</p>
      </section>
    </main>
  );
}
