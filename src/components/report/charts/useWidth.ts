"use client";

import { useEffect, useRef, useState } from "react";

/** Measures an element's width so charts can tighten their layout on phones. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width, narrow: width > 0 && width < 480 };
}
