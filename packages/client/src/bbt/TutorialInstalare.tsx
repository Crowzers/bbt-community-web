import { For, JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { Telefon, esteSamsung } from "./instalare";

/**
 * BBT: panoul cu pașii de instalare pe telefon, de jos în sus (cererea userului, 20 oct 2026:
 * „butonul de instalare să arate un popup tutorial pentru cum se instalează, foarte simplu").
 *
 * Apare DOAR când browserul nu ne lasă să deschidem instalarea direct (userul: „mă refer doar în
 * cazurile în care nu există instalare directă"): iPhone și iPad mereu (Apple nu dă voie nimănui),
 * Samsung Internet, Firefox, sau Chrome care încă n-a trimis `beforeinstallprompt`. Unde se poate
 * direct, `ButonInstalare` deschide fereastra browserului și panoul ăsta nu apare.
 *
 * ⚠️ În `Portal`, pe `body`. Pe telefon bara de sus stă în ecranul cu lista de canale, care e
 * mutat cu `transform` (SlideDrawer). Un `position: fixed` dinăuntru s-ar fi poziționat față de
 * ecranul ăla, nu față de telefon, și panoul ar fi glisat odată cu el.
 */

const FOAIE = "#FFFFFF";
const LINIE = "#E5E5E5";
const ROZ = "#FFB3D9";

type Pas = { iconita: () => JSX.Element; text: JSX.Element };

/** Iconița de „Partajează" din iOS: Lucide `share`. Nu e în `iconite-harta.json`. */
const Partajeaza = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" x2="12" y1="2" y2="15" />
  </svg>
);

/** Pătratul cu plus de lângă „Adaugă pe ecranul principal" în iOS: Lucide `square-plus`. */
const PatratPlus = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

/** Meniul Samsung Internet, jos în dreapta: Lucide `menu`. */
const Meniu = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const Material = (nume: string) => () => <Symbol size={22}>{nume}</Symbol>;

function pasi(telefon: Telefon): Pas[] {
  if (telefon !== "android") {
    return [
      {
        iconita: Partajeaza,
        text: (
          <>
            Apasă <b>Partajează</b>. În Safari e jos. Dacă nu-l vezi, e în
            meniul cu trei puncte.
          </>
        ),
      },
      {
        iconita: PatratPlus,
        text: (
          <>
            Alege <b>Adaugă pe ecranul principal</b>. Derulează puțin dacă nu
            apare.
          </>
        ),
      },
      {
        iconita: Material("check_circle"),
        text: (
          <>
            Apasă <b>Adaugă</b>. Community apare pe ecran, ca orice aplicație.
          </>
        ),
      },
    ];
  }
  if (esteSamsung()) {
    return [
      {
        iconita: Meniu,
        text: (
          <>
            Apasă meniul din <b>dreapta jos</b>.
          </>
        ),
      },
      {
        iconita: Material("add_circle"),
        text: (
          <>
            Alege <b>Adaugă pagina la</b>, apoi <b>Ecran de pornire</b>.
          </>
        ),
      },
      {
        iconita: Material("check_circle"),
        text: (
          <>
            Confirmă cu <b>Adăugare</b>. Community apare pe ecran.
          </>
        ),
      },
    ];
  }
  return [
    {
      iconita: Material("more_vert"),
      text: (
        <>
          Apasă cele <b>trei puncte</b> din dreapta sus.
        </>
      ),
    },
    {
      iconita: Material("download"),
      text: (
        <>
          Alege <b>Instalează aplicația</b> sau{" "}
          <b>Adaugă pe ecranul de pornire</b>.
        </>
      ),
    },
    {
      iconita: Material("check_circle"),
      text: (
        <>
          Confirmă cu <b>Instalează</b>. Community apare pe ecran.
        </>
      ),
    },
  ];
}

const NUME: Record<Telefon, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  android: "telefon",
};

export function TutorialInstalare(props: {
  telefon: Telefon;
  laInchidere: () => void;
}) {
  onMount(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && props.laInchidere();
    document.addEventListener("keydown", esc);
    onCleanup(() => document.removeEventListener("keydown", esc));
  });

  return (
    <Portal>
      <div
        onClick={() => props.laInchidere()}
        style={{
          position: "fixed",
          inset: 0,
          "z-index": 1000,
          background: "rgba(10,10,11,0.16)",
          display: "flex",
          "align-items": "flex-end",
          "justify-content": "center",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cum instalezi BBT Community"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            "max-width": "480px",
            "box-sizing": "border-box",
            padding: "10px 20px calc(20px + env(safe-area-inset-bottom, 0px))",
            "border-radius": "20px 20px 0 0",
            border: `1px solid ${LINIE}`,
            "border-bottom": "0",
            background: FOAIE,
            color: "#0A0A0B",
            "font-size": "15px",
            "line-height": "1.45",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              margin: "0 auto 16px",
              "border-radius": "2px",
              background: "#F2F2F3",
            }}
          />
          <div
            style={{
              color: "#0A0A0B",
              "font-size": "18px",
              "font-weight": 700,
            }}
          >
            Community pe {NUME[props.telefon]}
          </div>
          <p style={{ margin: "4px 0 18px", color: "#6C6C6D" }}>
            {props.telefon === "android"
              ? "Trei pași și îl ai pe ecran, cu notificări."
              : "Trei pași și îl ai pe ecran. Doar așa primești notificări pe " +
                NUME[props.telefon] +
                "."}
          </p>

          <ol
            style={{
              margin: 0,
              padding: 0,
              "list-style": "none",
              display: "flex",
              "flex-direction": "column",
              gap: "14px",
            }}
          >
            <For each={pasi(props.telefon)}>
              {(p, i) => (
                <li
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "14px",
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      width: "44px",
                      height: "44px",
                      "flex-shrink": 0,
                      "border-radius": "12px",
                      background: "#F2F2F3",
                      color: "#0A0A0B",
                    }}
                  >
                    {p.iconita()}
                    <span
                      style={{
                        position: "absolute",
                        top: "-6px",
                        left: "-6px",
                        width: "20px",
                        height: "20px",
                        "border-radius": "10px",
                        background: ROZ,
                        color: "#000",
                        "font-size": "12px",
                        "font-weight": 700,
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                      }}
                    >
                      {i() + 1}
                    </span>
                  </span>
                  <span>{p.text}</span>
                </li>
              )}
            </For>
          </ol>

          <button
            type="button"
            onClick={() => props.laInchidere()}
            style={{
              width: "100%",
              height: "48px",
              "margin-top": "22px",
              "border-radius": "999px",
              border: `1px solid #E5E5E5`,
              background: "transparent",
              color: "#0A0A0B",
              "font-family": "inherit",
              "font-size": "15px",
              "font-weight": 600,
              cursor: "pointer",
            }}
          >
            Am înțeles
          </button>
        </div>
      </div>
    </Portal>
  );
}
