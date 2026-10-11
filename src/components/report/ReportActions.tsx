"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { createShareLink } from "@/app/[locale]/report/actions";
import { Link } from "@/i18n/navigation";

type Props = {
  sessionId: string;
  /** Present when viewing through a share link (the PDF is then authorized by it). */
  shareToken?: string;
  canShare: boolean;
};

export function ReportActions({ sessionId, shareToken, canShare }: Props) {
  const t = useTranslations("Report.actions");
  const locale = useLocale();
  const [pdf, setPdf] = useState<"idle" | "busy" | "error">("idle");
  const [share, setShare] = useState<{ state: "idle" | "busy" | "done" | "error"; url?: string }>({
    state: "idle",
  });

  async function downloadPdf() {
    setPdf("busy");
    try {
      const query = new URLSearchParams({ locale, ...(shareToken ? { share: shareToken } : {}) });
      const response = await fetch(`/api/reports/${sessionId}/pdf?${query}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = t("pdfFilename");
      a.click();
      URL.revokeObjectURL(url);
      setPdf("idle");
    } catch (error) {
      console.error(error);
      setPdf("error");
    }
  }

  async function copyShareLink() {
    setShare({ state: "busy" });
    const result = await createShareLink(sessionId);
    if ("error" in result) {
      setShare({ state: "error" });
      return;
    }
    const url = `${window.location.origin}/${locale}/r/${result.token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked; the link is still shown for manual copying.
    }
    setShare({ state: "done", url });
  }

  const button =
    "border-border hover:bg-surface-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60";

  return (
    <div className="no-print flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdf === "busy"}
          className="bg-accent text-on-accent hover:bg-accent-strong rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pdf === "busy" ? t("pdfPreparing") : t("pdf")}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={copyShareLink}
            disabled={share.state === "busy"}
            className={button}
          >
            {share.state === "busy" ? t("shareCreating") : t("share")}
          </button>
        )}
        {!shareToken && (
          <Link href={`/pitch/${sessionId}`} className={button}>
            {t("backToBoardroom")}
          </Link>
        )}
      </div>
      <div aria-live="polite" className="text-sm">
        {pdf === "error" && <p className="text-danger">{t("pdfError")}</p>}
        {share.state === "error" && <p className="text-danger">{t("shareError")}</p>}
        {share.state === "done" && share.url && (
          <div className="flex flex-col gap-1">
            <p className="text-ok font-medium">{t("shareCopied")}</p>
            <input
              readOnly
              value={share.url}
              dir="ltr"
              onFocus={(e) => e.currentTarget.select()}
              className="bg-bg border-border w-full rounded-lg border px-3 py-2 text-xs"
              aria-label={t("shareLinkLabel")}
            />
            <p className="text-ink-muted text-xs">{t("shareNote")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
