"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/** Glow on emissive parts (mics, wall strips, verdict halos) and a soft vignette. */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.85} />
      <Vignette eskil={false} offset={0.25} darkness={0.6} />
    </EffectComposer>
  );
}
