"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { centroid, escapeHtml, fitColor, type CountryFeature } from "./geo";

type Props = {
  features: CountryFeature[];
  fitById: Map<string, number>;
  homeId?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Plain text shown on hover; escaped before it reaches the HTML label. */
  labelFor: (id: string) => string | null;
};

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Interactive 3D globe (loaded lazily; WebGL). */
export default function Globe3D({
  features,
  fitById,
  homeId,
  selectedId,
  onSelect,
  labelFor,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [width, setWidth] = useState(0);
  const [colors] = useState(() => ({
    land: cssVar("--border", "#283250"),
    border: cssVar("--surface", "#131a2a"),
    ocean: cssVar("--surface", "#131a2a"),
    ink: cssVar("--ink", "#f3f5fa"),
  }));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ocean color, starting view on the user's country, gentle rotation.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || width === 0) return;
    // globe.gl exposes its material at runtime; the React typings don't list it.
    const withMaterial = globe as unknown as {
      globeMaterial?: () => { color?: { set: (c: string) => void } };
    };
    withMaterial.globeMaterial?.().color?.set(colors.ocean);
    const home = features.find((f) => f.id === homeId);
    const center = home ? centroid(home.geometry) : null;
    if (center) globe.pointOfView({ ...center, altitude: 2.1 }, 0);
    const controls = globe.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
    };
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.4;
  }, [width, features, homeId, colors.ocean]);

  // Fly to a country when it is picked (from the globe or the ranked list).
  const firstSelection = useRef(true);
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) return;
    if (firstSelection.current) {
      firstSelection.current = false;
      return;
    }
    const target = features.find((f) => f.id === selectedId);
    const center = target ? centroid(target.geometry) : null;
    if (!center) return;
    const controls = globe.controls() as unknown as { autoRotate: boolean };
    controls.autoRotate = false;
    globe.pointOfView({ ...center, altitude: 1.7 }, 1400);
  }, [selectedId, features]);

  // Arcs from the user's country to every good-fit country, and a pulse at home.
  const { arcs, rings } = useMemo(() => {
    const home = features.find((f) => f.id === homeId);
    const start = home ? centroid(home.geometry) : null;
    if (!start) return { arcs: [], rings: [] };
    const arcs = features.flatMap((f) => {
      const fit = fitById.get(f.id);
      const end = fit !== undefined && f.id !== homeId ? centroid(f.geometry) : null;
      return end
        ? [
            {
              startLat: start.lat,
              startLng: start.lng,
              endLat: end.lat,
              endLng: end.lng,
              color: fitColor(fit!),
            },
          ]
        : [];
    });
    return { arcs, rings: [start] };
  }, [features, fitById, homeId]);

  const height = Math.min(420, Math.max(280, width * 0.8));

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-2xl" style={{ height }}>
      {width > 0 && (
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor={colors.border}
          atmosphereAltitude={0.12}
          polygonsData={features}
          polygonCapColor={(f) => {
            const fit = fitById.get((f as CountryFeature).id);
            return fit !== undefined ? fitColor(fit) : colors.land;
          }}
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={(f) =>
            (f as CountryFeature).id === selectedId || (f as CountryFeature).id === homeId
              ? colors.ink
              : colors.border
          }
          polygonAltitude={(f) => {
            const id = (f as CountryFeature).id;
            if (id === selectedId) return 0.06;
            return fitById.has(id) ? 0.025 : 0.006;
          }}
          polygonLabel={(f) => {
            const label = labelFor((f as CountryFeature).id);
            return label
              ? `<div style="max-width:240px;padding:6px 10px;border-radius:10px;background:rgba(17,23,39,.92);color:#fff;font:13px/1.4 system-ui">${escapeHtml(label)}</div>`
              : "";
          }}
          onPolygonClick={(f) => {
            const id = (f as CountryFeature).id;
            if (fitById.has(id)) onSelect(id);
          }}
          polygonsTransitionDuration={200}
          arcsData={arcs}
          arcColor={(a: object) => [colors.ink, (a as { color: string }).color]}
          arcStroke={0.6}
          arcAltitudeAutoScale={0.45}
          arcDashLength={0.45}
          arcDashGap={0.25}
          arcDashAnimateTime={2600}
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t: number) => `rgba(245,182,66,${1 - t})`}
          ringMaxRadius={6}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1100}
        />
      )}
    </div>
  );
}
