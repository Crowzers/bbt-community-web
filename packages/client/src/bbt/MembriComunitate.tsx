import { Show, createMemo, createSignal } from "solid-js";

import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";

import {
  MemberSidebar,
  membruPotrivit,
} from "../interface/channels/text/MemberSidebar";

import { C } from "./cont/ui";
import { CERC_40, IconCautare, IconInapoi, UN_RAND } from "./telefon";

const [membriDeschisi, setMembriDeschisi] = createSignal(false);

export { membriDeschisi, setMembriDeschisi };

/** Bara de căutare din Mesaje (`MesajeTelefon.tsx`), comună ecranului de telefon și panoului de pe desktop. */
export function CautareMembri(props: {
  valoare: string;
  laSchimbare: (text: string) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        "align-items": "center",
        gap: "8px",
        height: "42px",
        "flex-shrink": 0,
        margin: "0 16px 6px",
        padding: "0 14px",
        "border-radius": "999px",
        background: C.foaieTare,
        color: C.slab,
      }}
    >
      <IconCautare size={16} />
      {/* 16 în câmp: sub 16, iOS mărește pagina la focus. */}
      <input
        value={props.valoare}
        onInput={(e) => props.laSchimbare(e.currentTarget.value)}
        placeholder="Caută o persoană"
        style={{
          flex: 1,
          "min-width": 0,
          padding: 0,
          border: 0,
          outline: 0,
          background: "transparent",
          color: C.text,
          "font-family": "inherit",
          "font-size": "16px",
        }}
      />
    </label>
  );
}

/** Mesajul de sub o căutare fără rezultat. */
export function NimeniGasit(props: { channel: Channel; cautare: string }) {
  const client = useClient();

  // Boții sunt în listă doar pentru cine poate da roluri (`MemberSidebar`): și căutarea îi socotește la fel.
  const gasiti = createMemo(() =>
    [...client().serverMembers.values()].some(
      (m) =>
        m.id.server === props.channel.serverId &&
        (!m.user?.bot || props.channel.server?.havePermission("AssignRoles")) &&
        membruPotrivit(m, props.cautare),
    ),
  );

  return (
    <Show when={!gasiti()}>
      <p
        style={{
          margin: "24px 16px",
          "text-align": "center",
          "font-size": "14px",
          color: C.slab,
        }}
      >
        N-am găsit pe nimeni cu numele ăsta.
      </p>
    </Show>
  );
}

/**
 * BBT: toți membrii comunității, pe telefon, ecran deschis din avatarele din antetul canalului (cererea userului,
 * 31 oct 2026). Lista e cea de pe desktop, pe grupe de rol, dar cu toată lumea: dintr-un canal restricționat, panoul de
 * pe desktop îi arată doar pe cei care îl văd. Stă peste canal ca ecranul firului, deci canalul rămâne pornit dedesubt.
 */
export function MembriComunitate(props: { channel: Channel }) {
  const client = useClient();
  let lista!: HTMLDivElement;

  const membri = createMemo(() =>
    [...client().serverMembers.values()].filter(
      (m) => m.id.server === props.channel.serverId && !m.user?.bot,
    ),
  );
  const online = () => membri().filter((m) => m.user?.online).length;

  const [cautare, setCautare] = createSignal("");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        "z-index": 40,
        display: "flex",
        "flex-direction": "column",
        background: "#FFFFFF",
      }}
    >
      {/* Antet simplu, ca ecranele din interior ale aplicației: săgeata la stânga, titlul pe centru, online și total dedesubt. */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          padding: "6px 16px 10px",
        }}
      >
        <button
          type="button"
          class="bbt-moale"
          aria-label="Înapoi la canal"
          onClick={() => setMembriDeschisi(false)}
          style={{ ...CERC_40, width: "44px", height: "44px" }}
        >
          <IconInapoi />
        </button>
        <div style={{ flex: 1, "min-width": 0, "text-align": "center" }}>
          <div
            style={{
              "font-size": "17px",
              "line-height": "22px",
              "font-weight": 600,
              color: "#0A0A0B",
            }}
          >
            Membri
          </div>
          <div style={{ ...UN_RAND, "font-size": "12px", color: C.stins }}>
            <span style={{ color: C.verde, "font-weight": 600 }}>
              {online()} online
            </span>
            {` · ${membri().length} total`}
          </div>
        </div>
        {/* Cât săgeata: fără el, titlul n-ar sta pe centrul ecranului. */}
        <div style={{ width: "44px", "flex-shrink": 0 }} />
      </div>
      <CautareMembri valoare={cautare()} laSchimbare={setCautare} />
      <div
        ref={lista}
        style={{ flex: 1, "min-height": 0, "overflow-y": "auto" }}
      >
        <MemberSidebar
          channel={props.channel}
          scrollTargetElement={lista}
          totaComunitatea
          cautare={cautare()}
        />
        <NimeniGasit channel={props.channel} cautare={cautare()} />
      </div>
    </div>
  );
}
