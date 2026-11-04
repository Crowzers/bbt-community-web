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

import { CardCont } from "../../../bbt/CardCont";
import { MesajNou } from "../../../bbt/MesajNou";
import { S1 } from "../../../bbt/tema";
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
  const [mesajNou, setMesajNou] = createSignal(false);

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
    <SidebarBase class="channel_bar home bbt-lista-mesaje">
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
              padding: "16px 22px 10px",
            }}
          >
            {/* S1 (4 nov 2026): Inter 15, alb pe cerneală, ca titlurile unei unelte; până atunci De Fonte 22 pe alb (23a). */}
            <h2
              style={{
                margin: 0,
                "font-family": "Inter, system-ui, sans-serif",
                "font-weight": 700,
                "font-size": "15px",
                "line-height": "20px",
                color: "#FFFFFF",
              }}
            >
              Mesaje
            </h2>
            {/* „+" = alege omul căruia îi scrii (22k): prietenii, sau pe cineva din comunitate, cu o cerere de prietenie. */}
            <button
              type="button"
              aria-label="Mesaj nou"
              title="Mesaj nou"
              onClick={() => setMesajNou(true)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "999px",
                border: 0,
                background: S1.placa,
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <Symbol size={20}>add</Symbol>
            </button>
            <Show when={mesajNou()}>
              <MesajNou laInchidere={() => setMesajNou(false)} />
            </Show>
          </div>

          <div style={{ display: "flex", gap: "6px", padding: "0 18px 10px" }}>
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
                background: "#FEDCEC",
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
                  color: S1.stins,
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
                itemSize={{ height: 58 }}
              >
                {(item) => (
                  <div
                    style={{
                      ...item.style,
                      width: "100%",
                      padding: "1px 12px",
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
      {/* BBT: contul la baza listei, ca la canale (S1). */}
      <div style={{ flex: 1 }} />
      <CardCont />
    </SidebarBase>
  );
};

/** Pastila unui filtru (23a): albă pe cel ales, pe placa listei celelalte (S1). */
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
        // S1: 14/600, pragul de text din interfață (până atunci 12/700, după 23a).
        height: "28px",
        padding: "0 12px",
        "border-radius": "999px",
        border: 0,
        background: props.activ ? "#FFFFFF" : S1.placa,
        color: props.activ ? "#0A0A0B" : S1.stins,
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": 600,
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
        // 23a: 8 + avatarul de 40 + 8, colțuri de 16.
        height: "56px",
        padding: "0 10px",
        "box-sizing": "border-box",
        "border-radius": "16px",
        // S1: conversația deschisă e roz, ca canalul deschis; restul pe cerneală.
        background: local.active ? "#FFA8CD" : "transparent",
        color: local.active ? "#0A0A0B" : "#FFFFFF",
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
            size={40}
            shape="rounded-square"
            fallback={local.channel.name}
            src={local.channel.iconURL}
            primaryContrast
          />
        </Match>
        <Match when={local.channel.type === "DirectMessage"}>
          <Avatar
            size={40}
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
              "font-size": "14px",
              "font-weight": 800,
            }}
          >
            <TextWithEmoji content={nume()} />
          </span>
          <Show when={local.channel.lastMessageAt}>
            <span
              style={{
                "flex-shrink": 0,
                "font-size": "12px",
                color: local.active ? "#333333" : S1.stins,
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
              "font-size": "13px",
              color: local.active
                ? "#333333"
                : necitit()
                  ? "#FFFFFF"
                  : S1.stins,
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
                height: "18px",
                padding: "0 7px",
                "box-sizing": "border-box",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "999px",
                background: "#FFA8CD",
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
