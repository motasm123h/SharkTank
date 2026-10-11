"use client";

export type Quality = "high" | "low";

/**
 * Whether this device should get the 3D scenes at all. Phones that would
 * struggle, people who asked for less motion, data-saver mode and browsers
 * without WebGL2 keep the 2D versions.
 */
export function canRender3D(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 3) return false;
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/** Post-processing and soft shadows only where there is headroom. */
export function initialQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touch = window.matchMedia("(pointer: coarse)").matches;
  return touch || (nav.hardwareConcurrency ?? 8) < 6 || (nav.deviceMemory ?? 8) < 6
    ? "low"
    : "high";
}

/** Reads a design token so 3D colors follow the light/dark theme. */
export function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
