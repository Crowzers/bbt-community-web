import { Component, JSX, Match, Show, Switch, createMemo } from "solid-js";
import { styled } from "styled-system/jsx";

import { Channel, Server as ServerI } from "stoat.js";

import {
  CategoryContextMenu,
  ChannelContextMenu,
  ServerSidebarContextMenu,
} from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  useLocation,
  useNavigate,
  useParams,
  useSmartParams,
} from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";

import { useDevice } from "@revolt/common";

import { BaraSectiuni } from "../bbt/BaraSectiuni";
import { useInchidereLaSosire } from "../bbt/intoarcere";
import { MesajeTelefon } from "../bbt/MesajeTelefon";
import { S1 } from "../bbt/tema";
import { HomeSidebar, ServerSidebar } from "./navigation";

const MainBar = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,

    _phone: {
      "--layout-width-channel-sidebar": "auto",
      position: "absolute",
      width: "100vw",
      height: "100%",
      // BBT: ⚠️ lista stă SUB conținut (`SlideDrawer` îi pune `z-index: 1`). Fără izolare, antetul ei (`AntetPagina`,
      // `z-index: 2`) trecea peste ecranele din conținut: pe Experiențe și Profil se vedea tot „Mesaje".
      isolation: "isolate",
    },
  },
});

/**
 * BBT: colțurile panourilor de pe desktop: 12 (S1, 4 nov 2026). Lista și conversația sunt panouri separate, cu 8 între ele;
 * până atunci formau o singură foaie albă, cu colțuri de 24 (25e).
 */
export const RAZA_FOAIE = "12px";

/**
 * BBT: lista de canale și de conversații pe cerneală (S1). Componentele lor citesc rolurile Material, deci culorile se schimbă
 * prin variabile pe panou, nu în fiecare componentă (vezi „Culori în hub" din regulile hub-ului: `@layer` bate `!important`).
 */
const PANOU_LISTA: JSX.CSSProperties = {
  background: S1.lista,
  "--md-sys-color-surface-container-low": S1.lista,
  "--md-sys-color-on-surface": S1.text,
  "--md-sys-color-on-surface-variant": S1.stins,
  "--md-sys-color-outline": S1.categorie,
  "--md-sys-color-outline-variant": "transparent",
  "--md-sys-color-secondary-container": S1.placa,
  "--md-sys-color-on-secondary-container": "#FFFFFF",
  "--md-sys-color-surface-container": S1.placa,
  "--md-sys-color-surface-container-highest": S1.placa,
  color: S1.text,
};

/** BBT: dacă lista (canale sau conversații) stă lângă conținut. Pe desktop, de ea depinde unde începe foaia albă. */
export function useListaLaVedere() {
  const state = useState();
  const location = useLocation();
  const { layout } = useDevice();

  return () =>
    state.layout.getSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, true) &&
    !location.pathname.startsWith("/discover") &&
    // BBT: pe desktop contul are meniul lui lângă pastilă (23b), fără lista de conversații între ele. Pe
    // telefon lista rămâne: e ecranul de sub cont (SlideDrawer).
    (layout() === "phone" || !location.pathname.startsWith("/cont"));
}

/**
 * Left-most channel navigation sidebar
 */
export const Sidebar = (_props: {
  /**
   * Menu generator TODO FIXME: remove
   */
  menuGenerator: (t: ServerI | Channel) => JSX.Directives["floating"];
}) => {
  const state = useState();
  const client = useClient();

  const params = useParams<{ server: string }>();

  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const cuLista = useListaLaVedere();

  // BBT: în locul listei de servere (`ServerList`), bara de secțiuni BBT — src/bbt/BaraSectiuni.tsx.
  const necititeMesaje = () =>
    state.ordering
      .orderedConversations(client())
      .filter((channel) => channel.unread).length;

  // BBT: întoarcerea din Experiențe și Profil în listă închide panoul de deasupra ei (`bbt/intoarcere.ts`).
  useInchidereLaSosire();

  return (
    <MainBar
      class="main_bar"
      // BBT: pe telefon, bara din stânga și lista stau pe rama de cerneală, ca pe desktop (S1, decizia 11); sus, sub ceas.
      style={
        telefon()
          ? {
              background: S1.rama,
              padding:
                "calc(env(safe-area-inset-top) + 8px) var(--bbt-margine) var(--bbt-margine) 0",
              "box-sizing": "border-box",
            }
          : undefined
      }
    >
      {/* BBT: bara din stânga, și pe telefon din 4 nov 2026 (schița „HubCampusTelTRW", aleasă de user). Între 30 oct și 4 nov
          telefonul avea pastila plutitoare a aplicației (`PastilaDeJos`), fără bară. */}
      <BaraSectiuni necititeMesaje={necititeMesaje()} />
      <div
        style={{
          display: "flex",
          "flex-grow": 1,
          "min-width": 0,
          "min-height": 0,
          // Spațiul dintre bara din stânga și listă, egal cu cel dintre panouri (S1). Pe telefon bara n-are panou, deci lista
          // se lipește de plăcile ei.
          "margin-left": telefon() ? 0 : "var(--bbt-margine)",
          ...(cuLista()
            ? {
                overflow: "hidden",
                "border-radius": RAZA_FOAIE,
                ...PANOU_LISTA,
              }
            : {}),
        }}
      >
        <Show when={cuLista()}>
          <Switch fallback={<Home />}>
            <Match when={params.server}>
              <Server />
            </Match>
          </Switch>
        </Show>
      </div>
    </MainBar>
  );
};

/**
 * Render sidebar for home
 */
const Home: Component = () => {
  const params = useSmartParams();
  const client = useClient();
  const state = useState();
  const conversations = createMemo(() =>
    state.ordering.orderedConversations(client()),
  );
  const { layout } = useDevice();

  return (
    <Show
      when={layout() === "phone"}
      fallback={
        <HomeSidebar
          conversations={conversations}
          channelId={params().channelId}
          openSavedNotes={(navigate) => {
            // Check whether the saved messages channel exists already
            const channelId = [...client()!.channels.values()].find(
              (channel) => channel.type === "SavedMessages",
            )?.id;

            if (navigate) {
              if (channelId) {
                // Navigate if exists
                navigate(`/channel/${channelId}`);
              } else {
                // If not, try to create one but only if navigating
                client()!
                  .user!.openDM()
                  .then((channel) => navigate(`/channel/${channel.id}`));
              }
            }

            // Otherwise return channel ID if available
            return channelId;
          }}
        />
      }
    >
      {/* BBT: pe telefon, lista Mesaje cu căutarea și cererile de prietenie (20a), pe cerneală din 4 nov (S1). */}
      <MesajeTelefon conversations={conversations} />
    </Show>
  );
};

/**
 * Render sidebar for a server
 */
const Server: Component = () => {
  const { openModal } = useModals();
  const navigate = useNavigate();
  const params = useSmartParams();
  const client = useClient();

  /**
   * Resolve the server
   * @returns Server
   */
  const server = () => client()!.servers.get(params().serverId!)!;

  /**
   * Open the server information modal
   */
  function openServerInfo() {
    // BBT: fereastra arată doar descrierea serverului (fără identitate/raportare, ServerInfo.tsx);
    // fără descriere ar fi o fereastră goală cu „Închide" — atunci apăsarea pe nume nu face nimic.
    if (!server()?.description?.trim()) return;
    openModal({
      type: "server_info",
      server: server(),
    });
  }

  /**
   * BBT: rotița de lângă „Canale" duce în Administrarea noastră, nu în panoul lor.
   */
  function openServerSettings() {
    navigate("/cont/administrare");
  }

  return (
    <Show when={server()}>
      <ServerSidebar
        server={server()}
        channelId={params().channelId}
        openServerInfo={openServerInfo}
        openServerSettings={openServerSettings}
        menuGenerator={(target) => ({
          contextMenu: () =>
            target instanceof Channel ? (
              <ChannelContextMenu channel={target} />
            ) : target instanceof ServerI ? (
              <ServerSidebarContextMenu server={target} />
            ) : (
              <CategoryContextMenu server={server()} category={target} />
            ),
        })}
      />
    </Show>
  );
};
