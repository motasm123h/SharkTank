import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header
      id="site-header"
      className="border-border/60 bg-bg/80 sticky top-0 z-30 border-b backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={t("Nav.home")} className="flex items-center gap-2 rounded-lg">
          <Logo className="size-8" />
          <span className="text-lg font-bold">{t("Meta.title")}</span>
        </Link>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
