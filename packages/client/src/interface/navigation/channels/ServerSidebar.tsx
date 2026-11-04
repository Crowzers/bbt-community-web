import { Accessor, JSX, Show, createMemo, createSignal } from "solid-js";

import type { Channel, Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useDevice } from "@revolt/common";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useLocation, useNavigate } from "@revolt/routing";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { Column, Draggable, iconSize } from "@revolt/ui";
import { UnreadCallout } from "@revolt/ui/components/features/navigation/UnreadCallout";
import { VoiceChannelPreview } from "@revolt/ui/components/features/voice/VoiceChannelPreview";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdChevronRight from "@material-design-icons/svg/filled/chevron_right.svg?component-solid";

import { AvatarCanal } from "../../../bbt/AvatarCanal";
import { CardAzi, experientaDeAzi } from "../../../bbt/CardAzi";
import { CardCont } from "../../../bbt/CardCont";
import { useExperiente } from "../../../bbt/cont/date";
import { tineMinteLista } from "../../../bbt/intoarcere";
import { SalutTelefon } from "../../../bbt/SalutTelefon";
import { IconBilet } from "../../../bbt/telefon";
import { S1 } from "../../../bbt/tema";
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
      {/* BBT: fără titlul „Canale" și fără rotiță (S1, 4 nov 2026, cererea userului: „să nu mai scrie Comunitate BBT sus, să
          fie direct Experiențele tale"). Lista începe cu butonul experiențelor; Administrarea rămâne în Profil și pe rotița
          fiecărui canal. Pe telefon, deasupra lui stă salutul cu clopoțelul (decizia 11), fiindcă acolo n-are bară de sus. */}
      <Show when={layout() === "phone"}>
        <SalutTelefon />
      </Show>
      <ButonExperiente />
      {/* BBT: cardul de azi (21a), deasupra canalelor, și pe telefon (până pe 4 nov stătea acolo în `ComunitateTelefon`). */}
      <Show when={azi()}>
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
      <CardCont />
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
 * BBT: „Experiențele tale", primul rând din listă (S1, decizia 10): duce la taberele, cursurile și biletele tale, cu numărul
 * lor. Punctul roz = ceva de făcut acum (o plată, o semnătură), cum era pe Experiențe în pastila de până pe 4 nov.
 */
function ButonExperiente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const experiente = useExperiente();
  const numar = () => experiente.data?.active.length ?? 0;
  const deFacut = () => !!experiente.data?.active.some((e) => e.plata);

  return (
    <button
      type="button"
      class="bbt-moale"
      onClick={() => {
        tineMinteLista(location.pathname);
        navigate("/cont/experiente");
      }}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        "flex-shrink": 0,
        margin: "12px 10px 4px",
        // Pe telefon 44, ținta minimă de deget (studiul, §6).
        height: telefon() ? "44px" : "40px",
        padding: "0 12px",
        border: 0,
        "border-radius": "10px",
        background: S1.placa,
        color: "#FFFFFF",
        cursor: "pointer",
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": 600,
        "text-align": "left",
      }}
    >
      <span style={{ display: "flex", color: "#FFA8CD" }}>
        <IconBilet size={18} />
      </span>
      <span style={{ flex: 1 }}>Experiențele tale</span>
      <Show when={deFacut()}>
        <span
          aria-label="Ai ceva de făcut"
          style={{
            width: "8px",
            height: "8px",
            "border-radius": "50%",
            background: "#FFA8CD",
          }}
        />
      </Show>
      <Show when={numar() > 0}>
        <span style={{ color: S1.stins, "font-weight": 500 }}>{numar()}</span>
      </Show>
    </button>
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

// BBT (pânza TRW, apoi S1): categorii și rânduri dense, fără blocuri colorate — vezi `RandCanal` mai jos.
const CategorySection = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    flexDirection: "column",
    padding: "0 10px",
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

    // S1 (4 nov 2026): 13/600 fără majuscule, ca etichetele de pe site după Klarna; până atunci 11 cu majuscule.
    "--color": "#8F88A3",
    color: "var(--color)",
    fill: "var(--color)",

    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: 600,

    _phone: {
      fontSize: "14px",
      padding: "16px 8px 6px",
    },

    "&:hover": {
      "--color": "#FFFFFF",
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
  const navigate = useNavigate();
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
        {/* Avatarul din aplicație, cu iconul canalului când are unul. */}
        <AvatarCanal canal={props.channel} marime={20} />
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
              // BBT: în Administrarea noastră, nu în panoul lor.
              navigate(`/cont/administrare/${props.channel.id}`);
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
 * BBT: rândul de canal. S1 (4 nov 2026, studiul Slack/Discord, deciziile 4 și 6): 32 de înălțime, ca la Slack, pe cerneală.
 * Stări: deschis (roz, text negru), necitit (alb, gros), mut (stins), citit (#B9B3C7). Mențiunile = pastilă roz cu numărul.
 * Înlocuiește `MenuButton`-ul lor (pastile de 40px, prea „voluminoase" pentru user).
 *
 * Până pe 4 nov: rânduri de 48 pe alb (25d), cu avatarul de 28. La un singur canal pe ecran, lista părea goală.
 */
const RandCanal = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "32px",
    padding: "0 10px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#B9B3C7",

    fill: "currentColor",
    textDecoration: "none",
    cursor: "pointer",
    flexShrink: 0,

    // Pe telefon 40 și 16, ca în schița „HubCampusTelTRW": rândul trebuie nimerit cu degetul, iar 16 e pragul de text citit.
    _phone: {
      height: "40px",
      padding: "0 12px",
      fontSize: "16px",
    },

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
      color: "#B9B3C7",
    },
    "&:hover": {
      background: "#2A2340",
      color: "#FFFFFF",
    },
    "&:hover .actiuni": {
      display: "flex",
    },
  },
  variants: {
    activ: {
      true: {
        background: "#FFA8CD !important",
        color: "#0A0A0B !important",
        fontWeight: 600,
      },
    },
    stare: {
      selected: {},
      active: { color: "#FFFFFF", fontWeight: 700 },
      muted: { opacity: 0.45 },
      normal: {},
    },
  },
});
