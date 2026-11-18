import { For, Show, createMemo } from "solid-js";

import { useDevice } from "@revolt/common";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cuCatTimpInUrma, deschideFir, grupare, numarRaspunsuri } from "./fir";
import { InelOm } from "./InelNivel";
import { AvatarOm } from "./telefon";

/** Câte avatare încap în pastilă, ca în 24a. */
const AVATARE = 3;

/** „Răspunde" de sub mesajele fără răspunsuri, pe desktop (24e). */
export function RaspundeInFir(props: { mesajId: string }) {
  return (
    <button
      type="button"
      onClick={() => deschideFir(props.mesajId)}
      style={{
        display: "inline-flex",
        "align-items": "center",
        "align-self": "flex-start",
        gap: "6px",
        padding: 0,
        border: 0,
        background: "transparent",
        color: "rgba(10,10,11,.6)",
        "font-family": "inherit",
        "font-size": "12px",
        "font-weight": 700,
        cursor: "pointer",
      }}
    >
      <Symbol size={14}>reply</Symbol>
      Răspunde
    </button>
  );
}

/**
 * BBT: pastila de sub mesaj din 24a: cine a răspuns, câte răspunsuri și când a fost ultimul. Apăsarea deschide firul.
 */
export function PastilaRaspunsuri(props: { mesajId: string }) {
  const { layout } = useDevice();
  // Pe desktop (24e), albă și puțin mai strânsă, pe rândul de mesaj.
  const lat = () => layout() !== "phone";
  const raspunsuri = createMemo(() => grupare().firuri.get(props.mesajId));

  // Cei mai recenți, fără repetări: unul care a scris de trei ori nu ocupă toată pastila.
  const oameni = () => {
    const unici = new Map(
      [...(raspunsuri() ?? [])].reverse().map((m) => [m.authorId, m.author]),
    );
    return [...unici.values()].slice(0, AVATARE);
  };

  return (
    <Show when={raspunsuri()}>
      {(lista) => (
        <button
          type="button"
          onClick={() => deschideFir(props.mesajId)}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "max-width": "100%",
            "margin-top": "6px",
            "align-self": "flex-start",
            // Fără aer sus, jos și în stânga: banda inelului de nivel (5,5 px la poza de 22) îl ține, iar pastila
            // rămâne cât era (33 / 34), cu pozele tot de 22.
            padding: lat() ? "0 10px 0 0" : "0.5px 12px 0.5px 0.5px",
            border: "1.5px solid #FFA8CD",
            "border-radius": "999px",
            background: lat() ? "#FFFFFF" : "#FFEEF5",
            color: "#0A0A0B",
            "font-family": "inherit",
            cursor: "pointer",
            "-webkit-tap-highlight-color": "transparent",
          }}
        >
          <span style={{ display: "flex", "flex-shrink": 0 }}>
            {/* Inelul de nivel, static. Cutia de 33 e sub 48, deci doar inelul interior (fără punctat și scântei,
                care s-ar fi încălecat în stivă). Pozele se suprapun tot cu 8 px: −19 = −8 − cele două benzi de 5,5.
                Discul alb ia locul vechii borduri albe de 2 px, care acum ar fi acoperit inelul. */}
            <For each={oameni()}>
              {(om, i) => (
                <InelOm
                  id={om?.id}
                  poza={22}
                  disc
                  style={{ "margin-left": i() ? "-19px" : 0 }}
                >
                  <AvatarOm om={om} marime={22} />
                </InelOm>
              )}
            </For>
          </span>
          <span
            style={{
              "font-size": lat() ? "12px" : "13px",
              "font-weight": 800,
              "white-space": "nowrap",
            }}
          >
            {numarRaspunsuri(lista().length)}
          </span>
          <span
            style={{
              "font-size": "12px",
              color: "rgba(10,10,11,.6)",
              "white-space": "nowrap",
            }}
          >
            · {lat() ? "ultimul " : ""}
            {cuCatTimpInUrma(lista()[lista().length - 1].createdAt)}
          </span>
        </button>
      )}
    </Show>
  );
}
