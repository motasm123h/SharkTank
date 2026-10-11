"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, Report } from "@/domain";
import { directionOf } from "@/i18n/routing";
import { FlatMap } from "./FlatMap";
import { FIT_STEPS, fitColor, useWorld } from "./geo";

const Globe3D = dynamic(() => import("./Globe3D"), {
  ssr: false,
  loading: () => <div className="bg-surface-2 aspect-[4/3] w-full animate-pulse rounded-2xl" />,
});

type Props = {
  globalFit: Report["globalFit"];
  /** alpha-2 → numeric ISO id used by the map shapes */
  numericIds: Record<string, string>;
  /** alpha-2 → localized country name (computed on the server) */
  names: Record<string, string>;
  homeCountry: string;
  language: Locale;
  print: boolean;
};

/** Phones that can't comfortably run WebGL, or users who asked for less motion, get the flat map. */
function prefersFlatMap(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 2;
  let webgl = false;
  try {
    webgl = !!document.createElement("canvas").getContext("webgl");
  } catch {
    webgl = false;
  }
  return reducedMotion || lowEnd || !!nav.connection?.saveData || !webgl;
}

export function WorldFit({ globalFit, numericIds, names, homeCountry, language, print }: Props) {
  const t = useTranslations("Report.global");
  const features = useWorld();
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"flat" | "globe">("flat");
  const [inView, setInView] = useState(false);
  const ranked = useMemo(
    () => [...globalFit].sort((a, b) => b.fit.value - a.fit.value),
    [globalFit],
  );
  const [selected, setSelected] = useState<string | null>(ranked[0]?.country ?? null);

  // Decide once mounted; only load the globe when the section scrolls into view.
  useEffect(() => {
    if (print || prefersFlatMap()) return;
    setView("globe");
  }, [print]);
  useEffect(() => {
    const el = ref.current;
    if (!el || view !== "globe") return;
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setInView(true),
      {
        rootMargin: "200px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [view]);

  const byNumeric = useMemo(() => {
    const fit = new Map<string, number>();
    const alpha = new Map<string, string>();
    for (const g of globalFit) {
      const id = numericIds[g.country];
      if (id) {
        fit.set(id, g.fit.value);
        alpha.set(id, g.country);
      }
    }
    return { fit, alpha };
  }, [globalFit, numericIds]);

  const labelFor = (id: string) => {
    const code = byNumeric.alpha.get(id);
    const entry = code ? globalFit.find((g) => g.country === code) : undefined;
    return entry && code
      ? `${names[code] ?? code} · ${t("fitLabel", { score: entry.fit.value })} — ${entry.reason}`
      : null;
  };
  const select = (id: string) => setSelected(byNumeric.alpha.get(id) ?? null);
  const selectedEntry = globalFit.find((g) => g.country === selected);
  const mapProps = {
    features: features ?? [],
    fitById: byNumeric.fit,
    homeId: numericIds[homeCountry],
    selectedId: selected ? (numericIds[selected] ?? null) : null,
    onSelect: select,
    labelFor,
  };

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink-muted no-print text-sm">{t("hint")}</p>
        {!print && (
          <div className="no-print flex gap-1" role="group" aria-label={t("viewLabel")}>
            {(["globe", "flat"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="border-border aria-pressed:bg-surface-2 rounded-full border px-3 py-1 text-xs font-semibold"
              >
                {t(`views.${v}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div dir="ltr">
        {!features ? (
          <div
            className="bg-surface-2 aspect-[12/5] w-full animate-pulse rounded-2xl"
            aria-label={t("loading")}
          />
        ) : view === "globe" && inView ? (
          <Globe3D {...mapProps} />
        ) : (
          <FlatMap {...mapProps} />
        )}
      </div>

      {/* legend: one hue, light → dark = weaker → stronger fit */}
      <div className="text-ink-muted flex items-center gap-2 text-xs">
        <span>{t("legendLow")}</span>
        <span className="flex">
          {[...FIT_STEPS].reverse().map((s) => (
            <span
              key={s.color}
              className="h-2.5 w-8 first:rounded-s last:rounded-e"
              style={{ background: s.color }}
            />
          ))}
        </span>
        <span>{t("legendHigh")}</span>
      </div>

      {selectedEntry && !print && (
        <div className="bg-surface-2 rounded-2xl p-3" aria-live="polite">
          <p className="font-semibold">
            {names[selectedEntry.country] ?? selectedEntry.country} ·{" "}
            <span className="tabular-nums">
              {t("fitLabel", { score: selectedEntry.fit.value })}
            </span>
          </p>
          <p lang={language} dir={directionOf(language)} className="text-sm">
            {selectedEntry.reason}
          </p>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">{t("listTitle")}</h3>
        <ol className="flex flex-col gap-2">
          {ranked.map((g) => (
            <li key={g.country}>
              <button
                type="button"
                onClick={() => setSelected(g.country)}
                className="hover:bg-surface-2 flex w-full items-start gap-3 rounded-xl p-2 text-start"
              >
                <span
                  aria-hidden
                  className="mt-1.5 size-3 shrink-0 rounded-sm"
                  style={{ background: fitColor(g.fit.value) }}
                />
                <span className="flex-1">
                  <span className="font-semibold">{names[g.country] ?? g.country}</span>{" "}
                  <span className="text-ink-muted text-sm tabular-nums">
                    {t("fitLabel", { score: g.fit.value })}
                    {g.fit.isEstimate ? ` · ≈ ${t("estimate")}` : ""}
                  </span>
                  <span lang={language} dir={directionOf(language)} className="block text-sm">
                    {g.reason}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
