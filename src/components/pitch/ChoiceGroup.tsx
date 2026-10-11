import type { UseFormRegisterReturn } from "react-hook-form";

type Choice = { value: string; title: string; body?: string; lang?: string };

type Props = {
  name: string;
  legend: string;
  choices: Choice[];
  registration: UseFormRegisterReturn;
  error?: string;
};

/** A row of large radio cards. Native radios, so keyboard and screen readers work as usual. */
export function ChoiceGroup({ name, legend, choices, registration, error }: Props) {
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className="mb-1.5 font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className="bg-surface border-border has-checked:border-accent has-checked:bg-accent/10 has-focus-visible:ring-focus/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-focus-visible:ring-2"
          >
            <input
              type="radio"
              value={choice.value}
              {...registration}
              className="accent-accent mt-1 size-4 shrink-0"
            />
            <span>
              <span className="block font-medium" lang={choice.lang}>
                {choice.title}
              </span>
              {choice.body && <span className="text-ink-muted block text-sm">{choice.body}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
    </fieldset>
  );
}
