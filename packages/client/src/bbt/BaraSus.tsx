import { Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";
import { ButonInstalare } from "./ButonInstalare";
import { CautareSus, Clopotel } from "./CautareSiAlerte";
import { useSalut } from "./cont/date";
import { textMembri, useNumarMembri } from "./numarMembri";
import { TITLU_PAGINA, UN_RAND } from "./telefon";

/**
 * Bara de sus a BBT Community, pe desktop și tabletă. Pe telefon nu există: ecranele sunt ale aplicației, cu `PastilaDeJos`.
 *
 * 🔥 Banda roz (cererea userului, 31 oct 2026, demo-ul „A cu pastila scurtă"): bara n-are fundal, stă pe `FundalRama`, cu salutul
 * din aplicație în De Fonte, online și totalul membrilor. E aceeași pe toate paginile: titlul paginii stă în colțul foii, ca
 * „Mesaje" (`TitluPagina`), ca să curgă de la o pagină la alta.
 *
 * Proporțiile sunt din 25d (cererea userului, 31 oct 2026): 96 de înălțime, 14 pe laterale, logoul de 52 deasupra pastilei,
 * salutul de 30 la 18 după el, iar în dreapta căutarea, clopoțelul și instalarea, toate de 52, la 10 una de alta. Pastila cu
 * contul din dreapta a ieșit: profilul stă în pastila neagră, iar Setările și ieșirea, în meniul din Profil.
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

  return (
    <header
      class="bbt-bara-sus"
      style={{
        height: "96px",
        "flex-shrink": 0,
        // Deasupra conținutului: lista clopoțelului și pașii de instalare cad peste mesaje.
        position: "relative",
        "z-index": 20,
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "18px",
        // BBT: în aplicația instalată, cu bara de titlu a Windows-ului ascunsă (săgeata din ea,
        // `display_override: window-controls-overlay` din `vite.config.ts`), bara asta ține loc de
        // bară de titlu, iar butoanele native (minimizare, mărire, închidere) stau PESTE colțul ei din
        // dreapta (pe Mac, semafoarele în stânga). Fără spațiul de mai jos, butoanele noastre intrau sub
        // ele (bug raportat de user, 20 oct 2026). Butoanele native nu pot fi scoase dintr-un PWA.
        // `titlebar-area-*` există doar cât bara de titlu e ascunsă; altfel valorile de rezervă dau 0.
        "padding-top": "0",
        "padding-bottom": "0",
        "padding-left": "calc(14px + env(titlebar-area-x, 0px))",
        "padding-right":
          "calc(14px + 100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))",
        // Golurile barei mută fereastra, ca o bară de titlu (dublu clic = mărire). Ce se apasă e
        // `no-drag` mai jos: în zona de tras, Windows nu mai trimite clicuri și nici hover.
        "-webkit-app-region": "drag",
        "-webkit-user-select": "none",
        background: "transparent",
        color: TEXT,
      }}
    >
      {/* BBT: sigla duce mereu în chat, ca butonul Chat din `BaraSectiuni` (cererea userului,
          20 oct 2026: „e mai natural așa"). Din cont, din mesaje, de oriunde. */}
      <button
        type="button"
        aria-label="BBT, înapoi în chat"
        onClick={() => {
          const s = client().servers.toList()[0];
          if (s) navigate(`/server/${s.id}`);
        }}
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
          style={{ width: "52px", height: "auto", color: TEXT }}
        />
      </button>

      <div style={{ flex: 1, "min-width": 0 }}>
        <h1
          class="bbt-titlu-sus-text"
          style={{
            ...TITLU_PAGINA,
            ...UN_RAND,
            "font-size": "30px",
            "line-height": "33px",
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
              "margin-top": "4px",
              "font-size": "13px",
              "line-height": "16px",
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
          "align-items": "center",
          gap: "10px",
          "margin-left": "auto",
          "-webkit-app-region": "no-drag",
        }}
      >
        <CautareSus />
        <Clopotel />
        {/* BBT: „Instalează pe Windows/Mac". Se ascunde singur în rest. */}
        <ButonInstalare />
      </div>
    </header>
  );
}
