"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm, type DefaultValues, type FieldError } from "react-hook-form";
import { createPitch, type CreatePitchResult } from "@/app/[locale]/pitch/actions";
import {
  IDEA_MAX_LENGTH,
  PitchInputSchema,
  type BusinessMode,
  type Locale,
  type PitchInput,
  type Stage,
} from "@/domain";
import { defaultCurrencyFor, type Option } from "@/lib/countries";
import { parseLocalizedNumber } from "@/lib/numbers";
import { ChoiceGroup } from "./ChoiceGroup";
import { errorKeyFor, type FormField } from "./errors";
import { Field, describedBy, inputClass } from "./Field";

export type DemoOption = { id: string; label: string; input: Omit<PitchInput, "language"> };

type Props = {
  locale: Locale;
  countries: Option[];
  currencies: Option[];
  /** Demo scenarios; empty when a real AI provider is configured. */
  demos: DemoOption[];
};

const MODES: BusinessMode[] = ["online", "physical", "hybrid"];
const STAGES: Stage[] = ["idea", "prototype", "selling"];

export function PitchForm({ locale, countries, currencies, demos }: Props) {
  const t = useTranslations("Pitch");
  const [demoId, setDemoId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<CreatePitchResult["error"] | null>(null);
  const [pending, startTransition] = useTransition();

  const emptyValues: DefaultValues<PitchInput> = {
    idea: "",
    country: "",
    city: "",
    budget: { min: undefined, max: undefined, currency: "USD" },
    mode: undefined,
    stage: undefined,
    language: locale,
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getFieldState,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<PitchInput>({
    resolver: zodResolver(PitchInputSchema),
    defaultValues: emptyValues,
    mode: "onTouched",
  });

  const ideaLength = watch("idea")?.length ?? 0;
  const demo = demos.find((d) => d.id === demoId);

  const fieldErrors: [FormField, FieldError | undefined][] = [
    ["idea", errors.idea],
    ["country", errors.country],
    ["city", errors.city],
    ["budget.min", errors.budget?.min],
    ["budget.max", errors.budget?.max],
    ["mode", errors.mode],
    ["stage", errors.stage],
    ["language", errors.language],
  ];
  const messages = Object.fromEntries(
    fieldErrors.map(([field, error]) => {
      if (!error) return [field, undefined];
      const { key, values } = errorKeyFor(field, error);
      return [field, t(`errors.${key}`, values)];
    }),
  ) as Partial<Record<FormField, string>>;
  const hasErrors = fieldErrors.some(([, error]) => error);

  function pickDemo(option: DemoOption) {
    setDemoId(option.id);
    reset({ ...option.input, language: locale });
  }

  function clearDemo() {
    setDemoId(null);
    reset(emptyValues);
  }

  const onSubmit = handleSubmit((input) => {
    setServerError(null);
    startTransition(async () => {
      // On success the action redirects to the saved session.
      const result = await createPitch({ input, scenarioId: demoId ?? undefined });
      if (result && !result.ok) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      {demos.length > 0 && (
        <section
          aria-labelledby="demo-title"
          className="border-accent/40 bg-accent/5 rounded-2xl border border-dashed p-4"
        >
          <h2 id="demo-title" className="font-semibold">
            {t("demo.title")}
          </h2>
          <p className="text-ink-muted mt-1 text-sm">{t("demo.body")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demos.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => pickDemo(option)}
                aria-pressed={demoId === option.id}
                className="bg-surface border-border hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent/15 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
          {demo && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span>{t("demo.selected", { name: demo.label })}</span>
              <button
                type="button"
                onClick={clearDemo}
                className="text-accent font-medium underline"
              >
                {t("demo.clear")}
              </button>
            </p>
          )}
        </section>
      )}

      <Field
        id="idea"
        label={t("fields.idea.label")}
        hint={t("fields.idea.hint")}
        error={messages.idea}
        aside={
          <span
            dir="ltr"
            className={`text-sm tabular-nums ${ideaLength > IDEA_MAX_LENGTH ? "text-danger" : "text-ink-muted"}`}
          >
            {t("fields.idea.counter", { count: ideaLength, max: IDEA_MAX_LENGTH })}
          </span>
        }
      >
        <textarea
          id="idea"
          rows={5}
          placeholder={t("fields.idea.placeholder")}
          aria-invalid={!!errors.idea}
          aria-describedby={describedBy("idea", { hint: true, error: !!errors.idea })}
          className={`${inputClass} resize-y`}
          {...register("idea")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="country" label={t("fields.country.label")} error={messages.country}>
          <select
            id="country"
            autoComplete="country"
            aria-invalid={!!errors.country}
            aria-describedby={describedBy("country", { error: !!errors.country })}
            className={inputClass}
            {...register("country", {
              onChange: (event: { target: { value: string } }) => {
                if (!getFieldState("budget.currency").isDirty) {
                  setValue("budget.currency", defaultCurrencyFor(event.target.value));
                }
              },
            })}
          >
            <option value="">{t("fields.country.placeholder")}</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="city" label={t("fields.city.label")} error={messages.city}>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            placeholder={t("fields.city.placeholder")}
            aria-invalid={!!errors.city}
            aria-describedby={describedBy("city", { error: !!errors.city })}
            className={inputClass}
            {...register("city")}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">{t("fields.budget.label")}</legend>
        <p id="budget-hint" className="text-ink-muted text-sm">
          {t("fields.budget.hint")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
          <Field id="budget-min" label={t("fields.budget.min")} error={messages["budget.min"]}>
            <input
              id="budget-min"
              type="text"
              inputMode="decimal"
              dir="ltr"
              aria-invalid={!!errors.budget?.min}
              aria-describedby={describedBy("budget-min", { error: !!errors.budget?.min })}
              className={`${inputClass} text-start tabular-nums`}
              {...register("budget.min", { setValueAs: parseLocalizedNumber })}
            />
          </Field>
          <Field id="budget-max" label={t("fields.budget.max")} error={messages["budget.max"]}>
            <input
              id="budget-max"
              type="text"
              inputMode="decimal"
              dir="ltr"
              aria-invalid={!!errors.budget?.max}
              aria-describedby={describedBy("budget-max", { error: !!errors.budget?.max })}
              className={`${inputClass} text-start tabular-nums`}
              {...register("budget.max", { setValueAs: parseLocalizedNumber })}
            />
          </Field>
          <div className="col-span-2 sm:col-span-1">
            <Field id="budget-currency" label={t("fields.budget.currency")}>
              <select id="budget-currency" className={inputClass} {...register("budget.currency")}>
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </fieldset>

      <ChoiceGroup
        name="mode"
        legend={t("fields.mode.label")}
        registration={register("mode")}
        error={messages.mode}
        choices={MODES.map((mode) => ({
          value: mode,
          title: t(`fields.mode.${mode}.title`),
          body: t(`fields.mode.${mode}.body`),
        }))}
      />

      <ChoiceGroup
        name="stage"
        legend={t("fields.stage.label")}
        registration={register("stage")}
        error={messages.stage}
        choices={STAGES.map((stage) => ({
          value: stage,
          title: t(`fields.stage.${stage}.title`),
          body: t(`fields.stage.${stage}.body`),
        }))}
      />

      <ChoiceGroup
        name="language"
        legend={t("fields.language.label")}
        registration={register("language")}
        error={messages.language}
        choices={(["ar", "en"] as const).map((lang) => ({
          value: lang,
          title: t(`fields.language.${lang}`),
          lang,
        }))}
      />

      <div className="flex flex-col gap-3">
        {isSubmitted && hasErrors && (
          <p role="alert" className="text-danger font-medium">
            {t("errors.summary")}
          </p>
        )}
        {serverError && (
          <p role="alert" className="text-danger font-medium">
            {t(`errors.${serverError}`)}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-accent text-on-accent hover:bg-accent-strong rounded-xl px-6 py-4 text-lg font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 sm:self-start"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
