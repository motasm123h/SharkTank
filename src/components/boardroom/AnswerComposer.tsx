"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ANSWER_MAX_LENGTH, type Locale } from "@/domain";
import { directionOf } from "@/i18n/routing";

type Props = {
  /** Question id being answered, or null while the panel is talking. */
  questionId: string | null;
  askerName: string | null;
  language: Locale;
  onAnswer: (questionId: string, text: string) => void;
};

export function AnswerComposer({ questionId, askerName, language, onAnswer }: Props) {
  const t = useTranslations("Boardroom");
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const enabled = questionId !== null;
  const trimmed = text.trim();
  const tooLong = text.length > ANSWER_MAX_LENGTH;

  useEffect(() => {
    if (enabled) ref.current?.focus({ preventScroll: true });
  }, [enabled]);

  function submit() {
    if (!questionId || !trimmed || tooLong) return;
    onAnswer(questionId, trimmed);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="bg-surface border-border flex flex-col gap-2 rounded-2xl border p-3 sm:p-4"
    >
      <label htmlFor="answer" className="text-sm font-medium">
        {enabled && askerName ? t("answerTo", { name: askerName }) : t("listening")}
      </label>
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          id="answer"
          rows={2}
          value={text}
          disabled={!enabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          lang={language}
          dir={directionOf(language)}
          placeholder={enabled ? t("placeholder") : ""}
          aria-describedby="answer-hint"
          aria-invalid={tooLong}
          className="bg-bg border-border focus:border-focus focus:ring-focus/30 min-h-12 flex-1 resize-none rounded-xl border px-3 py-2.5 text-base outline-none focus:ring-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!enabled || !trimmed || tooLong}
          className="bg-accent text-on-accent hover:bg-accent-strong h-12 rounded-xl px-5 font-semibold transition-colors disabled:opacity-40"
        >
          {t("send")}
        </button>
      </div>
      <p id="answer-hint" className="text-ink-muted flex justify-between gap-2 text-xs">
        <span>{t("hint")}</span>
        <span dir="ltr" className={tooLong ? "text-danger" : undefined}>
          {text.length} / {ANSWER_MAX_LENGTH}
        </span>
      </p>
    </form>
  );
}
