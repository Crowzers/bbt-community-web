import { BiRegularCheckCircle, BiSolidCheckCircle } from "solid-icons/bi";
import {
  Accessor,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  onMount,
} from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import type { Channel, Server, ServerFlags } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import {
  Column,
  Draggable,
  Header,
  Row,
  Tooltip,
  iconSize,
  symbolSize,
} from "@revolt/ui";
import { UnreadCallout } from "@revolt/ui/components/features/navigation/UnreadCallout";
import { VoiceChannelPreview } from "@revolt/ui/components/features/voice/VoiceChannelPreview";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdChevronRight from "@material-design-icons/svg/filled/chevron_right.svg?component-solid";
import MdSettings from "@material-symbols/svg-400/outlined/settings-fill.svg?component-solid";

import { AvatarCanal } from "../../../bbt/AvatarCanal";
import { CardAzi, experientaDeAzi } from "../../../bbt/CardAzi";
import { useExperiente } from "../../../bbt/cont/date";
import { SidebarBase } from "./common";
import {
  OrderedCategory,
  applyChannelOrdering,
  orderedCategories,
} from "./ordering";

interface Props {
  /**
   * Server to display sidebar for
   */
  server: Server;

  /**
   * Currently selected channel ID
   */
  channelId: string | undefined;

  /**
   * Open server information modal
   */
  openServerInfo: () => void;

  /**
   * Open server settings modal
   */
  openServerSettings: () => void;

  /**
   * Menu generator
   */
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}

/**
 * Ordered category data returned from server
 */
type CategoryData = OrderedCategory & { channels: Channel[] };

type OrderingEvent =
  | {
      type: "categories";
      ids: string[];
    }
  | {
      type: "category";
      id: string;
      reorderedIds: string[];
      visibleIds: string[];
      moved: boolean;
    };

/**
 * Display server information and channels
 */
export const ServerSidebar = (props: Props) => {
  const navigate = useNavigate();
  const { isMobile, layout } = useDevice();
  const experiente = useExperiente();
  const azi = () => experientaDeAzi(experiente.data?.active);

  // Users can manage certain parts of the server individually, regardless of their ManageServer Permission
  const canManageServer = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  const categories = createMemo<CategoryData[]>(() => {
    const channels = new Map(
      props.server.channels.map((channel) => [channel.id, channel]),
    );

    return orderedCategories(
      props.server.categories,
      props.server.channels.map((channel) => channel.id),
    ).map((category) => ({
      ...category,
      channels: category.channelIds
        .map((id) => channels.get(id)!)
        .filter((channel) => channel),
    }));
  });

  // TODO: this does not filter visible channels at the moment because the state for categories is not stored anywhere
  /** Gets a list of channels that are currently not hidden inside a closed category */
  const visibleChannels = () =>
    categories().flatMap((category) => category.channels);

  // TODO: when navigating channels, we want to add aria-keyshortcuts={localized-shortcut} to the next/previous channels
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts
  // TODO: issue warning if nothing is found somehow? warnings can be nicer than flat out not working
  // TODO: we want it to feel smooth when navigating through channels, so we'll want to select channels immediately but not actually navigate until we're done moving through them
  /** Navigates to the channel offset from the current one, wrapping around if needed */
  const navigateChannel = (byOffset: number) => {
    if (props.channelId == null) return;

    const channels = visibleChannels();

    const currentChannelIndex = channels.findIndex(
      (channel) => channel.id === props.channelId,
    );

    // this will wrap the index around
    const nextChannel = channels.at(
      (currentChannelIndex + byOffset) % channels.length,
    );

    if (nextChannel) {
      navigate(`/server/${props.server.id}/channel/${nextChannel.id}`);
    }
  };

  createKeybind(KeybindAction.NAVIGATION_CHANNEL_UP, () => navigateChannel(-1));

  createKeybind(KeybindAction.NAVIGATION_CHANNEL_DOWN, () =>
    navigateChannel(1),
  );

  createKeybind(KeybindAction.CHAT_MARK_SERVER_AS_READ, () => {
    if (props.server.unread) {
      props.server.ack();
    }
  });

  const noOrdering = () => !props.server.havePermission("ManageChannel");

  const [list, setList] = createSignal<HTMLDivElement>();

  let heldEvent: OrderingEvent & { type: "category" } = null!;
  function handleOrdering(event: OrderingEvent) {
    if (event.type === "category" && event.moved && !heldEvent) {
      heldEvent = event;
      return;
    }

    if (event.type === "categories") {
      const ids = event.ids.filter((id) => id !== "default");

      props.server.edit({
        categories: ["default", ...ids]
          .map((id) => categories().find((category) => category.id === id)!)
          .filter((category) => category)
          .map(({ id, title, channelIds }) => ({
            id,
            title,
            channels: channelIds,
          })),
      });
    } else {
      props.server.edit({
        categories: categories().map(({ id, title, channelIds }) => {
          const reordered =
            heldEvent?.id === id
              ? heldEvent
              : event.id === id
                ? event
                : undefined;

          return {
            id,
            title,
            channels: reordered
              ? applyChannelOrdering(
                  channelIds,
                  reordered.visibleIds,
                  reordered.reorderedIds,
                )
              : channelIds,
          };
        }),
      });

      heldEvent = null!;
    }
  }

  return (
    <SidebarBase
      class="channel_bar server"
      use:floating={props.menuGenerator(props.server)}
    >
      <Switch
        fallback={
          <Header placement="secondary">
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        }
      >
        <Match when={props.server.banner}>
          <Header
            image
            placement="secondary"
            style={{
              background: `url('${props.server.bannerURL}')`,
            }}
          >
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        </Match>
      </Switch>
      {/* BBT: cardul de azi (21a), deasupra canalelor. Pe telefon stă în `ComunitateTelefon`. */}
      <Show when={layout() !== "phone" && azi()}>
        {(e) => (
          <div style={{ "padding-top": "8px" }}>
            <CardAzi
              e={e()}
              margine={12}
              laTabara={() => navigate("/cont/experiente")}
            />
          </div>
        )}
      </Show>
      <ChannelList>
        <UnreadCallout list={list} />
        <div
          ref={setList}
          use:invisibleScrollable
          style={{ height: "100%" }}
          use:floating={props.menuGenerator(props.server)}
        >
          <Show
            when={categories().find((category) => category.id === "default")}
          >
            {(category) => (
              <Category
                server={props.server}
                category={category()}
                channelId={props.channelId}
                menuGenerator={props.menuGenerator}
                dragDisabled={() => true}
                setDragDisabled={() => void 0}
                noOrdering={noOrdering}
                handleOrdering={handleOrdering}
              />
            )}
          </Show>
          <Draggable
            dragHandles
            dropIndicator
            type="category"
            //TODO - No channel ordering on mobile due to usability issue
            //Consider adding a way to enable reordering with dragHandles in server settings
            disabled={isMobile || noOrdering()}
            items={categories().filter((category) => category.id !== "default")}
            onChange={(ids) => handleOrdering({ type: "categories", ids })}
          >
            {(entry) => (
              <Category
                server={props.server}
                category={entry.item}
                channelId={props.channelId}
                menuGenerator={props.menuGenerator}
                dragDisabled={entry.dragDisabled}
                setDragDisabled={entry.setDragDisabled}
                noOrdering={noOrdering}
                handleOrdering={handleOrdering}
              />
            )}
          </Draggable>
        </div>
      </ChannelList>
    </SidebarBase>
  );
};

const ChannelList = styled("div", {
  base: {
    position: "relative",
    flexGrow: 1,
    minHeight: 0,
    marginBottom: "var(--gap-md)",
  },
});

/**
 * Server Information
 */
function ServerInfo(
  props: Pick<Props, "server" | "openServerInfo" | "openServerSettings"> & {
    canManageServer: boolean;
  },
) {
  const client = useClient();

  // BBT (pânza TRW): sub nume, „● N online · M membri". Lista de membri se aduce o dată pe sesiune
  // (`syncMembers` ține minte), aceeași pe care o folosește și coloana de membri.
  onMount(() => void props.server.syncMembers().catch(() => {}));
  const numarare = createMemo(() => {
    let total = 0;
    let online = 0;
    for (const member of client().serverMembers.values()) {
      if (member.id.server !== props.server.id) continue;
      total++;
      if (member.user?.online) online++;
    }
    return { total, online };
  });
  const numar = (n: number) => n.toLocaleString("ro-RO");

  return (
    <Row align grow minWidth={0}>
      <ServerBadge flags={props.server.flags} />
      <ServerName onClick={props.openServerInfo}>
        {/* 21a: „Canale" mare, nu numele serverului (în BBT Community e unul singur). */}
        <span
          style={{
            display: "block",
            "font-family": '"De Fonte BBT", Inter, sans-serif',
            "font-size": "22px",
            "font-weight": 400,
            "letter-spacing": "0.01em",
            "font-synthesis": "none",
            "line-height": "1.15",
          }}
        >
          Canale
        </span>
        <Show when={numarare().total > 0}>
          <span
            style={{
              display: "block",
              "font-size": "12px",
              "font-weight": 700,
              "line-height": "1.3",
              color: "#216043",
            }}
          >
            ● {numar(numarare().online)} online · {numar(numarare().total)}{" "}
            membri
          </span>
        </Show>
      </ServerName>
      <Show when={props.canManageServer}>
        {/* Cercul gri de 34 din 21a. */}
        <button
          type="button"
          aria-label="Setările serverului"
          onClick={() => props.openServerSettings()}
          style={{
            width: "34px",
            height: "34px",
            "flex-shrink": 0,
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "border-radius": "50%",
            border: 0,
            background: "#F2F2F3",
            color: "#0A0A0B",
            cursor: "pointer",
          }}
        >
          <MdSettings {...symbolSize(18)} />
        </button>
      </Show>
    </Row>
  );
}

/**
 * Server name
 */
const ServerName = styled("a", {
  base: {
    flexGrow: 1,
    minWidth: 0,

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

/**
 * Server badge
 */
function ServerBadge(props: { flags: ServerFlags }) {
  const { t } = useLingui();

  return (
    <Show when={props.flags}>
      <Tooltip
        content={props.flags === 1 ? t`Official Server` : t`Verified`}
        placement="top"
      >
        {props.flags === 1 ? (
          <BiSolidCheckCircle size={12} />
        ) : (
          <BiRegularCheckCircle size={12} />
        )}
      </Tooltip>
    </Show>
  );
}

/**
 * Single category entry
 */
function Category(
  props: {
    server: Server;
    category: CategoryData;
    channelId: string | undefined;
    noOrdering: Accessor<boolean>;
    handleOrdering: (event: OrderingEvent) => void;
  } & Pick<Props, "menuGenerator"> & {
      dragDisabled: Accessor<boolean>;
      setDragDisabled: (value: boolean) => void;
    },
) {
  const state = useState();
  const isOpen = () => state.layout.getSectionState(props.category.id, true);
  const { isMobile } = useDevice();

  const channels = createMemo(() =>
    props.category.channels.filter(
      (channel) =>
        props.category.id === "default" ||
        isOpen() ||
        channel.unread ||
        channel.id === props.channelId,
    ),
  );

  return (
    <CategorySection>
      <Show when={props.category.id !== "default"}>
        <div use:floating={props.menuGenerator(props.category as never)}>
          <CategoryBase
            open={isOpen()}
            onClick={() => {
              state.layout.toggleSectionState(props.category.id, true);
            }}
            {...createDragHandle(props.dragDisabled, props.setDragDisabled)}
          >
            <MdChevronRight {...iconSize(11)} />
            {props.category.title}
          </CategoryBase>
        </div>
      </Show>
      <Draggable
        dropIndicator
        type="channels"
        items={channels()}
        onChange={(reorderedIds) => {
          const current = channels();
          props.handleOrdering({
            type: "category",
            id: props.category.id,
            reorderedIds,
            visibleIds: current.map((channel) => channel.id),
            moved: reorderedIds.length !== current.length,
          });
        }}
        //TODO - No channel ordering on mobile due to usability issue
        //Consider adding a way to enable reordering with dragHandles in server settings
        disabled={isMobile || props.noOrdering() || !isOpen()}
        minimumDropAreaHeight="42px"
      >
        {(entry) => (
          <Entry
            channel={entry.item}
            active={entry.item.id === props.channelId}
            menuGenerator={props.menuGenerator}
          />
        )}
      </Draggable>
    </CategorySection>
  );
}

// BBT (pânza TRW): categorii și rânduri dense, fără blocuri colorate — vezi `RandCanal` mai jos.
const CategorySection = styled("div", {
  base: {
    display: "flex",
    gap: "1px",
    flexDirection: "column",
    padding: "0 8px",
    background: "transparent",
  },
});

/**
 * Category title styling
 */
const CategoryBase = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "14px 8px 4px",

    cursor: "pointer",
    userSelect: "none",
    transition: "var(--transitions-fast) all",

    "--color": "#8D8D9A",
    color: "var(--color)",
    fill: "var(--color)",

    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",

    "&:hover": {
      "--color": "#0A0A0B",
    },

    "& svg": {
      transition: "var(--transitions-fast) transform",
    },
  },
  variants: {
    open: {
      true: {
        "& svg": {
          transform: "rotateZ(90deg)",
        },
      },
    },
  },
});

/**
 * Server channel entry
 */
function Entry(
  props: { channel: Channel; active: boolean } & Pick<Props, "menuGenerator">,
) {
  const state = useState();
  const voice = useVoice();
  const { openModal } = useModals();
  const { isMobile } = useDevice();

  const canEditChannel = createMemo(() =>
    (["ManageChannel", "ManagePermissions", "ManageWebhooks"] as const).some(
      (perm) => props.channel.server?.havePermission(perm),
    ),
  );

  const inCall = () => props.channel.id === voice.channel()?.id;

  const attentionState = createMemo(() =>
    props.active
      ? "selected"
      : inCall()
        ? "active"
        : state.notifications.isChannelMuted(props.channel)
          ? "muted"
          : props.channel.unread
            ? "active"
            : "normal",
  );

  return (
    <Column gap="sm">
      <RandCanal
        href={`/server/${props.channel.serverId}/channel/${props.channel.id}`}
        use:floating={props.menuGenerator(props.channel)}
        // BBT: pe telefon, apăsarea pe canal îl și deschide (glisează ecranul canalului) — ca
        // `MenuButton`-ul pe care l-a înlocuit rândul ăsta; fără asta, rămâneai pe listă (6 oct 2026).
        onClick={() => state.appDrawer()?.setShown(true)}
        data-unread={props.channel.unread ? "" : undefined}
        data-mentions={props.channel.mentions?.size || undefined}
        activ={props.active}
        stare={attentionState()}
      >
        {/* 21a avea aici un cerc colorat de 28; acum e avatarul din aplicație, cu iconul canalului când are unul. */}
        <AvatarCanal canal={props.channel} marime={32} />
        <span class="nume">
          <TextWithEmoji content={props.channel.name!} />
        </span>
        <Show when={!props.active && (props.channel.mentions?.size ?? 0) > 0}>
          <span class="mentiuni">{props.channel.mentions!.size}</span>
        </Show>
        <Show when={!isMobile && canEditChannel()}>
          <span
            class="actiuni"
            role="button"
            aria-label="Setările canalului"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openModal({
                type: "settings",
                config: "channel",
                context: props.channel,
              });
            }}
          >
            <Symbol size={14}>settings</Symbol>
          </span>
        </Show>
      </RandCanal>

      <VoiceChannelPreview channel={props.channel} />
    </Column>
  );
}

/**
 * BBT: rândul de canal din pânza TRW — 28px, 13px, colțuri de 6px. Stări: activ (alb 10%), necitit
 * (alb, îngroșat), mut (stins), normal (alb 60%). Mențiunile = pastilă roșie cu numărul.
 * Înlocuiește `MenuButton`-ul lor (pastile de 40px, prea „voluminoase" pentru user).
 */
const RandCanal = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    // BBT (21a, 30 oct 2026): rânduri de 44 (6 + avatarul de 32 + 6), colțuri de 14, text de 14, pe alb. Până atunci
    // 28 / 6 / 13, pe negru.
    gap: "10px",
    height: "44px",
    padding: "0 10px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#6C6C6D",

    fill: "currentColor",
    textDecoration: "none",
    cursor: "pointer",
    flexShrink: 0,

    "& .nume": {
      flexGrow: 1,
      minWidth: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .mentiuni": {
      minWidth: "20px",
      height: "20px",
      padding: "0 6px",
      boxSizing: "border-box",
      borderRadius: "999px",
      // Cifra roz cu text negru, ca în 21a și în lista de mesaje.
      background: "#FFA8CD",
      color: "#0A0A0B",
      fontSize: "12px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "& .actiuni": {
      display: "none",
      color: "#6C6C6D",
    },
    "&:hover": {
      background: "#F2F2F3",
      color: "#0A0A0B",
    },
    "&:hover .actiuni": {
      display: "flex",
    },
  },
  variants: {
    activ: {
      true: {
        background: "#F2F2F3 !important",
        color: "#0A0A0B !important",
        fontWeight: 700,
      },
    },
    stare: {
      selected: {},
      active: { color: "#0A0A0B", fontWeight: 600 },
      muted: { opacity: 0.45 },
      normal: {},
    },
  },
});
