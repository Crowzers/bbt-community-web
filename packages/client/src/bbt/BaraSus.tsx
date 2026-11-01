import { Show } from "solid-js";

import { useClient } from "@revolt/client";

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
 * Proporțiile sunt din 25d (cererea userului, 31 oct 2026): 96 de înălțime, salutul de 30, iar în dreapta căutarea, clopoțelul și
 * instalarea, toate de 52. Spre dreapta, marginea rămâne 14, ca la foaie. Pastila cu contul din dreapta a ieșit: profilul stă jos
 * în stânga, iar Setările și ieșirea, în meniul din Profil.
 *
 * Logoul a intrat în pastila neagră (cererea userului, 1 nov 2026), iar pastila urcă în bandă (`BaraSectiuni.tsx`): în stânga barei
 * rămâne coloana ei, deci salutul începe exact deasupra foii.
 *
 * Căutarea (în canalul deschis) și clopoțelul (mențiuni + mesaje directe necitite): `CautareSiAlerte.tsx`. Butonul de instalare
 * pe calculator: `ButonInstalare.tsx`.
 */

const TEXT = "#0A0A0B";

export function BaraSus() {
  const client = useClient();

  const salut = useSalut();
  const numar = useNumarMembri(() => client().servers.toList()[0]);

  return (
    <header
      class="bbt-bara-sus"
      style={{
        height: "var(--bbt-banda)",
        "flex-shrink": 0,
        // Deasupra conținutului: lista clopoțelului și pașii de instalare cad peste mesaje.
        position: "relative",
        "z-index": 20,
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "14px",
        // BBT: în aplicația instalată, cu bara de titlu a Windows-ului ascunsă (săgeata din ea,
        // `display_override: window-controls-overlay` din `vite.config.ts`), bara asta ține loc de
        // bară de titlu, iar butoanele native (minimizare, mărire, închidere) stau PESTE colțul ei din
        // dreapta (pe Mac, semafoarele în stânga). Fără spațiul de mai jos, butoanele noastre intrau sub
        // ele (bug raportat de user, 20 oct 2026). Butoanele native nu pot fi scoase dintr-un PWA.
        // `titlebar-area-*` există doar cât bara de titlu e ascunsă; altfel valorile de rezervă dau 0.
        "padding-top": "0",
        "padding-bottom": "0",
        "padding-left":
          "max(calc(var(--bbt-langa-pastila) * 2 + 52px), env(titlebar-area-x, 0px))",
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
          {salut() ? `Hei, ${salut()}` : "Hei"} <span class="bbt-mana">👋</span>
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
          gap: "14px",
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
