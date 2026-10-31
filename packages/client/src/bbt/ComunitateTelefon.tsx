import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from "solid-js";

import type { Channel } from "stoat.js";

import { ChannelContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { orderedCategories } from "../interface/navigation/channels/ordering";

import { AntetPagina, LOC_SUB_ANTET } from "./AntetPagina";
import { AvatarCanal } from "./AvatarCanal";
import { CardAzi, experientaDeAzi } from "./CardAzi";
import { useCont, useExperiente, useNotificari } from "./cont/date";
import { C } from "./cont/ui";
import { LOC_PASTILA } from "./PastilaDeJos";
import {
  CERC_40,
  Cip,
  IconClopotel,
  TITLU_PAGINA,
  UN_RAND,
  dupaNavigare,
  numeDin,
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
  const notificari = useNotificari();
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

  // Salutul: numele de scenă, dacă omul are unul, apoi prenumele din contul BBT; fără ele, primul cuvânt de pe Community.
  const salut = () =>
    cont.data?.numeAfisat?.trim() ||
    cont.data?.prenume ||
    client().user?.displayName.split(/\s+/)[0] ||
    "";

  const necitite = () => notificari.data?.necitite ?? 0;

  // Întâi pe un rând; dacă textul iese pe mai multe, numele trece întreg dedesubt. Se reface când se schimbă numele.
  const [peDouaRanduri, setPeDouaRanduri] = createSignal(false);
  let titlu!: HTMLHeadingElement;
  createEffect(
    on(salut, () => {
      setPeDouaRanduri(false);
      queueMicrotask(() => {
        if (titlu.offsetHeight > 46) setPeDouaRanduri(true);
      });
    }),
  );
  // De Fonte vine după primul desen, iar cu el se schimbă lățimea textului.
  onMount(() => {
    void document.fonts.ready.then(() => {
      if (titlu.offsetHeight > 46) setPeDouaRanduri(true);
    });
  });

  const azi = () => experientaDeAzi(experiente.data?.active);

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
      <AntetPagina stil={{ "align-items": "flex-start" }}>
        <div style={{ flex: 1, "min-width": 0 }}>
          {/* Un nume lung trece ÎNTREG pe al doilea rând. Clopoțelul stă peste rând, în dreapta: pe un singur rând îi
              păstrăm locul, iar pe două stă lângă „Hei," și lasă numelui toată lățimea. Spațiul care nu se rupe ține mâna
              lipită de ultimul cuvânt. */}
          <h1
            ref={titlu}
            style={{
              ...TITLU_PAGINA,
              "padding-right": peDouaRanduri() ? 0 : "52px",
              "overflow-wrap": "anywhere",
            }}
          >
            Hei
            <Show when={salut()}>
              {","}
              {peDouaRanduri() ? <br /> : " "}
              {salut()}
            </Show>
            {" "}
            <span class="bbt-mana">👋</span>
          </h1>
          <Show when={online() > 0}>
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "5px",
                "margin-top": "2px",
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
              {/* Negru, nu verde: pe antetul roz verdele scris nu se citește. Spune „online" punctul de lângă el. */}
              <span
                style={{
                  color: C.text,
                  "font-size": "13px",
                  "line-height": "16px",
                  "font-weight": 700,
                }}
              >
                {online()} online
              </span>
            </div>
          </Show>
        </div>
        <button
          type="button"
          class="bbt-moale"
          aria-label={
            necitite() > 0 ? `Notificări, ${necitite()} necitite` : "Notificări"
          }
          onClick={() => navigate("/cont/notificari")}
          style={{
            ...CERC_40,
            position: "absolute",
            top: 0,
            right: 0,
            // Sticla din aplicație, cât se poate în browser.
            background: "rgba(255,255,255,0.45)",
            "-webkit-backdrop-filter": "blur(14px) saturate(1.6)",
            "backdrop-filter": "blur(14px) saturate(1.6)",
            "box-shadow":
              "inset 0 0 0 0.5px rgba(255,255,255,0.8), 0 2px 8px rgba(10,10,11,0.08)",
          }}
        >
          <IconClopotel />
          <Show when={necitite() > 0}>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-6px",
                "min-width": "18px",
                height: "18px",
                padding: "0 4px",
                "box-sizing": "border-box",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "9px",
                background: C.negru,
                color: C.peNegru,
                "font-size": "11px",
                "font-weight": 800,
              }}
            >
              {necitite() > 99 ? "99+" : necitite()}
            </span>
          </Show>
        </button>
      </AntetPagina>

      <div
        style={{
          "flex-grow": 1,
          "min-height": 0,
          "overflow-y": "auto",
          "padding-top": LOC_SUB_ANTET,
          "padding-bottom": LOC_PASTILA,
        }}
      >
        <Show when={azi()}>
          {(e) => (
            <CardAzi
              e={e()}
              margine={16}
              laTabara={() => navigate("/cont/experiente")}
            />
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

function RandCanal(props: { canal: Channel; euId: string | undefined }) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const necitit = () => props.canal.unread && !props.canal.muted;
  const mentiuni = () => props.canal.mentions?.size ?? 0;
  const deScris = () => props.canal.type === "TextChannel";
  const rezumat = () =>
    deScris() && !props.canal.isVoice
      ? [
          rezumatMesaj(
            props.canal.lastMessage,
            props.euId,
            true,
            numeDin(client()),
          ),
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
      <AvatarCanal canal={props.canal} marime={44} />
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
