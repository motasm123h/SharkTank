import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportView } from "@/components/report/ReportView";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { readAnonId } from "@/lib/anon";
import { countryNamesFor, numericIdsFor } from "@/server/countries";
import { loadOwnSession, loadReport } from "@/server/sessions";
import { verifyPrintToken } from "@/server/signing";

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ print?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Report" });
  return { title: t("title"), robots: { index: false } };
}

/** The owner's report; also opened by the PDF renderer with a short-lived signed token. */
export default async function ReportPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { print } = await searchParams;
  setRequestLocale(locale);

  const printing = verifyPrintToken(id, print);
  const anonId = await readAnonId();
  const record = await loadReport(id, { anonId, trusted: printing });

  if (!record) {
    // Session exists but isn't finished: send the owner back to the boardroom.
    if (!printing && (await loadOwnSession(id, anonId))) redirect({ href: `/pitch/${id}`, locale });
    notFound();
  }

  return (
    <main id="main" className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <ReportView
        record={record}
        locale={locale}
        mode={printing ? "print" : "owner"}
        numericIds={numericIdsFor(record)}
        countryNames={countryNamesFor(record, locale)}
      />
    </main>
  );
}
