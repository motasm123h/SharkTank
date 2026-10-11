import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportView } from "@/components/report/ReportView";
import type { Locale } from "@/i18n/routing";
import { countryNamesFor, numericIdsFor } from "@/server/countries";
import { loadSharedReport } from "@/server/sessions";

type Props = { params: Promise<{ locale: Locale; token: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Report" });
  return { title: t("title"), robots: { index: false } };
}

/** A report opened through its public share link (read-only). */
export default async function SharedReportPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const record = await loadSharedReport(token);
  if (!record) notFound();

  return (
    <main id="main" className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <ReportView
        record={record}
        locale={locale}
        mode="shared"
        shareToken={token}
        numericIds={numericIdsFor(record)}
        countryNames={countryNamesFor(record, locale)}
      />
    </main>
  );
}
