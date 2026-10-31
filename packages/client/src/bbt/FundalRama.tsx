import { BEANBAG } from "./avatarImplicit";
import { C } from "./cont/ui";

/** Proporția din `viewBox`, ca în `AntetPagina.tsx`. */
const LATIME = 330;
const INALTIME = (LATIME * 580) / 480;

/**
 * BBT: fundalul roz de pe desktop și tabletă: banda de sus și coloana pastilei, cu cele două beanbag-uri tăiate de foaia albă
 * (cererea userului, 31 oct 2026, demo-ul „A cu pastila scurtă"). Aceleași culori ca antetul din aplicație.
 *
 * ⚠️ `z-index: -1`, în stiva lui `AppRoot` (`isolation: isolate` în `Interface.tsx`): stă sub bară și sub foaie. Forma n-ar
 * putea sta în `BaraSus`: bara are `z-index: 20` pentru meniul de cont, deci ar fi trecut peste foaie.
 */
export function FundalRama() {
  const forma = (loc: { top?: string; bottom?: string; left?: string; right?: string }) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 580"
      style={{
        position: "absolute",
        ...loc,
        width: `${LATIME}px`,
        height: `${INALTIME}px`,
        transform: "rotate(14deg)",
      }}
    >
      <path d={BEANBAG} fill={C.rozBeanbag} />
    </svg>
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        "z-index": -1,
        overflow: "hidden",
        background: C.rozDeschis,
        "pointer-events": "none",
      }}
    >
      {forma({ top: "-92px", right: "120px" })}
      {forma({ bottom: "-120px", left: "-130px" })}
    </div>
  );
}
