import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  For,
  JSX,
  Match,
  onMount,
  Show,
  Switch,
  useContext,
} from "solid-js";
import { sunetReactie } from "../../../../../src/bbt/sunete";

import { useLingui } from "@lingui/solid/macro";
import { Message as MessageInterface } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime } from "ulid";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { isGif } from "@revolt/common/lib/gifs";
import { useTime } from "@revolt/i18n";
import { Markdown } from "@revolt/markdown";
import { startsWithPackPUA } from "@revolt/markdown/emoji/UnicodeEmoji";
import { useState } from "@revolt/state";
import {
  Attachment,
  Avatar,
  CompositionMediaPicker,
  Embed,
  MessageContainer,
  MessageReply,
  Reactions,
  SystemMessage,
  SystemMessageIcon,
  Tooltip,
  Username,
} from "@revolt/ui";
import { MediaPickerProps } from "@revolt/ui/components/features/messaging/composition/picker/CompositionMediaPicker";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { MessageContextMenu } from "../../../menus/MessageContextMenu";
import {
  floatingUserMenus,
  floatingUserMenusFromMessage,
} from "../../../menus/UserContextMenu";

import { createIsTimedOut } from "@revolt/common/lib/createIsTimedOut";
import {
  PastilaRaspunsuri,
  RaspundeInFir,
} from "../../../../../src/bbt/PastilaRaspunsuri";
import { firDeschis, grupare } from "../../../../../src/bbt/fir";
import { AvatarOm } from "../../../../../src/bbt/telefon";
import { EditMessage } from "./EditMessage";

/**
 * Regex for matching URLs
 */
const RE_URL =
  /[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/;

interface Props {
  /**
   * Message
   */
  message: MessageInterface;

  /**
   * Whether this is the tail of another message
   */
  tail?: boolean;

  /**
   * Whether to highlight this message
   */
  highlight?: boolean;

  /**
   * Whether to replace content with editor
   */
  editing?: boolean;

  /**
   * Whether this message is a link
   */
  isLink?: boolean | "hide";

  /**
   * BBT: mesajul stă pe ecranul firului (24b), fără pastila de răspunsuri
   */
  inFir?: boolean;

  /**
   * BBT: mesajul de la care pornește firul, cardul din capul ecranului
   */
  cardFir?: boolean;

  /**
   * BBT: mărimea avatarului în panoul firului de pe desktop (24e)
   */
  avatarFir?: number;
}

interface MessageContextShape {
  message: MessageInterface;
  reactPicker: Accessor<MediaPickerProps | undefined>;
}

const messageContext = createContext<Partial<MessageContextShape>>({});

function MessageContext(
  props: { children: JSX.Element } & MessageContextShape,
) {
  /* eslint-disable solid/reactivity */
  const contextShape = {
    message: props.message,
    reactPicker: props.reactPicker,
  };

  return (
    <messageContext.Provider value={contextShape}>
      {props.children}
    </messageContext.Provider>
  );
}

export const useMessage = () => useContext(messageContext);

/**
 * Render a Message with or without a tail
 */
export function Message(props: Props) {
  const dayjs = useTime();
  const state = useState();
  const { t } = useLingui();
  const client = useClient();
  const { layout } = useDevice();

  const [isHovering, setIsHovering] = createSignal(false);
  const [reactPicker, setReactPicker] = createSignal<MediaPickerProps>();
  let msgRef!: HTMLDivElement;

  /**
   * Determine whether this message only contains a GIF
   */
  const isOnlyGIF = () =>
    props.message.embeds &&
    props.message.embeds.length === 1 &&
    isGif(props.message.embeds[0]) &&
    props.message.content &&
    !props.message.content.replace(RE_URL, "").length;

  /**
   * React with an emoji
   * @param emoji Emoji
   */
  const react = (emoji: string) => {
    sunetReactie();
    return props.message.react(emoji);
  };

  /**
   * Remove emoji reaction
   * @param emoji Emoji
   */
  const unreact = (emoji: string) => props.message.unreact(emoji);

  // Derive pronouns member takes precedence over author
  const pronouns = () =>
    props.message.member?.pronouns ?? props.message.author?.pronouns;

  const timedOut = createIsTimedOut(() => props.message.member?.timeout);

  const moderationPerms = createMemo(() =>
    props.message.member?.server?.member?.hasPermission(
      props.message.member!.server! ?? props.message.channel!,
      "TimeoutMembers",
    ),
  );

  // BBT: pe telefon firul e cel din aplicație (19b): bule și în canale, ale tale în dreapta. Pe desktop rămân 21a și
  // 23a. Mesajele de sistem, editarea și rezultatele din căutare își păstrează rândul lor.
  const bula = () =>
    layout() === "phone" &&
    !props.isLink &&
    !props.editing &&
    !props.message.systemMessage &&
    !state.settings.getValue("appearance:compact_mode")
      ? props.message.authorId === client().user?.id
        ? ("mea" as const)
        : ("altii" as const)
      : undefined;

  // Doar poze sau video: bula se strânge pe imagine, iar ora stă peste ea, ca în aplicație.
  const doarMedia = () =>
    !props.message.content &&
    !props.message.embeds?.length &&
    !!props.message.attachments?.length &&
    props.message.attachments.every(
      (f) => f.metadata.type === "Image" || f.metadata.type === "Video",
    );

  const pastilaRol = () => (
    <Show when={props.message.member?.hoistedRole}>
      {(rol) => (
        <span
          class="bbt-rol"
          style={{
            // 21a: rolul e o pastilă galbenă cu text negru („ECHIPA BBT", „MENTOR"), aceeași pentru
            // toate rolurile; până pe 30 oct, culoarea rolului din Stoat pe gri închis.
            "font-size": "12px",
            "font-weight": 700,
            "letter-spacing": "0.04em",
            "text-transform": "uppercase",
            padding: "2px 7px",
            "border-radius": "999px",
            color: "#0A0A0B",
            // Galbenul pal din 21a (#FFEFAD), nu cel plin.
            background: "#FFEFAD",
          }}
        >
          {rol().name}
        </span>
      )}
    </Show>
  );

  const reactii = () => (
    <Reactions
      reactions={props.message.reactions as never as Map<string, Set<string>>}
      interactions={props.message.interactions}
      userId={client().user!.id}
      addReaction={react}
      removeReaction={unreact}
    />
  );

  return (
    <MessageContext message={props.message} reactPicker={reactPicker}>
      <MessageContainer
        ref={msgRef}
        bula={bula()}
        doarMedia={doarMedia()}
        cardFir={props.cardFir}
        selectat={!props.inFir && firDeschis() === props.message.id}
        rol={pastilaRol()}
        subBula={
          <>
            <div class="bbt-reactii">{reactii()}</div>
            <Show when={!props.inFir && !props.cardFir}>
              <PastilaRaspunsuri mesajId={props.message.id} />
            </Show>
          </>
        }
        onHover={setIsHovering}
        username={
          <div use:floating={floatingUserMenusFromMessage(props.message)}>
            <Username
              username={
                props.message.masquerade?.name ??
                props.message.member?.nickname ??
                props.message.author?.displayName ??
                props.message.author?.username ??
                props.message.username
              }
              // BBT (21a, 30 oct 2026): numele au O singură culoare, movul #5C4ADE, nu culoarea rolului din Stoat
              // (portocaliul și rozul pal ale rolurilor nu se citeau pe alb). Rolul se vede din pastila galbenă.
              colour="#5C4ADE"
              // 15 / 800, ca în 21a; în bulă, 12 / 800, ca în 19b.
              style={{
                "font-size": props.cardFir
                  ? "14px"
                  : props.avatarFir
                    ? "13px"
                    : bula()
                      ? "12px"
                      : "15px",
                "font-weight": 800,
              }}
            />
          </div>
        }
        avatar={
          <div
            class={avatarContainer()}
            use:floating={floatingUserMenusFromMessage(props.message)}
          >
            {/* 40, ca în 21a (până pe 30 oct, 36); coloana avatarului are 54 = 40 + 14. Lângă bulă, 32, ca în 19b. */}
            <Show
              when={bula()}
              fallback={
                <Avatar
                  size={props.avatarFir ?? 40}
                  src={
                    isHovering()
                      ? props.message.animatedAvatarURL
                      : props.message.avatarURL
                  }
                />
              }
            >
              <AvatarOm
                om={props.message.author}
                marime={props.cardFir ? 36 : 32}
              />
            </Show>
          </div>
        }
        pronouns={pronouns()}
        contextMenu={
          props.editing
            ? undefined
            : () => (
                <MessageContextMenu
                  message={props.message}
                  reactPicker={reactPicker}
                />
              )
        }
        timestamp={props.message.createdAt}
        edited={props.message.editedAt}
        mentioned={props.message.mentioned}
        highlight={props.highlight}
        editing={props.editing}
        isLink={props.isLink}
        tail={props.tail || state.settings.getValue("appearance:compact_mode")}
        header={
          <For each={props.inFir ? [] : props.message.replyIds}>
            {(reply_id) => {
              /**
               * Signal the actual message
               */
              const message = () => client().messages.get(reply_id);

              onMount(() => {
                if (!message()) {
                  props.message.channel!.fetchMessage(reply_id);
                }
              });

              return (
                <MessageReply
                  mention={props.message.mentionIds?.includes(
                    message()!.authorId!,
                  )}
                  message={message()}
                />
              );
            }}
          </For>
        }
        info={
          <>
            {/* BBT: eticheta rolului lângă nume, ca pastila „MENTOR" din pânza TRW — rolul afișat
              separat al omului (rolul muzical din onboarding sau unul de staff), în culoarea lui. */}
            {pastilaRol()}
            <Switch fallback={<div />}>
              <Match when={props.message.iconRole}>
                <Tooltip content={props.message.iconRole!.name} placement="top">
                  <Avatar
                    size={16}
                    shape="rounded-square"
                    src={props.message.iconRole!.icon?.previewUrl}
                  />
                </Tooltip>
              </Match>
              <Match
                when={
                  props.message.masquerade &&
                  props.message.authorId === "01FHGJ3NPP7XANQQH8C2BE44ZY"
                }
              >
                <Tooltip
                  content={t`Message was sent on another platform`}
                  placement="top"
                >
                  <Symbol size={16}>link</Symbol>
                </Tooltip>
              </Match>
              <Match when={props.message.author?.privileged}>
                <Tooltip content={t`Official Communication`} placement="top">
                  <Symbol size={16}>brightness_alert</Symbol>
                </Tooltip>
              </Match>
              <Match when={props.message.author?.bot}>
                <Tooltip content={t`Bot`} placement="top">
                  <Symbol size={16} fill>
                    smart_toy
                  </Symbol>
                </Tooltip>
              </Match>
              <Match when={props.message.webhook}>
                <Tooltip content={t`Webhook`} placement="top">
                  <Symbol size={16} fill>
                    cloud
                  </Symbol>
                </Tooltip>
              </Match>
              <Match when={props.message.isSuppressed}>
                <Tooltip content={t`Silent`} placement="top">
                  <Symbol size={16} fill>
                    notifications_off
                  </Symbol>
                </Tooltip>
              </Match>
              <Match when={timedOut() && moderationPerms()}>
                <Tooltip
                  content={t`Timed Out until ${props.message.member!.timeout!.toLocaleString()}`}
                  placement="top"
                >
                  <Symbol size={16} color="var(--md-sys-color-error)">
                    timer_off
                  </Symbol>
                </Tooltip>
              </Match>
              <Match
                when={
                  props.message.authorId &&
                  dayjs().diff(decodeTime(props.message.authorId), "day") < 1
                }
              >
                <NewUser>
                  <Tooltip content={t`New to Stoat`} placement="top">
                    <Symbol size={16} fill>
                      spa
                    </Symbol>
                  </Tooltip>
                </NewUser>
              </Match>
              <Match
                when={
                  props.message.member &&
                  dayjs().diff(props.message.member.joinedAt, "day") < 1
                }
              >
                <NewUser>
                  <Tooltip content={t`New to the server`} placement="top">
                    <Symbol size={16}>spa</Symbol>
                  </Tooltip>
                </NewUser>
              </Match>
              {/* <Match when={props.message.authorId === "01EX2NCWQ0CHS3QJF0FEQS1GR4"}>
            <span />
            <span>placeholder &middot; </span>
          </Match> */}
            </Switch>
          </>
        }
        compact={
          !!props.message.systemMessage ||
          state.settings.getValue("appearance:compact_mode")
        }
        infoMatch={
          <Match when={props.message.systemMessage}>
            <SystemMessageIcon
              systemMessage={props.message.systemMessage!}
              createdAt={props.message.createdAt}
              isServer={!!props.message.server}
            />
          </Match>
        }
      >
        <Show when={props.message.systemMessage}>
          <SystemMessage
            systemMessage={props.message.systemMessage!}
            menuGenerator={(user) =>
              user
                ? floatingUserMenus(
                    user!,
                    // TODO: try to fetch on demand member
                    props.message.server?.getMember(user!.id),
                  )
                : {}
            }
            isServer={!!props.message.server}
          />
        </Show>
        <CompositionMediaPicker
          channel={props.message.channel}
          onMessage={(content) =>
            props.message?.channel?.sendMessage({
              content,
              replies: [{ id: props.message.id, mention: true }],
            })
          }
          onTextReplacement={(emoji) =>
            react(
              emoji.startsWith(":")
                ? emoji.slice(1, emoji.length - 1)
                : startsWithPackPUA(emoji)
                  ? emoji.slice(1)
                  : emoji,
            )
          }
        >
          {(trigProps) => {
            trigProps.ref(msgRef);
            setReactPicker(trigProps);
            return <></>;
          }}
        </CompositionMediaPicker>
        <Switch>
          <Match when={props.editing}>
            <EditMessage message={props.message} />
          </Match>
          {/* BBT (23a, 30 oct 2026): în conversațiile directe textul stă în bule — ale tale roz, ale celuilalt albe,
              pe fundalul gri al conversației. Canalele rămân liniare, fără bule (21a: la lățimea asta bulele irosesc
              spațiu și îngreunează scanarea). ⚠️ Bulele tale NU trec în dreapta, ca în machetă: rândul mesajului
              (avatar, nume, oră) e al lui Stoat și ar trebui întors cu totul. */}
          <Match
            when={
              props.message.content &&
              !isOnlyGIF() &&
              !bula() &&
              props.message.channel?.type === "DirectMessage"
            }
          >
            <div
              style={{
                // Cât textul: rândul mesajului e coloană flex și altfel întindea bula pe toată lățimea.
                display: "inline-block",
                width: "fit-content",
                "align-self": "flex-start",
                // 23a: colțul de jos-stânga ascuțit (6), cel mult 420 lățime, text de 15.
                "max-width": "min(420px, 100%)",
                "box-sizing": "border-box",
                padding: "10px 14px",
                "border-radius": "22px 22px 22px 6px",
                "font-size": "15px",
                background:
                  props.message.authorId === client().user?.id
                    ? "#FFA8CD"
                    : "#FFFFFF",
                color: "#0A0A0B",
              }}
            >
              <BreakText>
                <Markdown content={props.message.content!} />
              </BreakText>
            </div>
          </Match>
          <Match when={props.message.content && !isOnlyGIF()}>
            <BreakText>
              <Markdown content={props.message.content!} />
            </BreakText>
          </Match>
        </Switch>
        <For each={props.message.attachments}>
          {(attachment) => (
            <Attachment message={props.message} file={attachment} />
          )}
        </For>
        <For each={props.message.embeds}>
          {(embed) => <Embed embed={embed} />}
        </For>
        <Show when={!bula()}>{reactii()}</Show>
        {/* Pe desktop, sub mesaj: pastila firului sau „Răspunde", ca în 24e. Pe telefon, pastila stă sub bulă. */}
        <Show
          when={
            !bula() &&
            !props.inFir &&
            !props.isLink &&
            !props.editing &&
            !props.message.systemMessage
          }
        >
          <Show
            when={grupare().firuri.has(props.message.id)}
            fallback={<RaspundeInFir mesajId={props.message.id} />}
          >
            <PastilaRaspunsuri mesajId={props.message.id} />
          </Show>
        </Show>
      </MessageContainer>
    </MessageContext>
  );
}

/**
 * New user indicator
 */
const NewUser = styled("div", {
  base: {
    fill: "var(--md-sys-color-primary)",
  },
});

/**
 * Avatar container
 */
const avatarContainer = cva({
  base: {
    height: "fit-content",
    borderRadius: "var(--borderRadius-circle)",
  },
});

/**
 * Break all text and prevent overflow from math blocks
 */
const BreakText = styled("div", {
  base: {
    wordBreak: "break-word",

    "& .math": {
      overflowX: "auto",
      overflowY: "hidden",
      maxHeight: "100vh",
    },
  },
});
