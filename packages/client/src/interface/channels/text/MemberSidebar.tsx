import { createMemo, Match, Show, Switch } from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { Channel, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { floatingUserMenus } from "@revolt/app/menus/UserContextMenu";
import { useClient } from "@revolt/client";
import { createIsTimedOut } from "@revolt/common/lib/createIsTimedOut";
import { TextWithEmoji } from "@revolt/markdown";
import { userInformation } from "@revolt/markdown/users";
import {
  Avatar,
  ColouredText,
  Deferred,
  Symbol,
  Tooltip,
  UserStatus,
} from "@revolt/ui";

interface Props {
  /**
   * Channel
   */
  channel: Channel;

  /**
   * Scroll target element
   */
  scrollTargetElement: HTMLDivElement;

  /**
   * Whether the server is very large and should not display all member information
   */
  isLargeServer?: boolean;
}

/**
 * Member Sidebar
 */
export function MemberSidebar(props: Props) {
  return (
    <Switch>
      <Match when={props.channel.type === "Group"}>
        <GroupMemberSidebar
          channel={props.channel}
          scrollTargetElement={props.scrollTargetElement}
        />
      </Match>
      <Match when={props.channel.type === "TextChannel"}>
        <ServerMemberSidebar
          channel={props.channel}
          scrollTargetElement={props.scrollTargetElement}
          isLargeServer={props.isLargeServer}
        />
      </Match>
    </Switch>
  );
}

/**
 * Server Member Sidebar
 */
export function ServerMemberSidebar(props: Props) {
  const client = useClient();

  type MemberRoleElement =
    | { t: 0; name: string; count: number; icon?: string | null }
    | { t: 1; member: ServerMember; icon?: never; isOnline: boolean };

  const elements = createMemo(() => {
    const hoistedRoles = props.channel.server!.orderedRoles.filter(
      (role) => role.hoist,
    );

    // BBT (ca la TRW, 6 oct 2026): TOATĂ lumea pe grupe de rol — Echipa BBT, Moderatori, rolurile
    // din onboarding (admin, lib/stoat/roluri.ts) — online ȘI offline în aceeași grupă (offline
    // estompați, mai jos în grupă). Fără grupa separată „Offline", care ascundea rolul omului.
    const restricted = props.channel.potentiallyRestrictedChannel;
    const byRole: Map<
      string,
      { member: ServerMember; displayName: string; online: boolean }[]
    > = new Map();
    byRole.set("default", []);
    hoistedRoles.forEach((role) => byRole.set(role.id, []));

    for (const member of client().serverMembers.values()) {
      if (member.id.server !== props.channel.serverId) {
        continue;
      }
      // If the channel is restricted, check for permission
      if (restricted && !member.hasPermission(props.channel, "ViewChannel")) {
        continue;
      }

      // Only hit the store once to reduce watchers.
      // If you need to access anything on the member in a loop define a const here.
      const memberRoles = member.roles;
      const memberName = member.nickname ?? member.user?.displayName ?? "";
      const online = Boolean(member.user?.online);

      if (memberRoles.length) {
        let assigned;
        for (const hoistedRole of hoistedRoles) {
          if (memberRoles.includes(hoistedRole.id)) {
            byRole.get(hoistedRole.id)!.push({
              member,
              displayName: memberName,
              online,
            });
            assigned = true;
            break;
          }
        }

        if (assigned) continue;
      }

      byRole.get("default")!.push({
        member,
        displayName: memberName,
        online,
      });
    }

    const roles: { id: string; name: string; icon?: string }[] = [];

    const elements: MemberRoleElement[] = [];

    for (const role of hoistedRoles) {
      roles.push({
        id: role.id,
        name: role.name,
        icon: role.icon?.previewUrl,
      });
    }
    roles.push({ id: "default", name: "Membri" });

    for (const role of roles) {
      const roleMembers = byRole
        .get(role.id)!
        .sort(
          (a, b) =>
            Number(b.online) - Number(a.online) ||
            a.displayName?.localeCompare(b.displayName) ||
            0,
        );

      if (!roleMembers?.length) {
        continue;
      }

      elements.push({
        t: 0,
        name: role.name,
        icon: role.icon,
        count: roleMembers.length,
      });

      for (const member of roleMembers) {
        elements.push({
          t: 1,
          member: member.member,
          isOnline: member.online,
        });
      }
    }

    return elements;
  });

  // BBT: fără titlul „N members online" — numărul stă deja în antetul listei de canale
  // („● N online · M membri", pânza TRW); aici ar fi fost a doua oară.
  return (
    <Container>
      <Deferred>
        <VirtualContainer
          items={elements()}
          scrollTarget={props.scrollTargetElement}
          itemSize={{ height: INALTIME_RAND }}
        >
          {(item) => (
            <div
              style={{
                ...item.style,
                width: "100%",
              }}
            >
              <Switch
                fallback={
                  <CategoryTitle>
                    <Show when={item.item.icon}>
                      <RoleIcon src={item.item.icon!} alt="" />
                    </Show>
                    <span>
                      {(item.item as { name: string }).name}
                      {" — "}
                      {(item.item as { count: number }).count}
                    </span>
                  </CategoryTitle>
                }
              >
                <Match when={item.item.t === 1}>
                  <Member
                    member={(item.item as { member: ServerMember }).member}
                  />
                </Match>
              </Switch>
            </div>
          )}
        </VirtualContainer>
      </Deferred>
    </Container>
  );
}

/**
 * Group Member Sidebar
 */
export function GroupMemberSidebar(props: Props) {
  return (
    <Container>
      <CategoryTitle>
        <span>Membri — {props.channel.recipientIds.size}</span>
      </CategoryTitle>

      <Deferred>
        <VirtualContainer
          items={props.channel.recipients.toSorted((a, b) =>
            a.displayName.localeCompare(b.displayName),
          )}
          scrollTarget={props.scrollTargetElement}
          itemSize={{ height: INALTIME_RAND }}
        >
          {(item) => (
            <div
              style={{
                ...item.style,
                width: "100%",
              }}
            >
              <Member user={item.item} group={props.channel} />
            </div>
          )}
        </VirtualContainer>
      </Deferred>
    </Container>
  );
}

/**
 * BBT (pânza TRW): o singură înălțime pentru rânduri ȘI titlurile de categorie — lista e virtuală,
 * cu pas fix, deci titlul își ia aerul de sus din aceeași înălțime (aliniat jos).
 */
const INALTIME_RAND = 32;

/**
 * Container styles
 */
const Container = styled("div", {
  base: {
    padding: "0 8px 8px",
    boxSizing: "border-box",
    width: "var(--layout-width-channel-sidebar)",
  },
});

/**
 * Category Title — ca la canale: 11px, majuscule, alb 48%.
 */
const CategoryTitle = styled("div", {
  base: {
    height: `${INALTIME_RAND}px`,
    boxSizing: "border-box",
    padding: "0 8px 4px",
    display: "flex",
    alignItems: "flex-end",
    gap: "4px",

    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.48)",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
});

const RoleIcon = styled("img", {
  base: {
    width: "16px",
    height: "16px",
    borderRadius: "var(--borderRadius-sm)",
    objectFit: "cover",
  },
});

/**
 * BBT (pânza TRW): rândul unui membru — avatar 28, numele 13px în culoarea rolului, dedesubt
 * statusul în 11px. Înlocuiește `MenuButton`-ul lor de 42px (aceeași decizie ca la canale).
 */
const RandMembru = styled("div", {
  base: {
    height: `${INALTIME_RAND}px`,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 6px",
    borderRadius: "6px",
    cursor: "pointer",
    userSelect: "none",
    color: "#fff",

    "&:hover": {
      background: "rgba(255,255,255,0.06)",
    },
    "&[data-offline]": {
      opacity: 0.45,
    },

    "& .text": {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      lineHeight: 1.15,
    },
    "& .nume": {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      minWidth: 0,
      fontSize: "13px",
      fontWeight: 500,
    },
    "& .nume > span:first-child": {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .sub": {
      fontSize: "11px",
      color: "rgba(255,255,255,0.48)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
});

function Member(props: {
  user?: User;
  member?: ServerMember;
  group?: Channel;
}) {
  const { t } = useLingui();

  /**
   * Create user information
   */
  const user = () =>
    userInformation((props.user ?? props.member?.user)!, props.member);

  const timedOut = createIsTimedOut(() => props.member?.timeout);

  const moderationPerms = createMemo(() =>
    props.member?.server?.member?.hasPermission(
      props.member!.server! ?? props.group!,
      "TimeoutMembers",
    ),
  );

  // Rândul secundar = statusul scris de om (sau „Concentrat"); fără el, rândul rămâne doar cu numele.
  const status = () =>
    (props.user ?? props.member?.user)?.statusMessage((s) =>
      s === "Online"
        ? "Online"
        : s === "Busy"
          ? "Ocupat"
          : s === "Focus"
            ? "Concentrat"
            : s === "Idle"
              ? "Inactiv"
              : "Offline",
    );

  return (
    <div
      use:floating={floatingUserMenus(
        (props.user ?? props.member?.user)!,
        props.member,
        (props.user ?? props.member?.user)?.bot,
        undefined,
        props.group,
      )}
    >
      <RandMembru
        data-offline={
          (props.user ?? props.member?.user)?.online ? undefined : ""
        }
      >
        <div
          style={{
            opacity: timedOut() && moderationPerms() ? 0.5 : 1,
            display: "flex",
          }}
        >
          <Avatar
            src={user().avatar}
            size={28}
            holepunch="bottom-right"
            overlay={
              <UserStatus.Graphic
                status={(props.user ?? props.member?.user)?.presence}
              />
            }
          />
        </div>
        <span class="text">
          <span class="nume">
            <span>
              <ColouredText colour={user().colour!}>
                {user().username}
              </ColouredText>
            </span>
            <Show when={timedOut() && moderationPerms()}>
              <Tooltip
                content={t`Timed out until ${props.member!.timeout!.toLocaleString()}`}
                placement="top"
              >
                <Symbol size={13}>timer_off</Symbol>
              </Tooltip>
            </Show>
          </span>
          <Show when={status()}>
            <Tooltip
              content={() => <TextWithEmoji content={status()!} />}
              placement="top-start"
              aria={status()!}
            >
              <span class="sub">
                <TextWithEmoji content={status()!} />
              </span>
            </Tooltip>
          </Show>
        </span>
      </RandMembru>
    </div>
  );
}
