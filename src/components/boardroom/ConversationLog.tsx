import { useTranslations } from "next-intl";
import { JUDGES, type JudgeId, type Locale } from "@/domain";
import { directionOf } from "@/i18n/routing";
import type { HistoryItem } from "./sceneState";
import { STANCE_STYLE } from "./stance";

const COLOR = Object.fromEntries(JUDGES.map((j) => [j.id, j.color])) as Record<JudgeId, string>;

/** Everything said so far, as text: useful on small screens and for screen readers. */
export function ConversationLog({ items, language }: { items: HistoryItem[]; language: Locale }) {
  const t = useTranslations("Boardroom");
  const tj = useTranslations("Judges");

  return (
    <details className="bg-surface border-border rounded-2xl border p-4">
      <summary className="cursor-pointer font-medium">{t("conversation")}</summary>
      <ol className="mt-3 flex flex-col gap-2" lang={language} dir={directionOf(language)}>
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            {item.type === "answer" ? (
              <span className="font-semibold">{t("you")}:</span>
            ) : (
              <span className="font-semibold" style={{ color: COLOR[item.judgeId] }}>
                {tj(`${item.judgeId}.name`)}
                {item.type === "debate" && item.replyTo && (
                  <span className={STANCE_STYLE[item.stance].text}>
                    {" "}
                    {t(`replyStance.${item.stance}`)} {tj(`${item.replyTo.judgeId}.name`)}
                  </span>
                )}
                {item.type === "verdict" && (
                  <span className={item.decision === "in" ? "text-ok" : "text-danger"}>
                    {" "}
                    ({item.decision === "in" ? t("in") : t("out")})
                  </span>
                )}
                :
              </span>
            )}{" "}
            {item.text}
          </li>
        ))}
      </ol>
    </details>
  );
}
