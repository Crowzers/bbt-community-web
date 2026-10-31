import { For, Show, createEffect, createSignal, on, onCleanup } from "solid-js";

import { Portal } from "solid-js/web";

import type { Channel, Message } from "stoat.js";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useNavigate } from "@revolt/routing";

import { setCautareTelefon } from "./cautare";
import { C } from "./cont/ui";
import {
  AvatarOm,
  CERC_40,
  IconCautare,
  IconInapoi,
  UN_RAND,
  numeDin,
  oraRand,
  textRezumat,
} from "./telefon";

/** Pauza de scris după care pleacă întrebarea: la fiecare literă, serverul ar răspunde la cuvinte pe jumătate. */
const PAUZA_MS = 350;

/**
 * BBT: căutarea într-o conversație, ca ecranul `mobil/src/app/cauta.tsx`, oriunde n-are loc câmpul din bara de sus: pe telefon
 * peste conversație, pe tabletă (și pe ferestrele joase, sub 600 de înălțime) ca fereastră. ⚠️ Pe tabletă, lupa din antet
 * deschidea panoul din dreapta cu o căutare goală și fără câmp de scris, deci acolo nu se putea căuta deloc.
 *
 * Stoat caută doar în câte o conversație, deci ecranul se deschide din antetul ei și nu promite mai mult. Tap pe un rezultat
 * duce la mesaj, ca rezultatele de pe desktop.
 */
export function CautareTelefon(props: { channel: Channel }) {
  const { layout } = useDevice();
  return (
    <Show
      when={layout() === "phone"}
      fallback={
        <Portal>
          <div
            onClick={() => setCautareTelefon(false)}
            style={{
              position: "fixed",
              inset: 0,
              "z-index": 1000,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Caută în conversație"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "440px",
                "max-width": "calc(100% - 32px)",
                height: "80%",
                "max-height": "620px",
                overflow: "hidden",
                "border-radius": "24px",
              }}
            >
              <Ecran channel={props.channel} />
            </div>
          </div>
        </Portal>
      }
    >
      <div style={{ position: "absolute", inset: 0, "z-index": 40 }}>
        <Ecran channel={props.channel} />
      </div>
    </Show>
  );
}

function Ecran(props: { channel: Channel }) {
  const client = useClient();
  const navigate = useNavigate();
  const [text, setText] = createSignal("");
  // `undefined` = n-ai căutat încă, ca să nu apară „Nimic găsit" pe un ecran gol.
  const [rezultate, setRezultate] = createSignal<Message[]>();
  const [cauta, setCauta] = createSignal(false);
  const [eroare, setEroare] = createSignal(false);

  createEffect(
    on(text, (t) => {
      const cuvant = t.trim();
      setEroare(false);
      if (cuvant.length < 2) {
        setRezultate(undefined);
        setCauta(false);
        return;
      }
      let viu = true;
      setCauta(true);
      const ceas = setTimeout(() => {
        props.channel
          .searchWithUsers({ query: cuvant, sort: "Latest", limit: 40 })
          .then((r) => {
            if (!viu) return;
            setRezultate(
              r.messages.filter((m) => m.author?.relationship !== "Blocked"),
            );
          })
          .catch(() => viu && setEroare(true))
          .finally(() => viu && setCauta(false));
      }, PAUZA_MS);
      onCleanup(() => {
        viu = false;
        clearTimeout(ceas);
      });
    }),
  );

  function deschide(m: Message) {
    setCautareTelefon(false);
    navigate(m.path);
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "100%",
        "padding-top": "6px",
        "box-sizing": "border-box",
        background: C.fundal,
        color: C.text,
      }}
    >
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
          aria-label="Înapoi la conversație"
          onClick={() => setCautareTelefon(false)}
          style={{ ...CERC_40, width: "44px", height: "44px" }}
        >
          <IconInapoi />
        </button>
        <label
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            flex: 1,
            "min-width": 0,
            padding: "0 14px",
            "border-radius": "14px",
            background: C.foaie,
            color: C.slab,
          }}
        >
          <IconCautare />
          {/* 16, nu mai puțin: sub atât Safari mărește pagina la focus. */}
          <input
            type="search"
            autofocus
            placeholder="Scrie ce cauți"
            value={text()}
            onInput={(e) => setText(e.currentTarget.value)}
            style={{
              flex: 1,
              "min-width": 0,
              padding: "11px 0",
              border: 0,
              outline: 0,
              background: "transparent",
              color: C.text,
              "font-family": "inherit",
              "font-size": "16px",
            }}
          />
        </label>
      </div>

      <div style={{ flex: 1, "min-height": 0, "overflow-y": "auto" }}>
        <Show when={eroare()}>
          <Gol text="Căutarea n-a mers. Încearcă din nou." />
        </Show>
        <Show when={!eroare() && !cauta() && rezultate()?.length === 0}>
          <Gol text="Nimic găsit aici." />
        </Show>
        <For each={rezultate()}>
          {(m) => (
            <button
              type="button"
              onClick={() => deschide(m)}
              style={{
                display: "flex",
                gap: "12px",
                width: "100%",
                padding: "10px 16px",
                "box-sizing": "border-box",
                border: 0,
                background: "transparent",
                color: C.text,
                "font-family": "inherit",
                "text-align": "left",
                cursor: "pointer",
              }}
            >
              <AvatarOm om={m.author} marime={36} />
              <span style={{ flex: 1, "min-width": 0 }}>
                <span
                  style={{
                    display: "flex",
                    "align-items": "baseline",
                    "justify-content": "space-between",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      ...UN_RAND,
                      "font-size": "14px",
                      "font-weight": 700,
                    }}
                  >
                    {m.masquerade?.name ?? m.author?.displayName ?? m.username}
                  </span>
                  <span style={{ color: C.slab, "font-size": "12px" }}>
                    {oraRand(m.createdAt)}
                  </span>
                </span>
                <span
                  style={{
                    display: "-webkit-box",
                    "-webkit-line-clamp": 2,
                    "-webkit-box-orient": "vertical",
                    overflow: "hidden",
                    "margin-top": "1px",
                    color: C.stins,
                    "font-size": "14px",
                    "line-height": "20px",
                  }}
                >
                  {textRezumat(m.content ?? "", numeDin(client()))}
                </span>
              </span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

function Gol(props: { text: string }) {
  return (
    <p
      style={{
        margin: 0,
        "padding-top": "32px",
        color: C.stins,
        "font-size": "15px",
        "text-align": "center",
      }}
    >
      {props.text}
    </p>
  );
}
