import { getTranslations } from "next-intl/server";
import type { DbHealth } from "@/db";

export async function DbStatus({ health }: { health: DbHealth }) {
  const t = await getTranslations("Status");

  return (
    <p
      role="status"
      aria-label={t("label")}
      className="bg-surface-raised text-ink-muted inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
    >
      <span aria-hidden className={`size-2 rounded-full ${health.ok ? "bg-ok" : "bg-danger"}`} />
      {health.ok ? t("dbOk", { latency: health.latencyMs }) : t("dbDown")}
    </p>
  );
}
