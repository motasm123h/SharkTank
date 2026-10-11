"use client";

import { useCallback, useEffect, useState } from "react";
import { canRender3D } from "@/components/three/capability";

const KEY = "scene-mode";
export type SceneMode = "3d" | "2d";

/**
 * 3D where the device can take it (or the viewer chose it), 2D otherwise.
 * Starts as 2D so server and first client render match.
 */
export function useSceneMode() {
  const [mode, setMode] = useState<SceneMode>("2d");
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const ok = canRender3D();
    setCapable(ok);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // Storage blocked: fall back to the device default.
    }
    setMode(stored === "2d" || stored === "3d" ? (ok ? stored : "2d") : ok ? "3d" : "2d");
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => {
      const next: SceneMode = current === "3d" ? "2d" : "3d";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // The choice still applies to this visit.
      }
      return next;
    });
  }, []);

  return { mode, capable, toggle };
}
