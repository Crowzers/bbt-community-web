import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
} from "solid-js";

import { Portal } from "solid-js/web";

import type { Channel, Message } from "stoat.js";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useNavigate } from "@revolt/routing";

import { MemberSidebar } from "../interface/channels/text/MemberSidebar";

import {
  type FilaCautare,
  filaCautare,
  setCautareTelefon,
  setFilaCautare,
} from "./cautare";
import { C } from "./cont/ui";
import { CautareMembri, NimeniGasit } from "./MembriComunitate";
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
 *
 * Din 4 nov, ca în aplicație (cererea userului): trei file, Caută, Fixate și Membri, iar în antetul firului a rămas doar
 * lupa. Fixatele și membrii aveau până atunci butoanele lor în antet, unde numele canalului nu mai încăpea. Membrii lipsesc
 * într-o conversație directă: acolo omul e chiar titlul.
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
  const cuMembri = () => !!props.channel.server;
  const file = (): { cheie: FilaCautare; nume: string }[] => [
    { cheie: "cauta", nume: "Caută" },
    { cheie: "fixate", nume: "Fixate" },
    ...(cuMembri() ? [{ cheie: "membri" as const, nume: "Membri" }] : []),
  ];
  const nume = () =>
    props.channel.type === "DirectMessage"
      ? (props.channel.recipient?.displayName ?? "")
      : (props.channel.name ?? "");

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
        <span
          style={{
            ...UN_RAND,
            flex: 1,
            "min-width": 0,
            "font-size": "20px",
            "line-height": "26px",
            "font-weight": 700,
          }}
        >
          {nume()}
        </span>
      </div>

      {/* Filele ca un comutator: o capsulă cu segmente egale, cel ales pe alb, ca în aplicație. */}
      <div
        role="tablist"
        style={{
          display: "flex",
          margin: "0 16px 6px",
          padding: "3px",
          "border-radius": "22px",
          background: C.foaie,
        }}
      >
        <For each={file()}>
          {(f) => (
            <button
              type="button"
              role="tab"
              aria-selected={filaCautare() === f.cheie}
              onClick={() => setFilaCautare(f.cheie)}
              style={{
                flex: 1,
                height: "38px",
                border: 0,
                "border-radius": "19px",
                background:
                  filaCautare() === f.cheie ? C.fundal : "transparent",
                "box-shadow":
                  filaCautare() === f.cheie
                    ? "0 1px 4px rgba(0,0,0,0.12)"
                    : "none",
                color: filaCautare() === f.cheie ? C.text : C.stins,
                "font-family": "inherit",
                "font-size": "15px",
                "font-weight": filaCautare() === f.cheie ? 700 : 600,
                cursor: "pointer",
                "-webkit-tap-highlight-color": "transparent",
              }}
            >
              {f.nume}
            </button>
          )}
        </For>
      </div>

      <Show when={filaCautare() === "cauta"}>
        <FilaCauta channel={props.channel} />
      </Show>
      <Show when={filaCautare() === "fixate"}>
        <FilaFixate channel={props.channel} />
      </Show>
      <Show when={filaCautare() === "membri" && cuMembri()}>
        <FilaMembri channel={props.channel} />
      </Show>
    </div>
  );
}

/** Tap pe un rezultat sau pe un mesaj fixat: ecranul se închide și conversația sare la mesaj. */
function useDeschideMesaj() {
  const navigate = useNavigate();
  return (m: Message) => {
    setCautareTelefon(false);
    navigate(m.path);
  };
}

function FilaCauta(props: { channel: Channel }) {
  const client = useClient();
  const deschide = useDeschideMesaj();
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

  return (
    <>
      <label
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          margin: "10px 16px 8px",
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

      <div style={{ flex: 1, "min-height": 0, "overflow-y": "auto" }}>
        <Show when={eroare()}>
          <Gol text="Căutarea n-a mers. Încearcă din nou." />
        </Show>
        <Show when={!eroare() && !cauta() && rezultate()?.length === 0}>
          <Gol text="Nimic găsit aici." />
        </Show>
        <For each={rezultate()}>
          {(m) => (
            <RandMesaj
              m={m}
              text={textRezumat(m.content ?? "", numeDin(client()))}
              laApasare={() => deschide(m)}
            />
          )}
        </For>
      </div>
    </>
  );
}

/** Mesajele fixate, din aceeași căutare ca banda „Fixat" și panoul de pe desktop (`pinned: true`). */
function FilaFixate(props: { channel: Channel }) {
  const client = useClient();
  const deschide = useDeschideMesaj();
  const [fixate] = createResource(
    () => props.channel,
    (canal) => canal.search({ pinned: true, sort: "Latest", limit: 40 }),
  );
  return (
    <div
      style={{
        flex: 1,
        "min-height": 0,
        "overflow-y": "auto",
        "padding-top": "6px",
      }}
    >
      <Show when={fixate.error}>
        <Gol text="Fixatele nu se încarcă acum." />
      </Show>
      <Show when={fixate()?.length === 0}>
        <Gol text="Niciun mesaj fixat aici. Ține apăsat pe un mesaj și alege „Fixează mesajul”." />
      </Show>
      <For each={fixate()}>
        {(m) => (
          <RandMesaj
            m={m}
            text={textRezumat(m.content ?? "", numeDin(client()))}
            laApasare={() => deschide(m)}
          />
        )}
      </For>
    </div>
  );
}

/** Toți membrii comunității, pe grupe de rol, ca ecranul „Membri" de până pe 4 nov (`MembriComunitate.tsx`). */
function FilaMembri(props: { channel: Channel }) {
  const client = useClient();
  let lista!: HTMLDivElement;
  const [cautare, setCautare] = createSignal("");
  const membri = createMemo(() =>
    [...client().serverMembers.values()].filter(
      (m) => m.id.server === props.channel.serverId && !m.user?.bot,
    ),
  );
  const online = () => membri().filter((m) => m.user?.online).length;
  return (
    <>
      <div
        style={{ padding: "10px 16px 0", "font-size": "14px", color: C.stins }}
      >
        <span style={{ color: C.verde, "font-weight": 600 }}>
          {online()} online
        </span>
        {` · ${membri().length} total`}
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
    </>
  );
}

function RandMesaj(props: { m: Message; text: string; laApasare: () => void }) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
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
      <AvatarOm om={props.m.author} marime={36} />
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
            {props.m.masquerade?.name ??
              props.m.author?.displayName ??
              props.m.username}
          </span>
          <span style={{ color: C.slab, "font-size": "12px" }}>
            {oraRand(props.m.createdAt)}
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
          {props.text}
        </span>
      </span>
    </button>
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
