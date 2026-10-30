import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import type { Channel } from "stoat.js";

import { ChannelContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { orderedCategories } from "../interface/navigation/channels/ordering";

import { ora, useCont, useExperiente } from "./cont/date";
import { QrMare } from "./cont/Experiente";
import type { Experienta } from "./cont/tipuri";
import { C } from "./cont/ui";
import { LOC_PASTILA } from "./PastilaDeJos";
import {
  Cip,
  IconQR,
  TITLU_PAGINA,
  UN_RAND,
  deFonte,
  dupaNavigare,
  oraRand,
  rezumatMesaj,
} from "./telefon";

/**
 * BBT: tab-ul Comunitate pe telefon (macheta 19a), copia ecranului `mobil/src/app/(tabs)/comunitate.tsx`, cu măsurile
 * de acolo: salutul mare, cardul roz al zilei, cipurile pe categorii și canalele ca rânduri de conversație. Înlocuiește
 * `ServerSidebar` doar sub 600px (`src/interface/Sidebar.tsx`); desktopul rămâne pe 21a.
 *
 * Ce e altfel decât în aplicație, dinadins:
 * - Canalele de voce se deschid: pe hub apelurile merg (`VoiceChannelCallCardMount`), în aplicație „vin în curând".
 * - Apăsarea lungă pe un rând deschide meniul canalului: pe hub, de acolo ajunge echipa la setări (antetul firului
 *   n-are rotiță pe telefon, ca în 19b).
 */
export function ComunitateTelefon() {
  const client = useClient();
  const cont = useCont();
  const experiente = useExperiente();
  const navigate = useNavigate();
  const [categorie, setCategorie] = createSignal<string | null>(null);

  const categorii = createMemo(() =>
    client()
      .servers.toList()
      .flatMap((server) => {
        const dupaId = new Map(server.channels.map((c) => [c.id, c]));
        return orderedCategories(
          server.categories,
          server.channels.map((c) => c.id),
        )
          .map((cat) => ({
            cheie: `${server.id}:${cat.id}`,
            // Canalele fără categorie vin în `id="default"`; numele lor e numele serverului.
            titlu: cat.id === "default" ? server.name : cat.title,
            canale: cat.channelIds
              .map((id) => dupaId.get(id)!)
              .filter((c) => c),
          }))
          .filter((cat) => cat.canale.length > 0);
      }),
  );

  const canale = () =>
    (categorie()
      ? categorii().filter((c) => c.cheie === categorie())
      : categorii()
    ).flatMap((c) => c.canale);

  const online = () =>
    client()
      .users.toList()
      .filter((u) => u.online).length;

  // Salutul: prenumele din contul BBT; fără el, primul cuvânt din numele de pe Community.
  const salut = () =>
    cont.data?.prenume ?? client().user?.displayName.split(/\s+/)[0] ?? "";

  const azi = () => {
    const active = experiente.data?.active ?? [];
    return active.find((e) => e.azi && e.qr) ?? active.find((e) => e.azi);
  };

  // Ultimul mesaj pentru rândurile care nu-l au: o cerere de un mesaj pe canal, o singură dată pe deschidere.
  createEffect(
    on(
      () => canale().length,
      () => {
        for (const c of canale()) {
          if (c.type === "TextChannel" && c.lastMessageId && !c.lastMessage)
            void c.fetchMessages({ limit: 1 }).catch(() => {});
        }
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
        background: C.fundal,
        color: C.text,
        "font-family": "Inter, sans-serif",
      }}
    >
      {/* Salutul și „online" stau fix deasupra listei; cardul de azi și cipurile se derulează cu ea, ca în aplicație. */}
      <div style={{ padding: "calc(env(safe-area-inset-top) + 8px) 20px 12px" }}>
        <Show when={online() > 0}>
          {/* ⚠️ `float`, nu o coloană alături: ocupă doar primul rând, ca „Emeric-Adrian" să aibă tot rândul al doilea
              și să nu se rupă la cratimă. 38 (rândul titlului) - 16 (rândul textului) = 22, jumătate 11. */}
          <div
            style={{
              float: "right",
              display: "flex",
              "align-items": "center",
              gap: "5px",
              "margin-top": "11px",
              "margin-left": "12px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                "border-radius": "4px",
                background: C.verde,
              }}
            />
            <span
              style={{
                color: C.verde,
                "font-size": "13px",
                "line-height": "16px",
                "font-weight": 700,
              }}
            >
              {online()} online
            </span>
          </div>
        </Show>
        {/* Un nume lung trece ÎNTREG pe al doilea rând: e `inline-block`, deci se mută tot, nu se rupe la mijloc. */}
        <h1 style={TITLU_PAGINA}>
          Hei
          <Show when={salut()}>
            {", "}
            <span style={{ display: "inline-block", "max-width": "100%" }}>
              {salut()}
              {" "}👋
            </span>
          </Show>
          <Show when={!salut()}>{" "}👋</Show>
        </h1>
      </div>

      <div
        style={{
          "flex-grow": 1,
          "min-height": 0,
          "overflow-y": "auto",
          "padding-bottom": LOC_PASTILA,
        }}
      >
        <Show when={azi()}>
          {(e) => (
            <CardAzi e={e()} laTabara={() => navigate("/cont/experiente")} />
          )}
        </Show>
        <Show when={categorii().length > 1}>
          <div
            role="tablist"
            style={{
              display: "flex",
              gap: "8px",
              padding: "0 16px 8px",
              "overflow-x": "auto",
              "scrollbar-width": "none",
            }}
          >
            <Cip
              text="Toate"
              activ={categorie() === null}
              laApasare={() => setCategorie(null)}
            />
            <For each={categorii()}>
              {(c) => (
                <Cip
                  text={c.titlu}
                  activ={categorie() === c.cheie}
                  laApasare={() => setCategorie(c.cheie)}
                />
              )}
            </For>
          </div>
        </Show>
        <For
          each={canale()}
          fallback={
            <p
              style={{
                margin: 0,
                padding: "12px 20px",
                color: C.stins,
                "font-size": "14px",
                "line-height": "20px",
              }}
            >
              Nu ești încă în niciun canal.
            </p>
          }
        >
          {(canal) => <RandCanal canal={canal} euId={client().user?.id} />}
        </For>
      </div>
    </div>
  );
}

/** „2h până începe", „35 min până începe", „acum": cât mai e din ziua de azi până la eveniment. */
function panaIncepe(iso: string, acum = new Date()) {
  const min = Math.round((new Date(iso).getTime() - acum.getTime()) / 60_000);
  if (min <= 0) return "acum";
  if (min < 60) return `${min} min până începe`;
  return `${Math.round(min / 60)}h până începe`;
}

/** Cardul de azi (19a): mare, roz, primul lucru de pe ecran, cu QR-ul la un tap. Fără QR (tabăra), duce la Experiențe. */
function CardAzi(props: { e: Experienta; laTabara: () => void }) {
  const [qrMare, setQrMare] = createSignal(false);
  return (
    <>
      <button
        type="button"
        onClick={() => (props.e.qr ? setQrMare(true) : props.laTabara())}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          width: "calc(100% - 32px)",
          margin: "0 16px 12px",
          padding: "12px 14px",
          "box-sizing": "border-box",
          border: 0,
          "border-radius": "24px",
          background: C.roz,
          // Umbra colorată din 19: cardul plutește în rozul lui.
          "box-shadow": "0 8px 18px rgba(255,179,217,0.7)",
          color: C.text,
          "font-family": "inherit",
          "text-align": "left",
          cursor: "pointer",
        }}
      >
        <span style={{ flex: 1, "min-width": 0 }}>
          <span
            style={{
              display: "block",
              "font-size": "12px",
              "font-weight": 800,
              "letter-spacing": "0.72px",
            }}
          >
            AZI · {ora(props.e.dataStart)}
          </span>
          <span
            style={{
              ...deFonte(18),
              display: "-webkit-box",
              "-webkit-line-clamp": 2,
              "-webkit-box-orient": "vertical",
              overflow: "hidden",
              "margin-top": "1px",
            }}
          >
            {props.e.titlu}
          </span>
          <span
            style={{
              ...UN_RAND,
              display: "block",
              color: C.stins,
              "font-size": "12px",
              "margin-top": "1px",
            }}
          >
            {[props.e.locatie, panaIncepe(props.e.dataStart)]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <Show when={props.e.qr}>
          <span
            style={{
              width: "48px",
              height: "48px",
              "flex-shrink": 0,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "16px",
              background: C.negru,
            }}
          >
            <IconQR color={C.peNegru} />
          </span>
        </Show>
      </button>
      <Show when={qrMare() && props.e.qr}>
        <QrMare
          cod={props.e.qr!}
          titlu={props.e.titlu}
          laInchidere={() => setQrMare(false)}
        />
      </Show>
    </>
  );
}

/** Culoarea cercului din stânga, ca în 19a: aleasă după id, ca un canal să-și păstreze culoarea. Nu spune nimic. */
const PLACI = [
  C.roz,
  C.galben,
  C.verdeDeschis,
  "#DCEEFF",
  "#F8F0FF",
  C.foaie,
];
function culoarePlaca(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PLACI[h % PLACI.length];
}

function RandCanal(props: { canal: Channel; euId: string | undefined }) {
  const state = useState();
  const navigate = useNavigate();
  const necitit = () => props.canal.unread && !props.canal.muted;
  const mentiuni = () => props.canal.mentions?.size ?? 0;
  const deScris = () => props.canal.type === "TextChannel";
  const rezumat = () =>
    deScris() && !props.canal.isVoice
      ? [
          rezumatMesaj(props.canal.lastMessage, props.euId, true),
          oraRand(props.canal.lastMessageAt),
        ]
          .filter(Boolean)
          .join(" · ")
      : "Canal de voce";

  return (
    <a
      href={`/server/${props.canal.serverId}/channel/${props.canal.id}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/server/${props.canal.serverId}/channel/${props.canal.id}`);
        dupaNavigare(() => state.appDrawer()?.setShown(true));
      }}
      aria-label={`${props.canal.name}${necitit() ? ", necitit" : ""}`}
      use:floating={{
        contextMenu: () => <ChannelContextMenu channel={props.canal} />,
      }}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        // 19a: rânduri de ~52, ca 9-10 canale să încapă pe un ecran; necititele pe gri, rotunjite.
        margin: "0 8px",
        padding: "7px 12px",
        "border-radius": "18px",
        background: necitit() || mentiuni() > 0 ? C.foaie : "transparent",
        color: C.text,
        "text-decoration": "none",
      }}
    >
      <span
        style={{
          width: "36px",
          height: "36px",
          "flex-shrink": 0,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "18px",
          background: culoarePlaca(props.canal.id),
          "font-size": "14px",
          "font-weight": 800,
        }}
      >
        <Show when={props.canal.isVoice} fallback="#">
          <Symbol size={18}>headphones</Symbol>
        </Show>
      </span>
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{
            display: "flex",
            "align-items": "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              ...UN_RAND,
              "flex-shrink": 1,
              "font-size": "15px",
              "line-height": "18px",
              "font-weight": 800,
            }}
          >
            {props.canal.name}
          </span>
          {/* Lacătul: canal în care doar citești (Anunțuri). */}
          <Show when={deScris() && !props.canal.havePermission("SendMessage")}>
            <span style={{ color: C.slab, display: "flex" }}>
              <Symbol size={13}>lock</Symbol>
            </span>
          </Show>
          <Show when={props.canal.muted}>
            <span style={{ color: C.slab, display: "flex" }}>
              <Symbol size={13}>notifications_off</Symbol>
            </span>
          </Show>
        </span>
        <span
          style={{
            ...UN_RAND,
            display: "block",
            "margin-top": "1px",
            color: necitit() ? C.text : C.stins,
            "font-size": "12px",
            "line-height": "15px",
          }}
        >
          {rezumat()}
        </span>
      </span>
      <Switch>
        <Match when={mentiuni() > 0}>
          <span
            style={{
              "min-width": "25px",
              height: "21px",
              padding: "0 9px",
              "box-sizing": "border-box",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "11px",
              background: C.roz,
              "font-size": "12px",
              "font-weight": 800,
            }}
          >
            {mentiuni() > 99 ? "99+" : mentiuni()}
          </span>
        </Match>
        <Match when={necitit()}>
          <span
            style={{
              width: "10px",
              height: "10px",
              "flex-shrink": 0,
              "border-radius": "5px",
              background: C.roz,
            }}
          />
        </Match>
      </Switch>
    </a>
  );
}
