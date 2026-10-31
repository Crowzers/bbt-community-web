import { Accessor, Match, Setter, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { Channel } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import {
  Avatar,
  Button,
  IconButton,
  NonBreakingText,
  OverflowingText,
  Spacer,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdGroup from "@material-design-icons/svg/outlined/group.svg?component-solid";
import MdPersonAdd from "@material-design-icons/svg/outlined/person_add.svg?component-solid";
import MdSettings from "@material-design-icons/svg/outlined/settings.svg?component-solid";

import { AntetFirTelefon } from "../../bbt/AntetFirTelefon";
import { AvatarCanal } from "../../bbt/AvatarCanal";
import { HeaderIcon } from "../common/CommonHeader";

import { canIHasSidebar, SidebarState } from "./text/TextChannel";

interface Props {
  /**
   * Channel to render header for
   */
  channel: Channel;

  /**
   * Sidebar state
   */
  sidebarState?: Accessor<SidebarState>;

  /**
   * Set sidebar state
   */
  setSidebarState?: Setter<SidebarState>;
}

/**
 * Common channel header component
 */
export function ChannelHeader(props: Props) {
  const { layout } = useDevice();
  // BBT: pe telefon, antetul firului din aplicație (19b).
  return (
    <Show when={layout() === "phone"} fallback={<AntetLat {...props} />}>
      <AntetFirTelefon channel={props.channel} />
    </Show>
  );
}

function AntetLat(props: Props) {
  const { openModal } = useModals();
  const client = useClient();
  const { t } = useLingui();
  const state = useState();
  const voice = useVoice();
  const { layout } = useDevice();

  const searchValue = () => {
    if (!props.sidebarState) return null;

    const state = props.sidebarState();
    if (state.state === "search") return state.query;
    return "";
  };

  return (
    <>
      <Switch>
        <Match
          when={
            props.channel.type === "TextChannel" ||
            props.channel.type === "Group"
          }
        >
          {/* BBT (21a, 30 oct 2026): numele mare în De Fonte și descrierea dedesubt, nu alături după o linie. În stânga,
              avatarul din aplicație, de aceeași mărime ca antetul firului de pe telefon. */}
          <HeaderIcon>
            <AvatarCanal canal={props.channel} marime={36} />
          </HeaderIcon>
          <div style={{ "min-width": 0, "line-height": "1.2" }}>
            <NonBreakingText
              class={mobileOverflow}
              style={{
                display: "block",
                "font-family": '"De Fonte BBT", Inter, sans-serif',
                "font-size": "20px",
                "font-weight": 400,
                "letter-spacing": "0.01em",
                "font-synthesis": "none",
                cursor: "pointer",
              }}
              onClick={() =>
                openModal({
                  type: "channel_info",
                  channel: props.channel,
                })
              }
            >
              <TextWithEmoji content={props.channel.name!} />
            </NonBreakingText>
            <Show when={layout() !== "phone" && props.channel.description}>
              <a
                class={descriptionLink}
                onClick={() =>
                  openModal({
                    type: "channel_info",
                    channel: props.channel,
                  })
                }
                use:floating={{
                  tooltip: {
                    placement: "bottom",
                    content: t`Click to show full description`,
                  },
                }}
              >
                <OverflowingText
                  style={{
                    "font-size": "12px",
                    "font-weight": 400,
                    color: "#6C6C6D",
                  }}
                >
                  <TextWithEmoji
                    content={props.channel.description?.split("\n").shift()}
                  />
                </OverflowingText>
              </a>
            </Show>
          </div>
        </Match>
        <Match when={props.channel.type === "DirectMessage"}>
          {/* BBT (23a, 30 oct 2026): avatarul, numele și sub el „online" verde sau „offline", în locul lui „@" și al
              punctului de stare. */}
          <Avatar
            size={40}
            src={props.channel.recipient?.animatedAvatarURL}
            fallback={props.channel.recipient?.displayName}
            fallbackBackground
          />
          <div style={{ "min-width": 0, "line-height": "1.25" }}>
            {/* 23a: numele la 18, titlu (De Fonte la noi), sub el starea la 12 gros. */}
            <OverflowingText
              style={{
                "font-family": '"De Fonte BBT", Inter, sans-serif',
                "font-size": "18px",
                "font-weight": 400,
                "letter-spacing": "0.01em",
                "font-synthesis": "none",
              }}
            >
              {/* BBT: numele afișat (ca în lista de prieteni), nu username-ul. */}
              <TextWithEmoji content={props.channel.recipient?.displayName} />
            </OverflowingText>
            <span
              style={{
                display: "block",
                "font-size": "12px",
                "font-weight": 700,
                color: props.channel.recipient?.online ? "#216043" : "#8D8D9A",
              }}
            >
              {props.channel.recipient?.online ? "online" : "offline"}
            </span>
          </div>
        </Match>
        <Match when={props.channel.type === "SavedMessages"}>
          <HeaderIcon>
            <Symbol>note_stack</Symbol>
          </HeaderIcon>
          <Trans>Saved Notes</Trans>
        </Match>
      </Switch>

      <Spacer />

      <Show when={props.channel.isVoice && !voice.showCard(props.channel)}>
        <IconButton
          onPress={() => voice.connect(props.channel)}
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Join the voice channel`,
            },
          }}
        >
          <Symbol>call</Symbol>
        </IconButton>
      </Show>

      <Show
        when={
          (props.channel.type === "Group" || props.channel.serverId) &&
          props.channel.orPermission("ManageChannel", "ManagePermissions")
        }
      >
        <IconButton
          onPress={() =>
            openModal({
              type: "settings",
              config: "channel",
              context: props.channel,
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Channel Settings`,
            },
          }}
        >
          <MdSettings />
        </IconButton>
      </Show>

      <Show when={props.channel.type === "Group"}>
        <Button
          variant="text"
          size="icon"
          onPress={() =>
            openModal({
              type: "add_members_to_group",
              group: props.channel,
              client: client(),
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Add friends to group`,
            },
          }}
        >
          <MdPersonAdd />
        </Button>
      </Show>

      <Show when={props.sidebarState && props.channel.type !== "DirectMessage"}>
        <IconButton
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`View pinned messages`,
            },
          }}
          onPress={() =>
            props.sidebarState!().state === "pins"
              ? props.setSidebarState!({
                  state: "default",
                })
              : props.setSidebarState!({
                  state: "pins",
                })
          }
        >
          {/* BBT: glifa `keep` (→ pin Lucide), nu SVG-ul local Material, care ocolea harta iconițelor. */}
          <Symbol>keep</Symbol>
        </IconButton>
      </Show>

      {/* BBT (23a): „Vezi profilul" arată și ascunde profilul din dreapta conversației (`ProfilConversatie.tsx`). Pe
          telefon nu e loc de panou, deci nici de buton. */}
      <Show
        when={props.channel.type === "DirectMessage" && layout() !== "phone"}
      >
        <button
          type="button"
          class="bbt-buton-panou"
          aria-pressed={state.layout.getSectionState(
            LAYOUT_SECTIONS.MEMBER_SIDEBAR,
            true,
          )}
          onClick={() =>
            state.layout.toggleSectionState(
              LAYOUT_SECTIONS.MEMBER_SIDEBAR,
              true,
            )
          }
          style={{
            // 23a: 8 / 14, text de 13 gros, gri.
            height: "34px",
            padding: "0 14px",
            "border-radius": "999px",
            border: 0,
            background: "#F2F2F3",
            color: "#6C6C6D",
            "font-family": "inherit",
            "font-size": "13px",
            "font-weight": 700,
            cursor: "pointer",
          }}
        >
          {state.layout.getSectionState(LAYOUT_SECTIONS.MEMBER_SIDEBAR, true)
            ? "Ascunde profilul"
            : "Vezi profilul"}
        </button>
      </Show>

      <Show
        when={
          props.sidebarState &&
          canIHasSidebar(props.channel) &&
          props.channel.type !== "DirectMessage"
        }
      >
        {/* BBT: sub 1180px panoul membrilor nu mai are loc (`bbt/raspuns.css`), deci nici butonul lui. */}
        <span class="bbt-buton-panou" style={{ display: "contents" }}>
          <IconButton
            onPress={() => {
              if (props.sidebarState!().state === "default") {
                state.layout.toggleSectionState(
                  LAYOUT_SECTIONS.MEMBER_SIDEBAR,
                  true,
                );
              } else {
                state.layout.setSectionState(
                  LAYOUT_SECTIONS.MEMBER_SIDEBAR,
                  true,
                  true,
                );

                props.setSidebarState!({
                  state: "default",
                });
              }
            }}
            use:floating={{
              tooltip: {
                placement: "bottom",
                content: t`View members`,
              },
            }}
          >
            <MdGroup />
          </IconButton>
        </span>
      </Show>

      {/* BBT: pe desktop căutarea stă în bara de sus (src/bbt/BaraSus.tsx); aici rămâne doar
          iconița, pe telefon și tabletă, unde bara de sus n-are câmp. */}
      <Show when={searchValue() !== null && layout() !== "desktop"}>
        <IconButton
          onPress={() => props.setSidebarState!({ state: "search", query: "" })}
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Search`,
            },
          }}
        >
          <Symbol>search</Symbol>
        </IconButton>
      </Show>
    </>
  );
}

/**
 * Vertical divider between name and topic
 */
const Divider = styled("div", {
  base: {
    height: "20px",
    margin: "0px 5px",
    paddingLeft: "1px",
    backgroundColor: "var(--md-sys-color-outline-variant)",
  },
});

/**
 * Link for the description
 */
const descriptionLink = css({
  minWidth: 0,
});

const mobileOverflow = css({
  _phone: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});
