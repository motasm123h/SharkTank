import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main id="main" className="mx-auto flex max-w-xl flex-col items-start gap-3 px-4 py-20">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-ink-muted text-lg">{t("body")}</p>
      <Link href="/" className="text-accent font-semibold underline">
        {t("home")}
      </Link>
    </main>
  );
}
