import { JSX, createSignal, onCleanup, onMount } from "solid-js";

import { BEANBAG } from "./avatarImplicit";
import { C } from "./cont/ui";

/** Colțurile de sub antet: 32, raza suprafețelor mari din stilul 19. */
const RAZA = 32;

/** Cât lasă pagina liberă sus, sub antet, ca primul card sau cip să nu intre în colțuri. */
export const LOC_SUB_ANTET = "14px";

const LATIME = 220;
const INALTIME = (LATIME * 580) / 480;
const SUS = -60;
const DREAPTA = -40;
const ROTIRE = 14;

/**
 * BBT: antetul roz cu beanbag al celor patru tab-uri de pe telefon, copia lui `mobil/src/ui/AntetPagina.tsx`. Stă fix, iar
 * pagina albă trece pe sub el. Ecranele din interior și desktopul își păstrează antetele lor.
 *
 * Colțurile sunt întoarse: două bucăți roz care atârnă sub antet, peste pagină, ca pagina să pară rotunjită sus. Rămân pe
 * loc și la derulare. Cea din dreapta continuă și beanbag-ul: fără ea, forma s-ar tăia drept la marginea antetului.
 */
export function AntetPagina(props: {
  stil?: JSX.CSSProperties;
  children: JSX.Element;
}) {
  const [inaltime, setInaltime] = createSignal(0);
  let cap!: HTMLDivElement;

  onMount(() => {
    const observator = new ResizeObserver(() =>
      setInaltime(cap.getBoundingClientRect().height),
    );
    observator.observe(cap);
    onCleanup(() => observator.disconnect());
  });

  const dreapta = `M${RAZA} 0H0A${RAZA} ${RAZA} 0 0 1 ${RAZA} ${RAZA}Z`;
  // Unde cade beanbag-ul în desenul colțului, ca forma să curgă din antet în colț.
  const inColt = () =>
    `translate(${RAZA - DREAPTA - LATIME} ${SUS - inaltime()}) rotate(${ROTIRE} ${LATIME / 2} ${INALTIME / 2}) scale(${LATIME / 480})`;

  return (
    <div style={{ position: "relative", "z-index": 2, "flex-shrink": 0 }}>
      <div
        ref={cap}
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "calc(env(safe-area-inset-top) + 8px) 20px 12px",
          background: C.rozDeschis,
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 480 580"
          style={{
            position: "absolute",
            top: `${SUS}px`,
            right: `${DREAPTA}px`,
            width: `${LATIME}px`,
            height: `${INALTIME}px`,
            transform: `rotate(${ROTIRE}deg)`,
            "pointer-events": "none",
          }}
        >
          <path d={BEANBAG} fill={C.rozBeanbag} />
        </svg>
        {/* 40: butoanele rotunde. Fără un minim comun, antetul ar sări cu 2 px față de titlul simplu. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "min-height": "40px",
            ...props.stil,
          }}
        >
          {props.children}
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          height: 0,
          display: "flex",
          "justify-content": "space-between",
          "pointer-events": "none",
        }}
      >
        <svg width={RAZA} height={RAZA} style={{ display: "block" }}>
          <path
            d={`M0 0H${RAZA}A${RAZA} ${RAZA} 0 0 0 0 ${RAZA}Z`}
            fill={C.rozDeschis}
          />
        </svg>
        <svg width={RAZA} height={RAZA} style={{ display: "block" }}>
          <defs>
            <clipPath id="coltAntet">
              <path d={dreapta} />
            </clipPath>
          </defs>
          <path d={dreapta} fill={C.rozDeschis} />
          <g clip-path="url(#coltAntet)">
            <path d={BEANBAG} transform={inColt()} fill={C.rozBeanbag} />
          </g>
        </svg>
      </div>
    </div>
  );
}
