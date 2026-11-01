import { Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";
import { ButonInstalare } from "./ButonInstalare";
import { CautareSus, Clopotel } from "./CautareSiAlerte";
import { useSalut } from "./cont/date";
import { textMembri, useNumarMembri } from "./numarMembri";
import { comutaRail, latimeRail, poateDeschide, railDeschis } from "./rail";
import { TITLU_PAGINA, UN_RAND } from "./telefon";

/**
 * Bara de sus a BBT Community, pe desktop și tabletă. Pe telefon nu există: ecranele sunt ale aplicației, cu `PastilaDeJos`.
 *
 * 🔥 Banda roz (cererea userului, 31 oct 2026, demo-ul „A cu pastila scurtă"): bara n-are fundal, stă pe `FundalRama`, cu salutul
 * din aplicație în De Fonte, online și totalul membrilor. E aceeași pe toate paginile: titlul paginii stă în colțul foii, ca
 * „Mesaje" (`TitluPagina`), ca să curgă de la o pagină la alta.
 *
 * Copie după 25e (cererea userului, 1 nov 2026): 88 de înălțime, logoul în coloana pastilei, apoi trei coloane egale ca greutate:
 * salutul de 26 în stânga, căutarea de 420 în centru, deasupra chat-ului, clopoțelul și instalarea în dreapta, toate de 48, albe.
 * Profilul stă în pastilă, iar Setările și ieșirea, în meniul din Profil.
 *
 * Logoul deschide pastila (25f, „click pe logo"), iar `‹` de lângă el o închide. Cu pastila deschisă, sau pe tabletă, unde nu se
 * deschide, logoul duce în chat (cererea userului, 20 oct 2026: „e mai natural așa").
 *
 * Căutarea (în canalul deschis) și clopoțelul (mențiuni + mesaje directe necitite): `CautareSiAlerte.tsx`. Butonul de instalare
 * pe calculator: `ButonInstalare.tsx`.
 */

const TEXT = "#0A0A0B";

export function BaraSus() {
  const client = useClient();
  const navigate = useNavigate();

  const salut = useSalut();
  const numar = useNumarMembri(() => client().servers.toList()[0]);

  function apasaLogo() {
    if (poateDeschide() && !railDeschis()) {
      comutaRail();
      return;
    }
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
        "grid-template-columns": `${latimeRail()} minmax(0, 1fr)`,
        "column-gap": "var(--bbt-margine)",
        "align-items": "center",
        transition: "grid-template-columns 200ms ease-out",
        // BBT: în aplicația instalată, cu bara de titlu a Windows-ului ascunsă (săgeata din ea,
        // `display_override: window-controls-overlay` din `vite.config.ts`), bara asta ține loc de
        // bară de titlu, iar butoanele native (minimizare, mărire, închidere) stau PESTE colțul ei din
        // dreapta (pe Mac, semafoarele în stânga). Fără spațiul de mai jos, butoanele noastre intrau sub
        // ele (bug raportat de user, 20 oct 2026). Butoanele native nu pot fi scoase dintr-un PWA.
        // `titlebar-area-*` există doar cât bara de titlu e ascunsă; altfel valorile de rezervă dau 0.
        "padding-top": "0",
        "padding-bottom": "0",
        "padding-left": "var(--bbt-margine)",
        "padding-right":
          "calc(var(--bbt-margine) + 100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))",
        // Golurile barei mută fereastra, ca o bară de titlu (dublu clic = mărire). Ce se apasă e
        // `no-drag` mai jos: în zona de tras, Windows nu mai trimite clicuri și nici hover.
        "-webkit-app-region": "drag",
        "-webkit-user-select": "none",
        background: "transparent",
        color: TEXT,
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": railDeschis() ? "space-between" : "center",
          "padding-left": railDeschis() ? "8px" : "0",
          "min-width": 0,
        }}
      >
        <button
          type="button"
          aria-label={
            poateDeschide() && !railDeschis()
              ? "Deschide meniul"
              : "BBT, înapoi în chat"
          }
          aria-expanded={poateDeschide() ? railDeschis() : undefined}
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
            style={{ width: "34px", height: "auto", color: TEXT }}
          />
        </button>
        <Show when={railDeschis()}>
          <button
            type="button"
            aria-label="Închide meniul"
            onClick={comutaRail}
            style={{
              width: "32px",
              height: "32px",
              "flex-shrink": 0,
              padding: 0,
              border: 0,
              "border-radius": "50%",
              background: "#FFFFFF",
              color: TEXT,
              cursor: "pointer",
              "font-size": "14px",
              "-webkit-app-region": "no-drag",
            }}
          >
            ‹
          </button>
        </Show>
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
        <div style={{ "min-width": 0, "line-height": 1.1 }}>
          <h1
            class="bbt-titlu-sus-text"
            style={{
              ...TITLU_PAGINA,
              ...UN_RAND,
              "font-size": "26px",
              "line-height": "29px",
            }}
          >
            {salut() ? `Hei, ${salut()}` : "Hei"}{" "}
            <span class="bbt-mana">👋</span>
          </h1>
          <Show when={numar().total > 0}>
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "5px",
                "margin-top": "3px",
                "font-size": "12px",
                "line-height": "15px",
                "font-weight": 700,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  "border-radius": "4px",
                  background: "#55DB9C",
                }}
              />
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
