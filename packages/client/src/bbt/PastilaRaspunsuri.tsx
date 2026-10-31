import { For, Show, createMemo } from "solid-js";

import { useDevice } from "@revolt/common";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cuCatTimpInUrma, deschideFir, grupare, numarRaspunsuri } from "./fir";
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
            padding: lat() ? "5px 10px 5px 5px" : "6px 12px 6px 6px",
            border: "1.5px solid #FFB3D9",
            "border-radius": "999px",
            background: lat() ? "#FFFFFF" : "#FFEEF5",
            color: "#0A0A0B",
            "font-family": "inherit",
            cursor: "pointer",
            "-webkit-tap-highlight-color": "transparent",
          }}
        >
          <span style={{ display: "flex", "flex-shrink": 0 }}>
            <For each={oameni()}>
              {(om, i) => (
                <span
                  style={{
                    display: "flex",
                    "margin-left": i() ? "-8px" : 0,
                    "border-radius": "50%",
                    "box-shadow": "0 0 0 2px #FFFFFF",
                  }}
                >
                  <AvatarOm om={om} marime={22} />
                </span>
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
