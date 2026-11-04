import {
  For,
  JSX,
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

import { CardCont } from "./CardCont";
import { MesajNou } from "./MesajNou";
import { mesajSistem } from "./mesajSistem";
import { trimiteCererea } from "./relatii";
import {
  AvatarOm,
  IconCautare,
  IconPlus,
  UN_RAND,
  dupaNavigare,
  numeDin,
  oraRand,
  rezumatMesaj,
} from "./telefon";
import { S1 } from "./tema";
import { aduUltimul, ultimulMesaj } from "./ultimulMesaj";

/**
 * BBT: lista Mesaje pe telefon (macheta 20a): căutarea, cipurile, rândurile 56 cu avatarul 40. Desktopul rămâne pe 23a
 * (`HomeSidebar`).
 *
 * S1 (4 nov 2026, decizia 11): pe cerneală, lângă bara din stânga, cu cardul contului jos, ca lista de canale. Până atunci
 * stătea pe alb, sub antetul roz al aplicației, cu pastila de meniu deasupra.
 *
 * „+" deschide lista prietenilor, ca în aplicație: în Stoat mesajele directe merg doar între prieteni (403 altfel). Pe
 * desktop duce la pagina Prieteni, care pe telefon nu mai are drum: cererile stau aici, în cipul „Cereri".
 */

type Filtru = "toate" | "necitite" | "cereri";

const ALB = "#FFFFFF";
const ROZ = "#FFA8CD";
const NEGRU = "#0A0A0B";

/** Cercurile de 44 din capul listei, pe placa listei. */
const CERC: JSX.CSSProperties = {
  width: "44px",
  height: "44px",
  "flex-shrink": 0,
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  padding: 0,
  border: 0,
  "border-radius": "50%",
  background: S1.placa,
  color: ALB,
  cursor: "pointer",
  "-webkit-tap-highlight-color": "transparent",
};

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

  // Ultimul mesaj al conversațiilor care nu-l au în memorie, o dată la deschidere.
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
        color: S1.text,
        "font-family": "Inter, sans-serif",
      }}
    >
      {/* Capul listei ca la canale (`SalutTelefon`): Inter 20, cercurile de 44. */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          "flex-shrink": 0,
          padding: "14px 12px 10px 16px",
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            "font-family": "Inter, system-ui, sans-serif",
            "font-size": "20px",
            "line-height": "26px",
            "font-weight": 700,
            "letter-spacing": 0,
            color: ALB,
          }}
        >
          Mesaje
        </h1>
        <button
          type="button"
          class="bbt-moale"
          aria-label="Caută o persoană"
          onClick={() => setCauta(cauta() === null ? "" : null)}
          style={CERC}
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
          style={CERC}
        >
          <IconPlus />
        </button>
      </div>

      <div
        style={{
          "flex-grow": 1,
          "min-height": 0,
          "overflow-y": "auto",
          "padding-bottom": "8px",
        }}
      >
        <Show when={cauta() !== null}>
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              height: "44px",
              margin: "0 12px 8px",
              padding: "0 14px",
              "border-radius": "999px",
              background: S1.placa,
              color: S1.stins,
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
                color: ALB,
                "font-family": "inherit",
                "font-size": "16px",
              }}
            />
          </label>
        </Show>

        <div
          role="tablist"
          style={{ display: "flex", gap: "6px", padding: "0 12px 8px" }}
        >
          <Cip
            text="Toate"
            activ={filtru() === "toate"}
            laApasare={() => setFiltru("toate")}
          />
          <Cip
            text="Necitite"
            activ={filtru() === "necitite"}
            laApasare={() => setFiltru("necitite")}
          />
          <Show when={cereri().length}>
            <Cip
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

      <CardCont />

      <Show when={nou()}>
        <MesajNou laInchidere={() => setNou(false)} />
      </Show>
    </div>
  );
}

/** Filtrele, ca pe desktop (`HomeSidebar`): alb pe cel ales, pe placa listei celelalte. 32 pe telefon, 14/600. */
function Cip(props: { text: string; activ: boolean; laApasare: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.activ}
      onClick={() => props.laApasare()}
      style={{
        "flex-shrink": 0,
        height: "32px",
        padding: "0 14px",
        border: 0,
        "border-radius": "999px",
        background: props.activ ? ALB : S1.placa,
        color: props.activ ? NEGRU : S1.stins,
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": 600,
        "white-space": "nowrap",
        cursor: "pointer",
        "-webkit-tap-highlight-color": "transparent",
      }}
    >
      {props.text}
    </button>
  );
}

const NOTA = {
  margin: 0,
  padding: "16px 24px",
  color: S1.stins,
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
  margin: "0 6px",
  padding: "8px 10px",
  "border-radius": "12px",
  color: ALB,
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
      style={{ ...RAND, background: necitit() ? S1.placa : "transparent" }}
    >
      <AvatarOm om={props.canal.recipient} marime={40} />
      <span style={{ flex: 1, "min-width": 0 }}>
        <span style={{ display: "flex", "align-items": "center", gap: "8px" }}>
          <span
            style={{
              ...UN_RAND,
              "flex-shrink": 1,
              "font-size": "16px",
              "line-height": "20px",
              "font-weight": 700,
            }}
          >
            {numeConversatie(props.canal)}
          </span>
          <span
            style={{
              "margin-left": "auto",
              "flex-shrink": 0,
              color: S1.stins,
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
              style={{ display: "flex", color: necitit() ? ALB : S1.stins }}
            >
              <Symbol size={14}>call</Symbol>
            </span>
          </Show>
          <span
            style={{
              ...UN_RAND,
              flex: 1,
              color: necitit() ? ALB : S1.stins,
              "font-size": "14px",
              "line-height": "18px",
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
                background: ROZ,
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
  // „Acceptă" e acțiunea, deci roz; „Refuză" stă pe placa listei.
  const buton = (
    text: string,
    principal: boolean,
    f: () => Promise<unknown>,
  ) => (
    <button
      type="button"
      disabled={lucreaza()}
      onClick={actiune(f)}
      style={{
        height: "36px",
        padding: "0 14px",
        border: 0,
        "border-radius": "999px",
        background: principal ? ROZ : S1.placa,
        color: principal ? NEGRU : ALB,
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": principal ? 700 : 600,
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
          "font-size": "16px",
          "font-weight": 700,
        }}
      >
        {props.om.displayName}
      </span>
      {buton("Acceptă", true, () => trimiteCererea(client(), props.om))}
      {buton("Refuză", false, () => props.om.removeFriend())}
    </div>
  );
}
