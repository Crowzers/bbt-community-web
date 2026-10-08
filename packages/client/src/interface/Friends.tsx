import {
  Accessor,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  splitProps,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import type { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import {
  Avatar,
  Badge,
  Deferred,
  Header,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  NavigationRail,
  NavigationRailItem,
  OverflowingText,
  UserStatus,
  main,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Base layout of the friends page
 */
const Base = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",

    "& .FriendsList": {
      height: "100%",
      paddingInline: "var(--gap-lg)",
    },
  },
});

/**
 * Friends menu
 */
export function Friends() {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  /**
   * Reference to the parent scroll container
   */
  let scrollTargetElement!: HTMLDivElement;

  /**
   * Signal required for reacting to ref changes
   */
  const targetSignal = () => scrollTargetElement;

  /**
   * Generate lists of all users
   */
  const lists = createMemo(() => {
    const list = client()!.users.toList();

    const friends = list
      .filter((user) => user.relationship === "Friend")
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      friends,
      online: friends.filter((user) => user.online),
      incoming: list
        .filter((user) => user.relationship === "Incoming")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      outgoing: list
        .filter((user) => user.relationship === "Outgoing")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      blocked: list
        .filter((user) => user.relationship === "Blocked")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  });

  const pending = () => {
    const incoming = lists().incoming;
    return incoming.length > 99 ? "99+" : incoming.length;
  };

  // BBT: cine are cereri de prietenie primite aterizează direct pe ele — altfel stăteau în fila
  // „În așteptare", după o bulină pe care puțini o observă.
  const [page, setPage] = createSignal(
    lists().incoming.length > 0 ? "pending" : "online",
  );

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <Symbol>group</Symbol>
        </HeaderIcon>
        <Trans>Friends</Trans>
      </Header>

      <main class={main()}>
        <div
          style={{
            position: "relative",
            "min-height": 0,
          }}
        >
          <NavigationRail contained value={page} onValue={setPage}>
            <div style={{ "margin-top": "6px", "margin-bottom": "12px" }}>
              <IconButton
                variant="filled"
                shape="square"
                onPress={() =>
                  openModal({
                    type: "add_friend",
                    client: client(),
                  })
                }
                use:floating={{
                  tooltip: {
                    placement: "right",
                    content: t`Add a new friend`,
                  },
                }}
              >
                <Symbol>add</Symbol>
              </IconButton>
            </div>

            <NavigationRailItem
              icon={<Symbol>waving_hand</Symbol>}
              value="online"
            >
              <Trans>Online</Trans>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>all_inbox</Symbol>} value="all">
              <Trans>All</Trans>
            </NavigationRailItem>
            <NavigationRailItem
              icon={<Symbol>notifications</Symbol>}
              value="pending"
            >
              {/* BBT: în română, fără catalog */}
              În așteptare
              <Show when={pending()}>
                <Badge slot="badge" variant="large">
                  {pending()}
                </Badge>
              </Show>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>block</Symbol>} value="blocked">
              <Trans>Blocked</Trans>
            </NavigationRailItem>
          </NavigationRail>

          <Deferred>
            <div class="FriendsList" ref={scrollTargetElement} use:scrollable>
              <Switch
                fallback={
                  <People
                    title="Online"
                    users={lists().online}
                    scrollTargetElement={targetSignal}
                  />
                }
              >
                <Match when={page() === "all"}>
                  <People
                    title="Toți"
                    users={lists().friends}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "pending"}>
                  <People
                    title="Primite"
                    users={lists().incoming}
                    scrollTargetElement={targetSignal}
                  />
                  <People
                    title="Trimise"
                    users={lists().outgoing}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "blocked"}>
                  <People
                    title="Blocați"
                    users={lists().blocked}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
              </Switch>
            </div>
          </Deferred>
        </div>
      </main>
    </Base>
  );
}

/**
 * List of users
 */
function People(props: {
  users: User[];
  title: string;
  scrollTargetElement: Accessor<HTMLDivElement>;
}) {
  return (
    <List>
      <ListSubheader>
        {props.title} {"–"} {props.users.length}
      </ListSubheader>

      <Show when={props.users.length === 0}>
        <ListItem disabled>Nimeni deocamdată.</ListItem>
      </Show>

      <VirtualContainer
        items={props.users}
        scrollTarget={props.scrollTargetElement()}
        itemSize={{ height: 58 }}
        // grid rendering:
        // itemSize={{ height: 60, width: 240 }}
        // crossAxisCount={(measurements) =>
        //   Math.floor(measurements.container.cross / measurements.itemSize.cross)
        // }
        // width: 100% needs to be removed from listentry below for this to work ^^^
      >
        {(item) => (
          <ContainerListEntry
            style={{
              ...item.style,
            }}
          >
            <Entry
              role="listitem"
              tabIndex={item.tabIndex}
              style={item.style}
              user={item.item}
            />
          </ContainerListEntry>
        )}
      </VirtualContainer>
    </List>
  );
}

const ContainerListEntry = styled("div", {
  base: {
    width: "100%",
  },
});

/**
 * Single user entry
 */
function Entry(
  props: { user: User } & Omit<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >,
) {
  const { openModal } = useModals();
  const [local, remote] = splitProps(props, ["user"]);

  return (
    <a
      {...remote}
      use:floating={{
        contextMenu: () => <UserContextMenu user={local.user} />,
      }}
      onClick={() => openModal({ type: "user_profile", user: local.user })}
    >
      <ListItem>
        <Avatar
          slot="icon"
          size={36}
          src={local.user.animatedAvatarURL}
          holepunch={
            props.user.relationship === "Friend" ? "bottom-right" : "none"
          }
          overlay={
            <Show when={props.user.relationship === "Friend"}>
              <UserStatus.Graphic
                status={props.user.status?.presence ?? "Online"}
              />
            </Show>
          }
        />
        <OverflowingText>{local.user.displayName}</OverflowingText>
        <span
          slot="end-icon"
          style={{ display: "flex", gap: "8px", "align-items": "center" }}
        >
          <ActiuniRand user={local.user} />
        </span>
      </ListItem>
    </a>
  );
}

/**
 * BBT: acțiunile direct pe rând, ca la Discord.
 *
 * Plângerea (8 oct 2026): „când vrei să dai accept e un pop-up contraintuitiv — trebuie să apară
 * butonul de accept la îndemână, nu să dai pe cele 3 puncte". La ei, acceptarea stătea doar în
 * meniul contextual (clic dreapta / apăsare lungă), iar clicul pe rând deschidea profilul.
 *
 * ⚠️ Rândul e un `<a>` cu `onClick` (deschide profilul): butoanele opresc propagarea, altfel o
 * acceptare ar deschide și profilul peste.
 */
function ActiuniRand(props: { user: User }) {
  const navigate = useNavigate();
  const [lucrez, setLucrez] = createSignal(false);

  function apasa(e: MouseEvent, actiune: () => Promise<unknown>) {
    e.preventDefault();
    e.stopPropagation();
    if (lucrez()) return;
    setLucrez(true);
    actiune()
      .catch((err) =>
        console.error("[bbt] prietenia n-a putut fi schimbată", err),
      )
      .finally(() => setLucrez(false));
  }

  return (
    <Switch>
      <Match when={props.user.relationship === "Incoming"}>
        <ButonRand
          eticheta="Acceptă"
          plin
          onClick={(e) => apasa(e, () => props.user.addFriend())}
        >
          <Symbol>check</Symbol>
          Acceptă
        </ButonRand>
        <ButonRand
          eticheta="Refuză"
          onClick={(e) => apasa(e, () => props.user.removeFriend())}
        >
          <Symbol>close</Symbol>
        </ButonRand>
      </Match>
      <Match when={props.user.relationship === "Outgoing"}>
        <ButonRand
          eticheta="Anulează cererea"
          onClick={(e) => apasa(e, () => props.user.removeFriend())}
        >
          Anulează
        </ButonRand>
      </Match>
      <Match when={props.user.relationship === "Friend"}>
        <ButonRand
          eticheta="Mesaj"
          onClick={(e) =>
            apasa(e, () =>
              props.user.openDM().then((canal) => navigate(canal.path)),
            )
          }
        >
          <Symbol>chat</Symbol>
        </ButonRand>
      </Match>
      <Match when={props.user.relationship === "Blocked"}>
        <ButonRand
          eticheta="Deblochează"
          onClick={(e) => apasa(e, () => props.user.unblockUser())}
        >
          Deblochează
        </ButonRand>
      </Match>
    </Switch>
  );
}

function ButonRand(props: {
  eticheta: string;
  plin?: boolean;
  onClick: (e: MouseEvent) => void;
  children: JSX.Element;
}) {
  return (
    <button
      aria-label={props.eticheta}
      title={props.eticheta}
      onClick={props.onClick}
      style={{
        height: "34px",
        "min-width": "34px",
        padding: "0 12px",
        display: "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        gap: "6px",
        "border-radius": "17px",
        border: props.plin ? "none" : "1px solid rgb(255 255 255 / 16%)",
        background: props.plin ? "#fff" : "transparent",
        color: props.plin ? "#000" : "#fff",
        "font-size": "13px",
        "font-weight": 600,
        cursor: "pointer",
        "white-space": "nowrap",
      }}
    >
      {props.children}
    </button>
  );
}
