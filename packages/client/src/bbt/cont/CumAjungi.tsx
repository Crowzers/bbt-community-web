import { For, JSX, Show, createSignal, onCleanup, onMount } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import type { LinkuriNavigare } from "./tipuri";
import { C, Fereastra } from "./ui";

/**
 * BBT: „Cum ajungi” (22 nov 2026), navigarea spre tabără în Google Maps, Waze sau Apple Maps, ca pe site
 * (`website/src/components/CumAjungi.tsx`) și în aplicație (`mobil/src/app/experienta.tsx`). Linkurile vin gata făcute de
 * admin (`lib/reguli/navigare.ts`), ca toate trei să ducă în același loc; hub-ul doar le arată. Fără `navigare` (tabără
 * fără adresă, comandă neplătită, workshop), locația rămâne text simplu.
 *
 * Apple Maps apare doar pe iPhone, iPad și Mac: pe Android sau Windows linkul ar deschide o pagină web, nu o aplicație.
 * `Macintosh` prinde și iPad-ul care se dă drept Mac (vezi `sistemTelefon` din `instalare.ts`).
 */
function optiuni(n: LinkuriNavigare) {
  const apple =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  return [
    { cheie: "google", href: n.google, text: "Google Maps" },
    { cheie: "waze", href: n.waze, text: "Waze" },
    ...(apple ? [{ cheie: "apple", href: n.apple, text: "Apple Maps" }] : []),
  ];
}

/** Rândurile cu cele trei hărți. Linkuri adevărate, nu `window.open`: țin apăsat = copiază linkul, ca pe site. */
function ListaNavigare(props: {
  navigare: LinkuriNavigare;
  laAlegere: () => void;
  mare?: boolean;
}) {
  return (
    <For each={optiuni(props.navigare)}>
      {(o) => (
        <a
          role="menuitem"
          href={o.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => props.laAlegere()}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "10px",
            padding: props.mare ? "14px 12px" : "10px 12px",
            "border-radius": "12px",
            color: C.text,
            "font-size": "16px",
            "font-weight": 600,
            "text-decoration": "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.foaie)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span style={{ display: "flex", color: C.stins }}>
            <Symbol size={18}>near_me</Symbol>
          </span>
          {o.text}
        </a>
      )}
    </For>
  );
}

/**
 * Pe desktop și tabletă: locația din cardul experienței devine apăsabilă (pin, subliniere punctată, ca pe site) și
 * deschide o listă mică sub ea. Clicul în afară sau Escape o închid.
 */
export function LocatieCumAjungi(props: {
  navigare?: LinkuriNavigare | null;
  eticheta: string;
}) {
  const [deschis, setDeschis] = createSignal(false);
  let cutie: HTMLSpanElement | undefined;

  onMount(() => {
    const afara = (e: PointerEvent) => {
      if (cutie && !cutie.contains(e.target as Node)) setDeschis(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setDeschis(false);
    document.addEventListener("pointerdown", afara);
    document.addEventListener("keydown", esc);
    onCleanup(() => {
      document.removeEventListener("pointerdown", afara);
      document.removeEventListener("keydown", esc);
    });
  });

  return (
    <Show when={props.navigare} fallback={props.eticheta}>
      {(n) => (
        // Totul în `span`: locația stă într-un `<p>`, iar un `div` acolo ar fi HTML invalid.
        <span
          ref={cutie}
          style={{ position: "relative", display: "inline-flex" }}
        >
          <button
            type="button"
            onClick={() => setDeschis((v) => !v)}
            aria-expanded={deschis()}
            aria-haspopup="menu"
            aria-label={`Cum ajungi la ${props.eticheta}`}
            style={{
              display: "inline-flex",
              "align-items": "center",
              gap: "3px",
              padding: 0,
              border: 0,
              background: "transparent",
              color: C.text,
              "font-family": "inherit",
              "font-size": "inherit",
              "font-weight": 600,
              "text-decoration": "underline dotted",
              "text-underline-offset": "4px",
              cursor: "pointer",
            }}
          >
            <Symbol size={15}>location_on</Symbol>
            {props.eticheta}
          </button>
          <Show when={deschis()}>
            <span
              role="menu"
              style={{
                position: "absolute",
                left: 0,
                top: "calc(100% + 6px)",
                "z-index": 20,
                display: "block",
                "min-width": "220px",
                padding: "6px",
                "border-radius": "16px",
                border: `1px solid ${C.linie}`,
                background: C.fundal,
                "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
              }}
            >
              <span style={ETICHETA}>Cum ajungi</span>
              <ListaNavigare
                navigare={n()}
                laAlegere={() => setDeschis(false)}
              />
            </span>
          </Show>
        </span>
      )}
    </Show>
  );
}

/**
 * Pe telefon: alegerea hărții în fereastra contului, deschisă din rândul „Cum ajungi” al detaliului. Aplicația folosește
 * foaia nativă a sistemului; în browser cel mai aproape e fereastra pe care o au deja plata și QR-ul.
 */
export function FereastraCumAjungi(props: {
  navigare: LinkuriNavigare;
  laInchidere: () => void;
}) {
  return (
    <Fereastra titlu="Cum ajungi" laInchidere={props.laInchidere} latime={380}>
      <div role="menu" style={{ display: "flex", "flex-direction": "column" }}>
        <ListaNavigare
          navigare={props.navigare}
          laAlegere={props.laInchidere}
          mare
        />
      </div>
    </Fereastra>
  );
}

const ETICHETA: JSX.CSSProperties = {
  display: "block",
  padding: "8px 12px 6px",
  color: C.stins,
  "font-size": "12px",
  "font-weight": 700,
  "letter-spacing": "0.15em",
  "text-transform": "uppercase",
};
