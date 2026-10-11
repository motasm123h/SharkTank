"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { JudgeAvatar } from "@/components/boardroom/JudgeAvatar";
import { JUDGES } from "@/domain";
import { canRender3D } from "./capability";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

/**
 * The landing-page panel. Space is reserved up front (no layout shift); the
 * 2D panel shows first and on devices that shouldn't run 3D, and the 3D scene
 * replaces it once the browser is idle.
 */
export function HeroStage() {
  const rtl = useLocale() === "ar";
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    if (!canRender3D()) return;
    const start = () => setShow3d(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(start, 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      aria-hidden
      className="border-border relative aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-3xl border bg-gradient-to-b from-[var(--surface-2)] to-[var(--bg)] sm:aspect-[16/7]"
    >
      {show3d ? (
        <HeroCanvas rtl={rtl} />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-6 sm:px-12">
          <div className="grid grid-cols-5 gap-2 sm:gap-6">
            {JUDGES.map((j) => (
              <JudgeAvatar key={j.id} judgeId={j.id} state="idle" className="h-auto w-full" />
            ))}
          </div>
          <div className="bg-table -mt-4 h-8 rounded-xl shadow-md sm:-mt-8 sm:h-10" />
        </div>
      )}
    </div>
  );
}
