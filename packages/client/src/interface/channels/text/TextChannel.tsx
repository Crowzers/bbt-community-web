import {
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime, ulid } from "ulid";

import { DraftMessages, Messages } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { Keybind, KeybindAction, createKeybind } from "@revolt/keybinds";
import { useNavigate, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import {
  BelowFloatingHeader,
  Header,
  NewMessages,
  Text,
  main,
} from "@revolt/ui";
import { VoiceChannelCallCardMount } from "@revolt/ui/components/features/voice/callCard/VoiceCallCard";

import { BandaFixat } from "../../../bbt/BandaFixat";
import { FirPanou, FirRaspunsuri } from "../../../bbt/FirRaspunsuri";
import {
  CautareMembri,
  MembriComunitate,
  NimeniGasit,
  membriDeschisi,
  setMembriDeschisi,
} from "../../../bbt/MembriComunitate";
import { cautareCeruta } from "../../../bbt/cautare";
import { firDeschis, inchideFir } from "../../../bbt/fir";
import { ChannelHeader } from "../ChannelHeader";
import { ChannelPageProps } from "../ChannelPage";

import { Channel } from "stoat.js";
import { ProfilConversatie } from "../../../bbt/ProfilConversatie";
import { MessageComposition } from "./Composition";
import { isLargeServer } from "./largeServer";

import { MemberSidebar } from "./MemberSidebar";
import { TextSearchSidebar } from "./TextSearchSidebar";

/**
 * State of the channel sidebar
 */
export type SidebarState =
  | {
      state: "search";
      query: string;
    }
  | {
      state: "pins";
    }
  | {
      state: "default";
    };

export function canIHasSidebar(ch: Channel) {
  // BBT: conversația cu un om are și ea panou în dreapta, profilul lui (23a, `bbt/ProfilConversatie.tsx`).
  return ch.type !== "SavedMessages";
}

/**
 * Channel component
 */
export function TextChannel(props: ChannelPageProps) {
  const state = useState();
  const client = useClient();
  const { layout } = useDevice();

  // Last unread message id
  const [lastId, setLastId] = createSignal<string>();

  // Read highlighted message id from parameters
  const params = useSmartParams();
  const navigate = useNavigate();

  /**
   * Message id to be highlighted
   * @returns Message Id
   */
  const highlightMessageId = () => params().messageId;

  const canConnect = () =>
    props.channel.isVoice && props.channel.havePermission("Connect");

  // Get a reference to the message box's load latest function
  let jumpToBottomRef: ((nearby?: string) => void) | undefined;

  const [atEnd, setEnd] = createSignal(true);

  // Store last unread message id
  createEffect(
    on(
      () => props.channel.id,
      (id) =>
        setLastId(
          props.channel.unread
            ? (client().channelUnreads.get(id)?.lastMessageId as string)
            : undefined,
        ),
    ),
  );

  // Mark channel as read whenever it is marked as unread
  createEffect(
    on(
      // must be at the end of the conversation
      () => props.channel.unread && atEnd(),
      (unread) => {
        if (unread) {
          if (document.hasFocus()) {
            // acknowledge the message
            props.channel.ack();
          } else {
            // otherwise mark this location as the last read location
            if (!lastId()) {
              // (taking away one second from the seed)
              setLastId(ulid(decodeTime(props.channel.lastMessageId!) - 1));
            }
          }
        }
      },
    ),
  );

  // Mark as read on re-focus
  function onFocus() {
    if (props.channel.unread && atEnd()) {
      props.channel.ack();
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") onFocus();
  }

  // Chromium + webkit
  window.addEventListener("focus", onFocus);
  // Gecko
  document.addEventListener("focus", onFocus);
  // Mobile (eg. unlock screen)
  document.addEventListener("visibilitychange", onVisibilityChange);
  onCleanup(() => {
    // Mobile
    document.removeEventListener("visibilitychange", onVisibilityChange);
    // Gecko
    document.removeEventListener("focus", onFocus);
    // Chromium + webkit
    window.removeEventListener("focus", onFocus);
  });

  // Register ack/jump latest
  createKeybind(KeybindAction.CHAT_JUMP_END, () => {
    // Mark channel as read if not already
    if (props.channel.unread) {
      props.channel.ack();
    }

    // Clear the last unread id
    if (lastId()) {
      setLastId(undefined);
    }

    // Scroll to the bottom
    jumpToBottomRef?.();
  });

  // Sidebar scroll target
  let sidebarScrollTargetElement!: HTMLDivElement;

  // Sidebar state
  const [sidebarState, setSidebarState] = createSignal<SidebarState>({
    state: "default",
  });

  // BBT: căutarea din panoul de membri, ca pe telefon (`bbt/MembriComunitate.tsx`).
  const [cautareMembri, setCautareMembri] = createSignal("");

  // todo: in the future maybe persist per ID?
  createEffect(
    on(
      () => props.channel.id,
      () => {
        setSidebarState({ state: "default" });
        inchideFir();
        setMembriDeschisi(false);
        setCautareMembri("");
      },
    ),
  );
  onCleanup(() => {
    inchideFir();
    setMembriDeschisi(false);
  });

  // BBT: căutarea din bara de sus deschide panoul de căutare al canalului (src/bbt/cautare.ts).
  createEffect(
    on(
      cautareCeruta,
      (cerere) =>
        cerere && setSidebarState({ state: "search", query: cerere.q }),
      { defer: true },
    ),
  );

  // If this is a server text channel, sync the members
  // todo: useQuery
  createEffect(
    on(
      () => props.channel.serverId,
      (serverId, prevServerId) =>
        // This effect tracks channel, not serverId, therefore we must ensure the old serverId
        // is not the same as the current serverId
        prevServerId !== serverId &&
        props.channel.type === "TextChannel" &&
        props.channel.server?.syncMembers(isLargeServer(props.channel.server)),
    ),
  );

  return (
    <>
      <Show when={layout() === "phone" && firDeschis()}>
        <FirRaspunsuri channel={props.channel} />
      </Show>
      <Show when={layout() === "phone" && membriDeschisi()}>
        <MembriComunitate channel={props.channel} />
      </Show>
      <Header placement="primary">
        <ChannelHeader
          channel={props.channel}
          sidebarState={sidebarState}
          setSidebarState={setSidebarState}
        />
      </Header>
      <Content>
        {/* BBT: conversația directă pe gri, cu mesajele pe alb și roz deasupra (23a); canalele rămân albe (21a). Pe
            telefon, gri peste tot: bulele sunt și în canale, ca în aplicație (19b). */}
        <main
          class={main()}
          style={
            props.channel.type === "DirectMessage" || layout() === "phone"
              ? { background: "#F2F2F3" }
              : undefined
          }
        >
          {/* BBT: ultimul mesaj fixat, ca bandă sub antet (pânza TRW). */}
          <BandaFixat
            channel={props.channel}
            onVezi={() => setSidebarState({ state: "pins" })}
          />
          <Show
            when={canConnect()}
            fallback={
              <BelowFloatingHeader>
                <div>
                  <NewMessages
                    lastId={lastId}
                    jumpBack={() => navigate(lastId()!)}
                    dismiss={() => setLastId()}
                  />
                </div>
              </BelowFloatingHeader>
            }
          >
            <VoiceChannelCallCardMount channel={props.channel} />
          </Show>

          <Messages
            channel={props.channel}
            lastReadId={lastId}
            pendingMessages={(pendingProps) => (
              <DraftMessages
                channel={props.channel}
                tail={pendingProps.tail}
                sentIds={pendingProps.ids}
              />
            )}
            highlightedMessageId={highlightMessageId}
            clearHighlightedMessage={() => navigate(".")}
            jumpToBottomRef={(ref) => (jumpToBottomRef = ref)}
            atEnd={[atEnd, setEnd]}
          />

          {/* Bara de scris e una singură și rămâne peste ecranul firului: pe ea pleacă și răspunsurile. */}
          <div
            style={{
              position: "relative",
              "z-index": firDeschis() && layout() === "phone" ? 41 : undefined,
            }}
          >
            <MessageComposition
              channel={props.channel}
              onMessageSend={() => jumpToBottomRef?.()}
            />
          </div>
        </main>
        <Show when={layout() !== "phone" && firDeschis()}>
          <FirPanou channel={props.channel} />
        </Show>
        <Show
          when={
            !(layout() !== "phone" && firDeschis()) &&
            ((state.layout.getSectionState(
              LAYOUT_SECTIONS.MEMBER_SIDEBAR,
              true,
            ) &&
              canIHasSidebar(props.channel)) ||
              sidebarState().state !== "default")
          }
        >
          <div
            ref={sidebarScrollTargetElement}
            // BBT: membrii și profilul din conversație ies sub 1180px (`bbt/raspuns.css`); fixatele și căutarea, nu.
            classList={{
              "bbt-panou-dreapta": sidebarState().state === "default",
            }}
            use:scrollable={{
              direction: "y",
              showOnHover: true,
              class: sidebar(),
            }}
            style={{
              width: sidebarState().state !== "default" ? "360px" : "",
            }}
          >
            {/* BBT: filele panoului din dreapta (pânza TRW). „Fișiere" din schiță lipsește: Stoat n-are
                o listă de fișiere a canalului — un buton spre nimic e mai rău decât niciunul. */}
            <Show
              when={
                props.channel.type === "TextChannel" &&
                sidebarState().state !== "search"
              }
            >
              <FileePanou>
                <button
                  type="button"
                  data-activ={
                    sidebarState().state === "default" ? "" : undefined
                  }
                  onClick={() => setSidebarState({ state: "default" })}
                >
                  Membri
                </button>
                <button
                  type="button"
                  data-activ={sidebarState().state === "pins" ? "" : undefined}
                  onClick={() => setSidebarState({ state: "pins" })}
                >
                  Fixate
                </button>
              </FileePanou>
            </Show>
            <Switch
              fallback={
                <Show
                  when={
                    props.channel.type === "DirectMessage" &&
                    props.channel.recipient
                  }
                  fallback={
                    <>
                      <Show when={props.channel.type === "TextChannel"}>
                        <CautareMembri
                          valoare={cautareMembri()}
                          laSchimbare={setCautareMembri}
                        />
                      </Show>
                      <MemberSidebar
                        channel={props.channel}
                        scrollTargetElement={sidebarScrollTargetElement}
                        isLargeServer={isLargeServer(props.channel.server)}
                        totaComunitatea
                        cautare={cautareMembri()}
                      />
                      <Show when={props.channel.type === "TextChannel"}>
                        <NimeniGasit
                          channel={props.channel}
                          cautare={cautareMembri()}
                        />
                      </Show>
                    </>
                  }
                >
                  {(om) => (
                    <ProfilConversatie user={om()} channel={props.channel} />
                  )}
                </Show>
              }
            >
              <Match when={sidebarState().state === "search"}>
                <WideSidebarContainer>
                  <SidebarTitle>
                    <Text class="label" size="large">
                      Rezultatele căutării
                    </Text>
                  </SidebarTitle>
                  <TextSearchSidebar
                    channel={props.channel}
                    query={{
                      query: (sidebarState() as { query: string }).query,
                    }}
                  />
                </WideSidebarContainer>
              </Match>
              <Match when={sidebarState().state === "pins"}>
                <WideSidebarContainer>
                  <SidebarTitle>
                    <Text class="label" size="large">
                      Mesaje fixate
                    </Text>
                  </SidebarTitle>
                  <TextSearchSidebar
                    channel={props.channel}
                    query={{ pinned: true, sort: "Latest" }}
                  />
                </WideSidebarContainer>
              </Match>
            </Switch>

            <Show when={sidebarState().state !== "default"}>
              <Keybind
                keybind={KeybindAction.CLOSE_SIDEBAR}
                onPressed={() => setSidebarState({ state: "default" })}
              />
            </Show>
          </div>
        </Show>
      </Content>
    </>
  );
}

/**
 * Main content row layout
 */
const Content = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
    // Ancora panoului din dreapta pe telefon (`sidebar`, `_phone`).
    position: "relative",
  },
});

/**
 * Base styles
 */
const sidebar = cva({
  base: {
    flexShrink: 0,
    width: "var(--layout-width-channel-sidebar)",
    // margin: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
    // color: "var(--colours-sidebar-channels-foreground)",
    // background: "var(--colours-sidebar-channels-background)",

    // BBT (6 oct 2026): pe telefon, membrii / fixatele / căutarea ACOPERĂ canalul, nu stau lângă el.
    // Alături, pe 375px, chat-ul rămânea o coloană de un deget, cu câmpul de scris strivit. Se închid
    // din același buton din antet (antetul rămâne deasupra). `!important` bate lățimea inline de 360px
    // pusă pentru căutare/fixate.
    _phone: {
      position: "absolute",
      inset: 0,
      zIndex: 5,
      width: "100% !important",
      borderRadius: 0,
      background: "#FFFFFF",
    },
  },
});

/**
 * Container styles
 */
const WideSidebarContainer = styled("div", {
  base: {
    paddingRight: "var(--gap-md)",
    width: "360px",
  },
});

/**
 * Sidebar title
 */
const SidebarTitle = styled("div", {
  base: {
    padding: "var(--gap-md)",
    color: "var(--md-sys-color-on-surface)",
  },
});

/**
 * BBT: filele „Membri | Fixate" din capul panoului din dreapta — lipite sus, 52px ca antetele.
 */
const FileePanou = styled("div", {
  base: {
    // BBT (21a, 30 oct 2026): o pastilă gri cu fila aleasă neagră, cât lățimea panoului. Până atunci file mici pe un
    // rând alb cu fir dedesubt.
    position: "sticky",
    top: 0,
    zIndex: 2,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    margin: "16px 12px 10px",
    padding: "4px",
    borderRadius: "999px",
    background: "#F2F2F3",

    "& button": {
      flex: 1,
      height: "34px",
      padding: "0 10px",
      borderRadius: "999px",
      border: 0,
      background: "transparent",
      color: "#6C6C6D",
      fontFamily: "inherit",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
    },
    "& button[data-activ]": {
      background: "#0A0A0B",
      color: "#FFFFFF",
    },
  },
});
