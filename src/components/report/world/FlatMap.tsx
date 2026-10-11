"use client";

import { memo } from "react";
import { fitColor, svgPath, type CountryFeature } from "./geo";

type Props = {
  features: CountryFeature[];
  /** numeric ISO id → fit score */
  fitById: Map<string, number>;
  homeId?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  labelFor: (id: string) => string | null;
};

/** Flat world map: the light-weight fallback for the globe, and the PDF version. */
function FlatMapView({ features, fitById, homeId, selectedId, onSelect, labelFor }: Props) {
  return (
    <svg viewBox="0 0 360 150" className="h-auto w-full" role="img" data-map>
      {features.map((f) => {
        const fit = fitById.get(f.id);
        const label = fit !== undefined ? labelFor(f.id) : null;
        const isSelected = f.id === selectedId;
        return (
          <path
            key={f.id}
            d={svgPath(f.geometry)}
            fill={fit !== undefined ? fitColor(fit) : "var(--surface-2)"}
            stroke={isSelected || f.id === homeId ? "var(--ink)" : "var(--border)"}
            strokeWidth={isSelected ? 0.8 : f.id === homeId ? 0.6 : 0.25}
            className={fit !== undefined ? "cursor-pointer" : undefined}
            onClick={fit !== undefined ? () => onSelect(f.id) : undefined}
          >
            {label && <title>{label}</title>}
          </path>
        );
      })}
    </svg>
  );
}

export const FlatMap = memo(FlatMapView);
