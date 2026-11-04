import { Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";
import { ButonInstalare } from "./ButonInstalare";
import { CautareSus, Clopotel } from "./CautareSiAlerte";
import { useSalut } from "./cont/date";
import { textMembri, useNumarMembri } from "./numarMembri";
import { LATIME_RAIL } from "./rail";
import { UN_RAND } from "./telefon";
import { S1 } from "./tema";

/**
 * Bara de sus a BBT Community, pe desktop și tabletă. Pe telefon nu există: ecranele sunt ale aplicației.
 *
 * S1 (4 nov 2026, `website/docs/plans/2026-11-04-community-ca-slack-discord-studiu.md` deciziile 8 și 10): 56 de înălțime, pe
 * cerneala ramei. Logoul alb deasupra barei din stânga, apoi „Hei, {nume}!" în Inter cu rândul de membri dedesubt, căutarea
 * de 420 în centru, iar clopoțelul și „Instalează" în dreapta, toate de 36.
 *
 * Până pe 4 nov: banda roz din 25e, de 88, cu salutul de 26 în De Fonte și butoanele albe de 48. Pe o unealtă cu multă lume,
 * salutul mare și butoanele mari mâncau loc conversației; salutul a rămas, mic, în colț (cererea userului: „în loc de BBT
 * Community să scrie Hei, numele lui").
 *
 * Căutarea (în canalul deschis) și clopoțelul (mențiuni + mesaje directe necitite): `CautareSiAlerte.tsx`. Butonul de instalare
 * pe calculator: `ButonInstalare.tsx`.
 */

export function BaraSus() {
  const client = useClient();
  const navigate = useNavigate();

  const salut = useSalut();
  const numar = useNumarMembri(() => client().servers.toList()[0]);

  function apasaLogo() {
    const s = client().servers.toList()[0];
    if (s) navigate(`/server/${s.id}`);
  }

  return (
    <header
      class="bbt-bara-sus"
      style={{
        height: "var(--bbt-banda)",
        "flex-shrink": 0,
        // Deasupra conținutului: lista clopoțelului și pașii de instalare cad peste mesaje.
        position: "relative",
        "z-index": 20,
        display: "grid",
        "grid-template-columns": `${LATIME_RAIL} minmax(0, 1fr)`,
        "column-gap": "var(--bbt-margine)",
        "align-items": "center",
        // BBT: în aplicația instalată, cu bara de titlu a Windows-ului ascunsă (săgeata din ea,
        // `display_override: window-controls-overlay` din `vite.config.ts`), bara asta ține loc de
        // bară de titlu, iar butoanele native (minimizare, mărire, închidere) stau PESTE colțul ei din
        // dreapta (pe Mac, semafoarele în stânga). Fără spațiul de mai jos, butoanele noastre intrau sub
        // ele (bug raportat de user, 20 oct 2026). Butoanele native nu pot fi scoase dintr-un PWA.
        // `titlebar-area-*` există doar cât bara de titlu e ascunsă; altfel valorile de rezervă dau 0.
        "padding-left": "var(--bbt-margine)",
        "padding-right":
          "calc(var(--bbt-margine) + 100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))",
        // Golurile barei mută fereastra, ca o bară de titlu (dublu clic = mărire). Ce se apasă e
        // `no-drag` mai jos: în zona de tras, Windows nu mai trimite clicuri și nici hover.
        "-webkit-app-region": "drag",
        "-webkit-user-select": "none",
        background: "transparent",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "min-width": 0,
        }}
      >
        <button
          type="button"
          aria-label="BBT, înapoi în comunitate"
          onClick={apasaLogo}
          style={{
            display: "flex",
            "flex-shrink": 0,
            "align-items": "center",
            padding: 0,
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
            "-webkit-app-region": "no-drag",
          }}
        >
          <Wordmark
            aria-label="BBT"
            style={{ width: "34px", height: "auto", color: "#FFFFFF" }}
          />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          "grid-template-columns": "220px minmax(0, 1fr) 220px",
          "column-gap": "var(--bbt-margine)",
          "align-items": "center",
          "min-width": 0,
        }}
      >
        <div style={{ "min-width": 0, "padding-left": "4px" }}>
          <h1
            style={{
              ...UN_RAND,
              margin: 0,
              "font-family": "Inter, system-ui, sans-serif",
              "font-size": "15px",
              "line-height": "20px",
              "font-weight": 700,
              "letter-spacing": 0,
              color: "#FFFFFF",
            }}
          >
            {salut() ? `Hei, ${salut()}!` : "Hei!"}
          </h1>
          <Show when={numar().total > 0}>
            <div
              style={{
                ...UN_RAND,
                "font-size": "13px",
                "line-height": "18px",
                "font-weight": 500,
                color: S1.stins,
              }}
            >
              {textMembri(numar())}
            </div>
          </Show>
        </div>

        {/* BBT: căutarea în canal, clopoțelul și instalarea (pânza TRW) — src/bbt/CautareSiAlerte.tsx. */}
        <div
          style={{
            display: "flex",
            "justify-content": "center",
            "min-width": 0,
            "-webkit-app-region": "no-drag",
          }}
        >
          <CautareSus />
        </div>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "flex-end",
            gap: "10px",
            "-webkit-app-region": "no-drag",
          }}
        >
          <Clopotel />
          {/* BBT: „Instalează". Se ascunde singur în rest. */}
          <ButonInstalare />
        </div>
      </div>
    </header>
  );
}
