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
import { useLocation, useParams, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";

import { useDevice } from "@revolt/common";

import { BaraSectiuni } from "../bbt/BaraSectiuni";
import { BaraSus } from "../bbt/BaraSus";
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
    },
  },
});

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
  const location = useLocation();

  const { layout } = useDevice();
  const telefon = () => layout() === "phone";

  // BBT: în locul listei de servere (`ServerList`), bara de secțiuni BBT — src/bbt/BaraSectiuni.tsx.
  // Pe telefon, ecranul cu lista de canale devine o coloană: bara de sus (contul) → canalele → bara
  // de tab-uri jos, ca într-o aplicație (pânza aprobată, 5 oct 2026).
  const necititeMesaje = () =>
    state.ordering
      .orderedConversations(client())
      .filter((channel) => channel.unread).length;

  return (
    <MainBar
      class="main_bar"
      style={telefon() ? { "flex-direction": "column" } : undefined}
    >
      <Show when={telefon()}>
        <BaraSus compact />
      </Show>
      <Show when={!telefon()}>
        <BaraSectiuni necititeMesaje={necititeMesaje()} />
      </Show>
      <div
        style={{
          display: "flex",
          "flex-grow": 1,
          "min-height": 0,
          ...(telefon() ? { width: "100%" } : {}),
        }}
      >
        <Show
          when={
            state.layout.getSectionState(
              LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
              true,
            ) && !location.pathname.startsWith("/discover")
          }
        >
          <Switch fallback={<Home />}>
            <Match when={params.server}>
              <Server />
            </Match>
          </Switch>
        </Show>
      </div>
      <Show when={telefon()}>
        <BaraSectiuni orizontal necititeMesaje={necititeMesaje()} />
      </Show>
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

  return (
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
  );
};

/**
 * Render sidebar for a server
 */
const Server: Component = () => {
  const { openModal } = useModals();
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
   * Open the server settings modal
   */
  function openServerSettings() {
    openModal({
      type: "settings",
      config: "server",
      context: server(),
    });
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
