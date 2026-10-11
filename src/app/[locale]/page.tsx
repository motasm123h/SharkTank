import { getLocale, getTranslations } from "next-intl/server";
import { DbStatus } from "@/components/DbStatus";
import { checkDatabase } from "@/db";
import { Link } from "@/i18n/navigation";

// The status pill reflects the live database, so never prerender this page.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [t, locale, health] = await Promise.all([
    getTranslations("Home"),
    getLocale(),
    checkDatabase(),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-4 text-center">
      <Link
        href="/"
        locale={locale === "ar" ? "en" : "ar"}
        className="text-ink-muted hover:text-ink absolute end-4 top-4 text-sm underline-offset-4 hover:underline"
      >
        {t("switchLanguage")}
      </Link>

      <h1 className="text-accent text-5xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1>
      <p className="text-ink-muted text-lg sm:text-xl">{t("tagline")}</p>

      <button
        type="button"
        disabled
        title={t("ctaSoon")}
        className="bg-accent rounded-xl px-6 py-3 font-semibold text-black opacity-60"
      >
        {t("cta")}
      </button>

      <DbStatus health={health} />
    </main>
  );
}
