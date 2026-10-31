import { For, JSX, Show, createMemo } from "solid-js";

import type { Channel, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { AvatarCanal } from "./AvatarCanal";
import { C } from "./cont/ui";
import { setMembriDeschisi } from "./MembriComunitate";
import { AvatarOm, CERC_40, IconInapoi, UN_RAND } from "./telefon";

/**
 * BBT: antetul firului pe telefon (19b), copia lui `TitluFir` și `AvatareFir` din `mobil/src/app/canal/[id].tsx`, cu
 * măsurile de acolo: cercul de înapoi 44, pastila gri de 48 cu cercul de 36 și numele 16/800, iar în dreapta ultimii doi
 * oameni care au scris. Desktopul rămâne pe 21a și 23a (`ChannelHeader.tsx`).
 *
 * „N online" numără oamenii care au scris în firul încărcat și sunt online acum, nu tot serverul, ca în aplicație.
 *
 * Rămâne doar butonul de apel pe canalele de voce: fără el nu ai cum intra în apel. Fixatele se deschid din banda de
 * sub antet (`BandaFixat`), iar setările canalului din apăsarea lungă pe rândul lui (`ComunitateTelefon`).
 *
 * Pastila stă pe mijlocul ecranului și nu se apasă, ca în aplicație, unde e titlul nativ al iPhone-ului. ⚠️ Cele două
 * coloane egale din jurul ei o țin pe centru, deși în stânga e un singur buton, iar în dreapta pot fi mai multe.
 */
export function AntetFirTelefon(props: { channel: Channel }) {
  const client = useClient();
  const state = useState();
  const voice = useVoice();

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

  const rest = () => autori().length - 2;

  return (
    <>
      <div style={COLOANA}>
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
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          height: "48px",
          "flex-shrink": 1,
          "min-width": 0,
          "max-width": "230px",
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
      </div>

      <div style={{ ...COLOANA, "justify-content": "flex-end", gap: "8px" }}>
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

        {/* Doar în canale, ca în aplicație: într-o conversație, omul e deja în pastilă. */}
        <Show when={!om() && autori().length}>
          <button
            type="button"
            aria-label="Membrii comunității"
            onClick={() => setMembriDeschisi(true)}
            style={{
              display: "flex",
              "align-items": "center",
              height: "44px",
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              "-webkit-tap-highlight-color": "transparent",
            }}
          >
            <For each={autori().slice(0, 2)}>
              {(a, i) => (
                <span
                  style={{
                    "margin-left": i() > 0 ? "-10px" : 0,
                    "border-radius": "17px",
                    border: `2px solid ${C.fundal}`,
                  }}
                >
                  <AvatarOm om={a} marime={30} />
                </span>
              )}
            </For>
            <Show when={rest() > 0}>
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  "margin-left": "-10px",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "border-radius": "17px",
                  border: `2px solid ${C.fundal}`,
                  background: C.negru,
                  color: C.peNegru,
                  "font-size": "12px",
                  "font-weight": 800,
                }}
              >
                +{rest() > 99 ? 99 : rest()}
              </span>
            </Show>
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
