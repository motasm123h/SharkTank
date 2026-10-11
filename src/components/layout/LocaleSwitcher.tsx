"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={other}
      lang={other}
      aria-label={t("switchLanguageLabel")}
      className="text-ink-muted hover:bg-surface-2 hover:text-ink rounded-full px-3 py-2 text-sm font-medium transition-colors"
    >
      {t("switchLanguage")}
    </Link>
  );
}
