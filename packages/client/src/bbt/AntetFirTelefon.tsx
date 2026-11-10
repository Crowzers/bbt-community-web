import { JSX, Show, createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { Channel, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { AvatarCanal } from "./AvatarCanal";
import { deschideCautareTelefon } from "./cautare";
import { C } from "./cont/ui";
import { AvatarOm, CERC_40, IconCautare, IconInapoi, UN_RAND } from "./telefon";

/**
 * BBT: antetul firului pe telefon (19b), copia lui `TitluFir` și `AvatareFir` din `mobil/src/app/canal/[id].tsx`, cu
 * măsurile de acolo: cercul de înapoi 44, pastila gri de 48 cu cercul de 36 și numele 16/800, iar în dreapta ultimul
 * om care a scris. Desktopul rămâne pe 21a și 23a (`ChannelHeader.tsx`).
 *
 * „N online" numără oamenii care au scris în firul încărcat și sunt online acum, nu tot serverul, ca în aplicație.
 *
 * Rămâne doar butonul de apel pe canalele de voce: fără el nu ai cum intra în apel. Setările canalului se deschid din
 * apăsarea lungă pe rândul lui (`ComunitateTelefon`).
 *
 * Din 4 nov, ca în aplicație (cererea userului): în dreapta doar lupa, care deschide Caută / Fixate / Membri pe file
 * (`CautareTelefon.tsx`). În aceeași zi au fost întâi trei butoane separate, apoi căutarea și fixatele într-o capsulă, cu
 * membrii lângă: de fiecare dată numele canalului nu încăpea.
 *
 * Pastila stă în stânga, lângă săgeată, ca în aplicație din 4 nov (ca la WhatsApp): pe mijloc, între două coloane egale, nu
 * mai încăpea lângă cele trei butoane din dreapta. Ia tot locul rămas și taie numele când nu încape.
 *
 * Într-o conversație, pastila e chiar omul, deci deschide profilul lui, ca în aplicație (cererea userului, 31 oct). Într-un
 * canal nu se apasă: membrii se deschid din avatarul din dreapta.
 */
export function AntetFirTelefon(props: { channel: Channel }) {
  const client = useClient();
  const state = useState();
  const voice = useVoice();
  const { openModal } = useModals();

  const om = () =>
    props.channel.type === "DirectMessage"
      ? props.channel.recipient
      : undefined;

  // Cine a scris în fir, cel mai recent primul, fără tine.
  const autori = createMemo(() => {
    const eu = client().user?.id;
    const oameni = new Map<string, User>();
    const mesaje = client()
      .messages.toList()
      .filter((m) => m.channelId === props.channel.id && m.authorId !== eu)
      .sort((a, b) => b.id.localeCompare(a.id));
    for (const m of mesaje) {
      if (m.author && !oameni.has(m.author.id))
        oameni.set(m.author.id, m.author);
    }
    return [...oameni.values()];
  });

  const online = () => {
    if (om()) return om()!.online ? "online" : undefined;
    const n = autori().filter((a) => a.online).length;
    return n > 0 ? `${n} online` : undefined;
  };

  return (
    <>
      <div style={{ ...COLOANA, flex: "0 0 auto" }}>
        <button
          type="button"
          aria-label="Înapoi"
          onClick={() => state.appDrawer()?.setShown(false)}
          style={{
            ...CERC_40,
            width: "44px",
            height: "44px",
          }}
        >
          <IconInapoi />
        </button>
      </div>
      <Dynamic
        component={om() ? "button" : "div"}
        type={om() ? "button" : undefined}
        aria-label={om() ? `Vezi profilul lui ${om()!.displayName}` : undefined}
        onClick={() => {
          const user = om();
          if (user) openModal({ type: "user_profile", user });
        }}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          height: "48px",
          border: 0,
          cursor: om() ? "pointer" : undefined,
          "font-family": "inherit",
          "text-align": "left",
          "-webkit-tap-highlight-color": "transparent",
          "flex-shrink": 1,
          "min-width": 0,
          margin: "0 auto 0 8px",
          padding: "6px 18px 6px 6px",
          "box-sizing": "border-box",
          "border-radius": "24px",
          background: C.foaie,
          color: C.text,
        }}
      >
        <Show
          when={om()}
          fallback={<AvatarCanal canal={props.channel} marime={36} />}
        >
          <AvatarOm om={om()} marime={36} />
        </Show>
        <span style={{ "min-width": 0 }}>
          <span
            style={{
              ...UN_RAND,
              display: "block",
              "font-size": "16px",
              "line-height": "20px",
              "font-weight": 800,
            }}
          >
            {om()?.displayName ?? props.channel.name}
          </span>
          <Show when={online()}>
            <span
              style={{
                display: "block",
                color: C.verde,
                "font-size": "12px",
                "line-height": "15px",
                "font-weight": 600,
              }}
            >
              {online()}
            </span>
          </Show>
        </span>
      </Dynamic>

      <div
        style={{
          ...COLOANA,
          flex: "0 0 auto",
          "margin-left": "8px",
          "justify-content": "flex-end",
          gap: "8px",
        }}
      >
        <Show when={props.channel.isVoice && !voice.showCard(props.channel)}>
          <button
            type="button"
            aria-label="Intră în apel"
            onClick={() => voice.connect(props.channel)}
            style={CERC_40}
          >
            <Symbol size={18}>call</Symbol>
          </button>
        </Show>

        <Show when={!props.channel.isVoice}>
          <button
            type="button"
            class="bbt-moale"
            aria-label="Caută, fixate și membri"
            onClick={() => deschideCautareTelefon("cauta")}
            style={CERC_40}
          >
            <IconCautare />
          </button>
        </Show>
      </div>
    </>
  );
}

const COLOANA: JSX.CSSProperties = {
  display: "flex",
  "align-items": "center",
  flex: "1 1 0",
  "min-width": "fit-content",
};
