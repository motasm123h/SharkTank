import { getTranslations } from "next-intl/server";
import type { Judge } from "@/domain";
import { JudgeIcon } from "./JudgeIcon";

export async function JudgeCard({ judge }: { judge: Judge }) {
  const t = await getTranslations("Judges");

  return (
    <li
      className="bg-surface border-border flex gap-4 rounded-2xl border p-4 sm:flex-col"
      style={{ borderTopColor: judge.color, borderTopWidth: 4 }}
    >
      <span
        className="grid size-12 shrink-0 place-items-center rounded-full text-[#111727]"
        style={{ backgroundColor: judge.color }}
      >
        <JudgeIcon judgeId={judge.id} className="size-6" />
      </span>
      <div>
        <h3 className="font-semibold">{t(`${judge.id}.name`)}</h3>
        <p className="text-ink-muted mt-1 text-sm">{t(`${judge.id}.focus`)}</p>
      </div>
    </li>
  );
}
