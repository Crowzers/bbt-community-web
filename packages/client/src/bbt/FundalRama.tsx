import { S1 } from "./tema";

/**
 * BBT: fundalul ramei de pe desktop și tabletă, sub bara de sus și între panouri: cerneala Klarna (S1, 4 nov 2026).
 *
 * Până pe 4 nov: banda roz cu două beanbag-uri tăiate de foaia albă (31 oct, demo-ul „A cu pastila scurtă"). Pe rama închisă,
 * panourile se despart prin culoare, fără desene între ele.
 *
 * ⚠️ `z-index: -1`, în stiva lui `AppRoot` (`isolation: isolate` în `Interface.tsx`): stă sub bară și sub panouri. Fundalul n-ar
 * putea sta în `BaraSus`: bara are `z-index: 20` pentru meniul de cont, deci ar fi trecut peste panouri.
 */
export function FundalRama() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        "z-index": -1,
        background: S1.rama,
        "pointer-events": "none",
      }}
    />
  );
}
