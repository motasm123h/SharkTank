"use client";

import type { Feature, Geometry, Position } from "geojson";
import { useEffect, useState } from "react";

export type CountryFeature = Feature<Geometry, { name: string }> & { id: string };

/** Loads world-atlas 110m country shapes on demand (~100 KB, only on the report page). */
export function useWorld(): CountryFeature[] | null {
  const [features, setFeatures] = useState<CountryFeature[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("world-atlas/countries-110m.json"), import("topojson-client")]).then(
      ([atlas, topojson]) => {
        const topology = atlas.default as unknown as Parameters<typeof topojson.feature>[0];
        const objects = (topology as unknown as { objects: { countries: unknown } }).objects;
        const collection = topojson.feature(
          topology,
          objects.countries as Parameters<typeof topojson.feature>[1],
        ) as unknown as { features: CountryFeature[] };
        if (!cancelled) setFeatures(collection.features.filter((f) => f.id !== undefined));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return features;
}

/**
 * Fit score → color on one sequential blue ramp (dataviz reference steps
 * 250–550, which keep >= 2:1 against both light and dark surfaces).
 */
export const FIT_STEPS = [
  { min: 75, color: "#1c5cab" },
  { min: 60, color: "#2a78d6" },
  { min: 40, color: "#5598e7" },
  { min: 0, color: "#86b6ef" },
] as const;

export function fitColor(fit: number): string {
  return FIT_STEPS.find((s) => fit >= s.min)?.color ?? "#86b6ef";
}

function rings(geometry: Geometry): Position[][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

/** Equirectangular SVG path; world-atlas is already cut at the antimeridian. */
export function svgPath(geometry: Geometry): string {
  return rings(geometry)
    .map(
      (ring) =>
        "M" +
        ring
          .map(([lon = 0, lat = 0]) => `${(lon + 180).toFixed(2)},${(90 - lat).toFixed(2)}`)
          .join("L") +
        "Z",
    )
    .join("");
}

/** A rough center (mean of the largest ring) to point the globe at. */
export function centroid(geometry: Geometry): { lat: number; lng: number } | null {
  const largest = rings(geometry).sort((a, b) => b.length - a.length)[0];
  if (!largest?.length) return null;
  let lng = 0;
  let lat = 0;
  for (const [x = 0, y = 0] of largest) {
    lng += x;
    lat += y;
  }
  return { lng: lng / largest.length, lat: lat / largest.length };
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
