import {
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  splitProps,
} from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { TextWithEmoji } from "@revolt/markdown";
import { useNavigate } from "@revolt/routing";
import { Avatar, Deferred, UserStatus } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { SidebarBase } from "./common";

interface Props {
  /**
   * Ordered list of conversations
   */
  conversations: () => Channel[];

  /**
   * Current channel ID
   */
  channelId?: string;

  /**
   * Open the saved notes channel
   */
  openSavedNotes: (
    navigate?: ReturnType<typeof useNavigate>,
  ) => string | undefined;
}

/**
 * Display home navigation and conversations
 */
export const HomeSidebar = (props: Props) => {
  const client = useClient();
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  // BBT: filtrele din 23a. „Mentori" și „Echipa BBT" lipsesc: rolul omului nu stă în conversație, iar un filtru
  // care ar cere rolurile tuturor la fiecare deschidere a listei n-ar merita.
  const [filtru, setFiltru] = createSignal<"toate" | "necitite">("toate");

  let scrollTargetElement!: HTMLDivElement;

  const pendingRequests = createMemo(() => {
    return client().users.filter((user) => user.relationship === "Incoming")
      .length;
  });

  const conversatii = createMemo(() =>
    filtru() === "necitite"
      ? props.conversations().filter((c) => c.unread)
      : props.conversations(),
  );

  return (
    <SidebarBase class="channel_bar home">
      <div ref={scrollTargetElement} use:invisibleScrollable>
        <List>
          {/* BBT (23a, 30 oct 2026): „Mesaje" mare + „+" negru, filtrele, apoi conversațiile ca rânduri cu avatar,
              oră, ultimul mesaj și cifra roz de necitite. Până atunci lista Stoat: Acasă, Prieteni, Notițe salvate,
              „Direct Messages". Notițele salvate au ieșit (nu sunt în machetă); prietenii rămân aici doar cât ai
              cereri, fiindcă în Community scrii doar prietenilor (regula serverului). */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              padding: "20px 16px 12px 20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                "font-family": '"De Fonte BBT", Inter, sans-serif',
                "font-weight": 400,
                "font-size": "28px",
                "letter-spacing": "0.01em",
                "font-synthesis": "none",
                color: "#0A0A0B",
              }}
            >
              Mesaje
            </h2>
            {/* „+" = alege omul căruia îi scrii (22k); în Community, dintre prieteni. */}
            <button
              type="button"
              aria-label="Mesaj nou"
              title="Mesaj nou"
              onClick={() => navigate("/friends")}
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "999px",
                border: 0,
                background: "#0A0A0B",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <Symbol size={20}>add</Symbol>
            </button>
          </div>

          <div
            style={{ display: "flex", gap: "6px", padding: "0 16px 12px 20px" }}
          >
            <Filtru
              activ={filtru() === "toate"}
              onClick={() => setFiltru("toate")}
            >
              Toate
            </Filtru>
            <Filtru
              activ={filtru() === "necitite"}
              onClick={() => setFiltru("necitite")}
            >
              Necitite
            </Filtru>
          </div>

          <Show when={pendingRequests()}>
            <a
              href="/friends"
              onClick={(e) => {
                e.preventDefault();
                navigate("/friends");
              }}
              style={{
                display: "flex",
                "align-items": "center",
                gap: "10px",
                margin: "0 12px 8px",
                padding: "12px 14px",
                "border-radius": "16px",
                background: "#FFE4F1",
                color: "#0A0A0B",
                "font-size": "14px",
                "font-weight": 600,
              }}
            >
              <Symbol size={18}>person_add</Symbol>
              {pendingRequests() === 1
                ? "1 cerere de prietenie"
                : `${pendingRequests()} cereri de prietenie`}
            </a>
          </Show>

          <Show
            when={conversatii().length}
            fallback={
              <p
                style={{
                  margin: "8px 20px",
                  color: "#6C6C6D",
                  "font-size": "14px",
                  "line-height": "1.45",
                }}
              >
                {filtru() === "necitite"
                  ? "Nimic necitit. Ești la zi."
                  : "Nicio conversație încă. Apasă + ca să scrii cuiva."}
              </p>
            }
          >
            <Deferred>
              <VirtualContainer
                items={conversatii()}
                scrollTarget={scrollTargetElement}
                itemSize={{ height: 76 }}
              >
                {(item) => (
                  <div
                    style={{
                      ...item.style,
                      width: "100%",
                      padding: "2px 8px",
                      "box-sizing": "border-box",
                    }}
                  >
                    <Entry
                      // @ts-expect-error missing type on Entry
                      role="listitem"
                      tabIndex={item.tabIndex}
                      channel={item.item}
                      active={item.item.id === props.channelId}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </VirtualContainer>
            </Deferred>
          </Show>
        </List>
      </div>
    </SidebarBase>
  );
};

/** Pastila unui filtru (23a): neagră pe cel ales, gri pe celelalte. */
function Filtru(props: {
  activ: boolean;
  onClick: () => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.activ}
      onClick={() => props.onClick()}
      style={{
        height: "34px",
        padding: "0 14px",
        "border-radius": "999px",
        border: 0,
        background: props.activ ? "#0A0A0B" : "#F2F2F3",
        color: props.activ ? "#FFFFFF" : "#6C6C6D",
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": 700,
        cursor: "pointer",
      }}
    >
      {props.children}
    </button>
  );
}

export const Header = styled("div", {
  base: {
    alignItems: "center",
    fontWeight: 600,
    userSelect: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    height: "48px",
    lineHeight: "48px",
    verticalAlign: "middle",
    margin: "var(--gap-md)",
    marginLeft: "var(--gap-lg)",
    color: "var(--md-sys-color-on-surface)",
    backgroundColor: "var(--md-sys-color-surface-variant)",
  },
});

/** „17:53" azi, „Ieri", ziua săptămânii în ultima săptămână, altfel „12 oct.". */
function cand(d: Date): string {
  const acum = new Date();
  const zi = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const zile = Math.round((zi(acum).getTime() - zi(d).getTime()) / 86_400_000);
  if (zile <= 0)
    return d.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (zile === 1) return "Ieri";
  if (zile < 7) {
    const z = d.toLocaleDateString("ro-RO", { weekday: "short" });
    return z.charAt(0).toUpperCase() + z.slice(1);
  }
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

/**
 * Single conversation entry
 *
 * BBT (23a, 30 oct 2026): rândul din machetă — avatar de 44, numele, ora ultimului mesaj, sub ele ultimul mesaj
 * („Tu: …" când e al tău) și cifra roz de necitite. ⚠️ Ultimul mesaj se vede doar dacă e deja în memorie (conversația
 * a fost deschisă sau a primit ceva de la pornire): serverul trimite lista de conversații doar cu id-ul lui. Fără el,
 * rândul arată starea omului, ca până acum.
 */
function Entry(
  props: { channel: Channel; active: boolean; isMobile: boolean } /*& Omit<
    ComponentProps<typeof Link>,
    "href"
  >*/,
) {
  const [local, remote] = splitProps(props, ["channel", "active", "isMobile"]);

  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();

  /**
   * Determine user status if present
   */
  const status = () =>
    local.channel.recipient?.statusMessage((s) =>
      s === "Online"
        ? t`Online`
        : s === "Busy"
          ? t`Busy`
          : s === "Focus"
            ? t`Focus`
            : s === "Idle"
              ? t`Idle`
              : t`Offline`,
    );

  const nume = () =>
    local.channel.type === "DirectMessage"
      ? (local.channel.recipient?.displayName ?? "")
      : (local.channel.name ?? "Grup");

  const ultimul = () => {
    const m = local.channel.lastMessage;
    if (!m) return undefined;
    const text =
      m.content?.trim() || (m.attachments?.length ? "Fișier trimis" : "");
    if (!text) return undefined;
    return m.authorId === client().user?.id ? `Tu: ${text}` : text;
  };

  const necitit = () => !local.active && local.channel.unread;
  const mentiuni = () => local.channel.mentions?.size ?? 0;

  return (
    <a
      {...remote}
      href={`/channel/${local.channel.id}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/channel/${local.channel.id}`);
      }}
      aria-current={local.active ? "page" : undefined}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        height: "72px",
        padding: "0 12px",
        "box-sizing": "border-box",
        "border-radius": "16px",
        background: local.active ? "#F2F2F3" : "transparent",
        color: "#0A0A0B",
        opacity: local.channel.muted ? 0.6 : 1,
      }}
      use:floating={{
        contextMenu: () =>
          local.channel.type === "DirectMessage" ? (
            <UserContextMenu
              user={local.channel.recipient!}
              channel={local.channel}
            />
          ) : (
            <ChannelContextMenu channel={local.channel} />
          ),
      }}
    >
      <Switch>
        <Match when={local.channel.type === "Group"}>
          <Avatar
            size={44}
            shape="rounded-square"
            fallback={local.channel.name}
            src={local.channel.iconURL}
            primaryContrast
          />
        </Match>
        <Match when={local.channel.type === "DirectMessage"}>
          <Avatar
            size={44}
            src={local.channel.iconURL}
            fallback={nume()}
            fallbackBackground
            holepunch="bottom-right"
            overlay={
              <UserStatus.Graphic status={local.channel?.recipient?.presence} />
            }
          />
        </Match>
      </Switch>
      <div style={{ "min-width": 0, "flex-grow": 1 }}>
        <div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
          <span
            style={{
              "flex-grow": 1,
              "min-width": 0,
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
              "font-size": "16px",
              "font-weight": 700,
            }}
          >
            <TextWithEmoji content={nume()} />
          </span>
          <Show when={local.channel.lastMessageAt}>
            <span
              style={{
                "flex-shrink": 0,
                "font-size": "14px",
                color: "#8D8D9A",
              }}
            >
              {cand(local.channel.lastMessageAt!)}
            </span>
          </Show>
        </div>
        <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
          <span
            style={{
              "flex-grow": 1,
              "min-width": 0,
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
              "font-size": "14px",
              color: necitit() ? "#0A0A0B" : "#6C6C6D",
              "font-weight": necitit() ? 600 : 400,
            }}
          >
            <Show
              when={ultimul()}
              fallback={
                <Show
                  when={local.channel.type === "Group"}
                  fallback={<TextWithEmoji content={status() ?? ""} />}
                >
                  {local.channel.recipientIds.size}{" "}
                  {local.channel.recipientIds.size === 1 ? "membru" : "membri"}
                </Show>
              }
            >
              <TextWithEmoji content={ultimul()!} />
            </Show>
          </span>
          {/* Cifra roz din 23a: mențiunile, sau 1 când e doar necitit. */}
          <Show when={necitit()}>
            <span
              style={{
                "flex-shrink": 0,
                "min-width": "20px",
                height: "20px",
                padding: "0 6px",
                "box-sizing": "border-box",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "999px",
                background: "#FFB3D9",
                color: "#0A0A0B",
                "font-size": "12px",
                "font-weight": 700,
              }}
            >
              {mentiuni() || 1}
            </span>
          </Show>
        </div>
      </div>
    </a>
  );
}

/**
 * Inner scrollable list
 * We fix the width in order to prevent scrollbar from moving stuff around
 */
const List = styled("div", {
  base: {
    width: "var(--layout-width-channel-sidebar)",
  },
});
