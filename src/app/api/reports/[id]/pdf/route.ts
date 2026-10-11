import { routing } from "@/i18n/routing";
import { readAnonId } from "@/lib/anon";
import { env } from "@/lib/env";
import { loadReport, loadSharedReport } from "@/server/sessions";
import { signPrintToken } from "@/server/signing";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Renders the report to PDF with Gotenberg (headless Chromium). Gotenberg opens
 * the normal report page through a short-lived signed URL and waits until the
 * page sets `window.__reportReady`.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale = routing.locales.find((l) => l === localeParam) ?? routing.defaultLocale;
  const share = url.searchParams.get("share");

  const record = share
    ? await loadSharedReport(share)
    : await loadReport(id, { anonId: await readAnonId() });
  if (!record || record.id !== id) return Response.json({ error: "not_found" }, { status: 404 });

  const { GOTENBERG_URL, INTERNAL_APP_URL } = env();
  const target = `${INTERNAL_APP_URL}/${locale}/report/${id}?print=${encodeURIComponent(signPrintToken(id))}`;

  const form = new FormData();
  form.append("url", target);
  form.append("waitForExpression", "window.__reportReady === true");
  form.append("emulatedMediaType", "print");
  form.append("printBackground", "true");
  form.append("preferCssPageSize", "true");

  let pdf: Response;
  try {
    pdf = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/url`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    console.error("PDF renderer unreachable", error);
    return Response.json({ error: "pdf_unavailable" }, { status: 503 });
  }
  if (!pdf.ok || !pdf.body) {
    console.error("PDF rendering failed", pdf.status, await pdf.text().catch(() => ""));
    return Response.json({ error: "pdf_failed" }, { status: 502 });
  }

  return new Response(pdf.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="the-panel-report-${id.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
