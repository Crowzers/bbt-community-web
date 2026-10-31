import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import type { Channel, User } from "stoat.js";

import { ChannelContextMenu, UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { AntetPagina, LOC_SUB_ANTET } from "./AntetPagina";
import { C } from "./cont/ui";
import { MesajNou } from "./MesajNou";
import { mesajSistem } from "./mesajSistem";
import { LOC_PASTILA } from "./PastilaDeJos";
import { trimiteCererea } from "./relatii";
import {
  AvatarOm,
  CERC_40,
  Cip,
  IconCautare,
  IconPlus,
  TITLU_PAGINA,
  UN_RAND,
  dupaNavigare,
  numeDin,
  oraRand,
  rezumatMesaj,
} from "./telefon";
import { aduUltimul, ultimulMesaj } from "./ultimulMesaj";

/**
 * BBT: tab-ul Mesaje pe telefon (macheta 20a), copia ecranului `mobil/src/app/(tabs)/mesaje.tsx`, cu măsurile de acolo:
 * titlul 32, cercurile 40, cipurile 29, rândurile 56 cu raza 18, avatarul 40. Desktopul rămâne pe 23a (`HomeSidebar`).
 *
 * „+" deschide lista prietenilor, ca în aplicație: în Stoat mesajele directe merg doar între prieteni (403 altfel). Pe
 * desktop duce la pagina Prieteni, care pe telefon nu mai are drum: cererile stau aici, în cipul „Cereri".
 */

type Filtru = "toate" | "necitite" | "cereri";

export function MesajeTelefon(props: { conversations: () => Channel[] }) {
  const client = useClient();
  const [cauta, setCauta] = createSignal<string | null>(null);
  const [filtru, setFiltru] = createSignal<Filtru>("toate");
  const [nou, setNou] = createSignal(false);

  const text = () => cauta()?.trim().toLowerCase() ?? "";
  const potrivit = (nume: string | undefined) =>
    !text() || (nume ?? "").toLowerCase().includes(text());

  const cereri = createMemo(() =>
    client()
      .users.toList()
      .filter((u) => u.relationship === "Incoming" && potrivit(u.displayName)),
  );

  const conversatii = createMemo(() =>
    props
      .conversations()
      .filter((c) => potrivit(numeConversatie(c)))
      .filter((c) => filtru() !== "necitite" || c.unread),
  );

  // Dacă ultima cerere s-a rezolvat, cipul „Cereri" dispare: lista nu trebuie să rămână goală pe un filtru invizibil.
  createEffect(() => {
    if (filtru() === "cereri" && !cereri().length) setFiltru("toate");
  });

  // Ultimul mesaj al conversațiilor care nu-l au în memorie, o dată la deschidere (ca la Comunitate).
  createEffect(
    on(
      () => props.conversations().length,
      () => {
        for (const c of props.conversations()) aduUltimul(c);
      },
    ),
  );

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "flex-grow": 1,
        "min-height": 0,
        width: "100%",
        "box-sizing": "border-box",
        background: C.fundal,
        color: C.text,
        "font-family": "Inter, sans-serif",
      }}
    >
      <AntetPagina>
        <h1 style={{ ...TITLU_PAGINA, flex: 1 }}>Mesaje</h1>
        <button
          type="button"
          class="bbt-moale"
          aria-label="Caută o persoană"
          onClick={() => setCauta(cauta() === null ? "" : null)}
          style={{ ...CERC_40, background: C.fundal }}
        >
          <Show
            when={cauta() === null}
            fallback={<Symbol size={18}>close</Symbol>}
          >
            <IconCautare />
          </Show>
        </button>
        <button
          type="button"
          class="bbt-moale"
          aria-label="Mesaj nou"
          onClick={() => setNou(true)}
          style={{ ...CERC_40, background: C.negru, color: C.peNegru }}
        >
          <IconPlus />
        </button>
      </AntetPagina>

      {/* Căutarea și cipurile merg cu lista, ca la Comunitate: pagina albă trece pe sub antet și sub colțurile lui. */}
      <div
        style={{
          "flex-grow": 1,
          "min-height": 0,
          "overflow-y": "auto",
          "padding-top": LOC_SUB_ANTET,
          "padding-bottom": LOC_PASTILA,
        }}
      >
        <Show when={cauta() !== null}>
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              height: "42px",
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
              ref={(el) => setTimeout(() => el.focus())}
              value={cauta() ?? ""}
              onInput={(e) => setCauta(e.currentTarget.value)}
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
        </Show>

        <div
          role="tablist"
          style={{ display: "flex", gap: "8px", padding: "0 16px 8px" }}
        >
          <Cip
            peNegru
            text="Toate"
            activ={filtru() === "toate"}
            laApasare={() => setFiltru("toate")}
          />
          <Cip
            peNegru
            text="Necitite"
            activ={filtru() === "necitite"}
            laApasare={() => setFiltru("necitite")}
          />
          <Show when={cereri().length}>
            <Cip
              peNegru
              text={`Cereri ${cereri().length}`}
              activ={filtru() === "cereri"}
              laApasare={() => setFiltru("cereri")}
            />
          </Show>
        </div>

        <Show
          when={filtru() !== "cereri"}
          fallback={<For each={cereri()}>{(om) => <RandCerere om={om} />}</For>}
        >
          <For each={conversatii()}>
            {(canal) => (
              <RandConversatie canal={canal} euId={client().user?.id} />
            )}
          </For>
          <p style={NOTA}>
            {conversatii().length === 0 && !text()
              ? "Niciun mesaj direct încă. Mesajele directe merg între prieteni: apasă pe numele cuiva într-un canal."
              : "Mesaj nou din + sau apăsând pe numele cuiva într-un canal."}
          </p>
        </Show>
      </div>

      <Show when={nou()}>
        <MesajNou laInchidere={() => setNou(false)} />
      </Show>
    </div>
  );
}

const NOTA = {
  margin: 0,
  padding: "16px 28px",
  color: C.slab,
  "font-size": "14px",
  "line-height": "20px",
  "text-align": "center",
} as const;

function numeConversatie(c: Channel) {
  return c.type === "DirectMessage"
    ? (c.recipient?.displayName ?? "Mesaj direct")
    : (c.name ?? "Grup");
}

const RAND = {
  display: "flex",
  "align-items": "center",
  gap: "12px",
  margin: "0 8px",
  padding: "8px 12px",
  "border-radius": "18px",
  color: C.text,
  "text-decoration": "none",
} as const;

function RandConversatie(props: { canal: Channel; euId: string | undefined }) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const necitit = () => props.canal.unread;
  const ultim = () => ultimulMesaj(props.canal);
  const esteApel = () => {
    const m = ultim();
    return !!m && !!mesajSistem(m, props.euId)?.apel;
  };

  return (
    <a
      href={`/channel/${props.canal.id}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/channel/${props.canal.id}`);
        dupaNavigare(() => state.appDrawer()?.setShown(true));
      }}
      use:floating={{
        contextMenu: () =>
          props.canal.type === "DirectMessage" ? (
            <UserContextMenu
              user={props.canal.recipient!}
              channel={props.canal}
            />
          ) : (
            <ChannelContextMenu channel={props.canal} />
          ),
      }}
      style={{ ...RAND, background: necitit() ? C.foaie : "transparent" }}
    >
      <AvatarOm om={props.canal.recipient} marime={40} />
      <span style={{ flex: 1, "min-width": 0 }}>
        <span style={{ display: "flex", "align-items": "center", gap: "8px" }}>
          <span
            style={{
              ...UN_RAND,
              "flex-shrink": 1,
              "font-size": "15px",
              "line-height": "20px",
              "font-weight": 800,
            }}
          >
            {numeConversatie(props.canal)}
          </span>
          <span
            style={{
              "margin-left": "auto",
              "flex-shrink": 0,
              color: C.slab,
              "font-size": "12px",
            }}
          >
            {oraRand(ultim()?.createdAt ?? props.canal.lastMessageAt)}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "margin-top": "1px",
          }}
        >
          <Show when={esteApel()}>
            <span
              style={{ display: "flex", color: necitit() ? C.text : C.stins }}
            >
              <Symbol size={14}>call</Symbol>
            </span>
          </Show>
          <span
            style={{
              ...UN_RAND,
              flex: 1,
              color: necitit() ? C.text : C.stins,
              "font-size": "13px",
              "line-height": "16px",
              "font-weight": necitit() ? 600 : 400,
            }}
          >
            {rezumatMesaj(ultim(), props.euId, false, numeDin(client()))}
          </span>
          <Show when={necitit()}>
            <span
              style={{
                width: "10px",
                height: "10px",
                "flex-shrink": 0,
                "border-radius": "5px",
                background: C.roz,
              }}
            />
          </Show>
        </span>
      </span>
    </a>
  );
}

function RandCerere(props: { om: User }) {
  const client = useClient();
  const [lucreaza, setLucreaza] = createSignal(false);
  const actiune = (f: () => Promise<unknown>) => async () => {
    setLucreaza(true);
    await f().catch(() => {});
    setLucreaza(false);
  };
  const buton = (text: string, negru: boolean, f: () => Promise<unknown>) => (
    <button
      type="button"
      disabled={lucreaza()}
      onClick={actiune(f)}
      style={{
        padding: "7px 12px",
        border: 0,
        "border-radius": "999px",
        background: negru ? C.negru : C.foaie,
        color: negru ? C.peNegru : C.text,
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": negru ? 700 : 600,
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
  return (
    <div style={RAND}>
      <AvatarOm om={props.om} marime={40} />
      <span
        style={{
          ...UN_RAND,
          flex: 1,
          "font-size": "15px",
          "font-weight": 800,
        }}
      >
        {props.om.displayName}
      </span>
      {buton("Acceptă", true, () => trimiteCererea(client(), props.om))}
      {buton("Refuză", false, () => props.om.removeFriend())}
    </div>
  );
}
