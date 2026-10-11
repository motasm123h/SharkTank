"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __reportReady?: boolean;
  }
}

/**
 * Tells the PDF renderer the page is complete: fonts loaded, every chart has
 * drawn its SVG and the map has its shapes. Gotenberg waits for
 * `window.__reportReady === true`.
 */
export function PrintReady() {
  useEffect(() => {
    let stopped = false;
    const started = Date.now();
    const check = async () => {
      await document.fonts.ready;
      // Charts load lazily: wait until no placeholder is left and each has drawn.
      const pending = document.querySelector("[data-chart-pending]");
      const charts = [...document.querySelectorAll("[data-chart]")];
      const chartsDrawn = !pending && charts.every((c) => c.querySelector("svg path"));
      const mapDrawn =
        !document.querySelector("[data-world]") || !!document.querySelector("[data-map] path");
      if ((chartsDrawn && mapDrawn) || Date.now() - started > 15_000) {
        // One more frame so the last layout settles.
        requestAnimationFrame(() => (window.__reportReady = true));
        return;
      }
      if (!stopped) setTimeout(check, 100);
    };
    void check();
    return () => {
      stopped = true;
    };
  }, []);
  return null;
}
