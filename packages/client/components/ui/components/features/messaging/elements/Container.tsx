import { JSX, Match, Show, Switch } from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useMessage } from "@revolt/app";
import { useDevice } from "@revolt/common";
import { Ripple, typography } from "@revolt/ui/components/design";
import { Column, Row } from "@revolt/ui/components/layout";
import {
  NonBreakingText,
  OverflowingText,
  Symbol,
  Time,
} from "@revolt/ui/components/utils";

import { MessageToolbar } from "./MessageToolbar";

interface CommonProps {
  /**
   * Whether this is the tail of another message
   */
  tail?: boolean;

  /**
   * Whether to move the username and related to the left
   *
   * If you want to hide it completely, add a <Match when={true} /> to infoMatch
   */
  compact?: boolean;

  /**
   * Whether this message should be treated as a link
   */
  isLink?: boolean | "hide";
}

type Props = CommonProps & {
  /**
   * Avatar URL
   */
  avatar: JSX.Element;

  /**
   * Pronouns
   */
  pronouns?: string;

  /**
   * Username element
   */
  username: JSX.Element;

  /**
   * Message content
   */
  children: JSX.Element;

  /**
   * Message header
   */
  header?: JSX.Element;

  /**
   * Message info line
   */
  info?: JSX.Element;

  /**
   * Timestamp message was sent at
   */
  timestamp: Date | JSX.Element;

  /**
   * Date message was edited at
   */
  edited?: Date;

  /**
   * Whether this message mentions the user
   */
  mentioned?: boolean;

  /**
   * Whether this message should be highlighted
   */
  highlight?: boolean;

  /**
   * Whether this message is being edited
   */
  editing?: boolean;

  /**
   * Send status of this message
   */
  sendStatus?: "sending" | "failed";

  /**
   * Whether we are hovering this message
   */
  onHover?: (hovering: boolean) => void;

  /**
   * Component to render message context menu
   */
  contextMenu?: () => JSX.Element;

  ref?: HTMLDivElement;

  /**
   * Additional match cases for the inline-start information element
   */
  infoMatch?: JSX.Element;

  /**
   * Reference time to render timestamps from
   */
  _referenceTime?: number;

  /**
   * BBT: pe telefon, mesajul e bulă ca în aplicație (19b): `mea` în dreapta, roz; `altii` în stânga, albă.
   */
  bula?: "mea" | "altii";

  /**
   * BBT: bula e doar poză sau video: fără padding de text, cu ora peste imagine.
   */
  doarMedia?: boolean;

  /**
   * BBT: ce stă sub bulă, în afara ei (reacțiile).
   */
  subBula?: JSX.Element;

  /**
   * BBT: mesajul de la care pornește firul, cardul din capul ecranului de răspunsuri (24b).
   */
  cardFir?: boolean;
};

/**
 * Message container layout
 */
const base = cva({
  base: {
    position: "relative",

    display: "flex",
    flexDirection: "column",

    padding: "2px 0",
    background: "transparent",
    borderRadius: "var(--borderRadius-md)",
    minHeight: "1em",

    transition: "background-color var(--transitions-fast)",

    "& a:hover": {
      textDecoration: "underline",
    },

    "&:hover .Toolbar": {
      display: "flex",
    },
  },
  variants: {
    tail: {
      true: {
        marginTop: 0,
      },
    },
    mentioned: {
      true: {
        background: "var(--md-sys-color-primary-container)",
      },
    },
    highlight: {
      true: {
        animation: "highlightMessage 3s",
      },
    },
    sendStatus: {
      failed: {
        color: "var(--md-sys-color-error)",
      },
      sending: {
        color: "var(--md-sys-color-outline)",
      },
      sent: {
        color: "var(--md-sys-color-on-surface)",
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
        userSelect: "none",
        position: "relative",

        "& *": {
          pointerEvents: "none",
        },
      },
      false: {
        marginTop: "var(--message-group-spacing) !important",

        "&:hover": {
          background: "var(--md-sys-color-surface-container)",
        },
      },
      hide: {},
    },
    // BBT: bula de pe telefon (`ContainerBula`) își pune singură distanțele și n-are fundal la atingere.
    bula: {
      true: {
        padding: 0,
        marginTop: "0 !important",

        "&:hover": {
          background: "transparent",
        },
      },
    },
    iOSTouch: {
      true: {
        "-webkit-touch-callout": "none",
        "-webkit-user-select": "none",
        "user-select": "none",
      },
    },
  },
  defaultVariants: {
    isLink: false,
    sendStatus: "sent",
  },
});

/**
 * Left-side information or avatar
 */
const Info = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    justifyContent: "end",
    padding: "2px var(--gap-sm)",
  },
  variants: {
    tail: {
      true: {
        padding: 0,
      },
    },
    compact: {
      true: {},
      false: {
        width: "54px",
      },
    },
  },
  defaultVariants: {
    compact: false,
  },
});

/**
 * Right-side message content
 */
const Body = styled("div", {
  base: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",

    minWidth: 0,
    overflow: "hidden",
    paddingInlineEnd: "var(--gap-lg)",
  },
  variants: {
    editing: {
      true: {
        flexGrow: 1,
        overflow: "visible",
      },
    },
  },
});

const Content = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    gap: "var(--gap-sm)",
    flexDirection: "column",

    ...typography.raw({ class: "_messages" }),
  },
});

/**
 * Information text
 */
const infoText = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",

    color: "var(--md-sys-color-outline)",

    ...typography.raw({ class: "body", size: "small" }),
  },
  variants: {
    prefix: {
      true: {
        width: "calc(7ch * var(--gap-sm))",
        fontSize: "0.7em",

        overflow: "hidden",
        overflowWrap: "none",

        display: "block",
        textAlign: "right",
        marginTop: "0.15em",
      },
    },
    hidden: {
      true: {
        opacity: 0,
        transition: "var(--transitions-fast) opacity",

        _groupHover: {
          opacity: 1,
        },
      },
    },
    shrink: {
      true: {
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: "fit-content",
      },
    },
  },
});

/**
 * Additional styles for compact mode
 */
const CompactInfo = styled(Row, {
  base: {
    flexShrink: 0,
    marginTop: "-2px",
    height: "fit-content",
    paddingInline: "var(--gap-lg) 0",
  },
});

/**
 * Mesajul pe telefon, ca bulă. Copia lui `mobil/src/fir/RandMesaj.tsx`, cu măsurile de acolo (19b): raza 26, colțul
 * cozii 8, padding 12/16, text 16/22 la 500, autorul 12 gros, avatarul 32, cel mult 80% din lățime.
 *
 * ⚠️ Ora stă peste colțul bulei, ca la WhatsApp. Pe ultimul rând de text îi ține locul `--bbt-ora`, un text transparent
 * adăugat după paragraf (`src/bbt/raspuns.css`), ca să nu ceară un rând în plus și să nu se suprapună peste cuvinte.
 */
function ceasMesaj(props: Props) {
  if (!(props.timestamp instanceof Date)) return "";
  const ora = props.timestamp.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return props.edited ? `editat ${ora}` : ora;
}

/** Cardul din 24b: mesajul original, deasupra răspunsurilor: alb cu chenar, avatar 36, nume 14, reacțiile sub text. */
function CardFir(props: Props) {
  const { message } = useMessage();

  return (
    <div
      id={message?.id}
      ref={props.ref}
      class="bbt-fir-card"
      use:floating={{ contextMenu: props.contextMenu }}
      style={{
        display: "flex",
        gap: "10px",
        margin: "0 14px",
        padding: "12px 14px",
        "border-radius": "24px",
        border: "1.5px solid #E5E5E5",
        background: "#FFFFFF",
        color: "#0A0A0B",
      }}
    >
      <div style={{ "flex-shrink": 0 }}>{props.avatar}</div>
      <div style={{ flex: 1, "min-width": 0 }}>
        <div style={{ display: "flex", gap: "8px", "align-items": "baseline" }}>
          {props.username}
          <span style={{ "font-size": "11px", color: "rgba(10,10,11,.6)" }}>
            {ceasMesaj(props)}
          </span>
        </div>
        <div
          style={{
            "margin-top": "2px",
            "font-size": "15px",
            "font-weight": 500,
          }}
        >
          {props.children}
        </div>
        {props.subBula}
      </div>
    </div>
  );
}

function ContainerBula(props: Props) {
  const { message } = useMessage();
  const mea = () => props.bula === "mea";
  const ceas = () => ceasMesaj(props);

  return (
    <div
      id={message?.id}
      ref={props.ref}
      class={
        "group " +
        base({
          tail: props.tail,
          highlight: props.highlight,
          sendStatus: props.sendStatus,
          bula: true,
          iOSTouch: true,
        })
      }
      use:floating={{ contextMenu: props.contextMenu }}
      style={{
        display: "flex",
        "flex-direction": "row",
        "align-items": "flex-end",
        "justify-content": mea() ? "flex-end" : undefined,
        gap: "6px",
        padding: `${props.tail ? 2 : 8}px 8px 0`,
      }}
    >
      <Show when={!mea()}>
        <div style={{ width: "32px", "flex-shrink": 0 }}>
          <Show when={!props.tail}>{props.avatar}</Show>
        </div>
      </Show>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": mea() ? "flex-end" : "flex-start",
          "max-width": "80%",
          "min-width": 0,
        }}
      >
        {/* Numele stă deasupra bulei, ca în 24a: cererea userului, 31 oct 2026. Până atunci, în bulă (19b). */}
        <Show when={!mea() && !props.tail}>
          <div class="bbt-bula-autor">{props.username}</div>
        </Show>
        <div
          class={`bbt-bula${mea() ? " bbt-bula-mea" : ""}${props.doarMedia ? " bbt-bula-media" : ""}`}
          style={{
            position: "relative",
            "max-width": "100%",
            "min-width": "72px",
            padding: props.doarMedia ? "6px" : "12px 16px",
            "box-sizing": "border-box",
            "border-radius": mea()
              ? "26px 26px 8px 26px"
              : "26px 26px 26px 8px",
            background: mea() ? "#FFB3D9" : "#FFFFFF",
            color: "#0A0A0B",
            "--bbt-ora": `"  ${ceas()}"`,
          }}
        >
          {props.header}
          {props.children}
          <Show when={ceas()}>
            <span
              class={props.doarMedia ? "bbt-bula-ora-media" : "bbt-bula-ora"}
            >
              {ceas()}
            </span>
          </Show>
        </div>
        {props.subBula}
      </div>
    </div>
  );
}

/**
 * Component to show avatar, username, timestamp and content
 */
export function MessageContainer(props: Props) {
  return (
    <Show when={props.bula} fallback={<ContainerLiniar {...props} />}>
      <Show when={props.cardFir} fallback={<ContainerBula {...props} />}>
        <CardFir {...props} />
      </Show>
    </Show>
  );
}

function ContainerLiniar(props: Props) {
  const { t } = useLingui();
  const { message } = useMessage();
  const { isMobile, isIOSTouch } = useDevice();

  return (
    <div
      id={message?.id}
      ref={props.ref}
      onMouseEnter={() => props.onHover && props.onHover(true)}
      onMouseLeave={() => props.onHover && props.onHover(false)}
      class={
        "group " +
        base({
          tail: props.tail,
          mentioned: props.mentioned,
          highlight: props.highlight,
          sendStatus: props.sendStatus,
          isLink: props.isLink,
          // BBT: și pe Android — apăsarea lungă pornea selecția de text în același gest cu
          // meniul mesajului. Textul se copiază din meniu („Copy text").
          iOSTouch: isIOSTouch || isMobile,
        })
      }
      use:floating={{ contextMenu: props.contextMenu }}
    >
      <Show
        when={
          !isMobile &&
          message &&
          props.isLink !== true &&
          props.isLink !== "hide"
        }
      >
        <MessageToolbar />
      </Show>

      <Show when={props.isLink}>
        <Ripple />
      </Show>

      {props.header}
      <Row>
        <Info tail={props.tail} compact={props.compact}>
          <Switch fallback={props.avatar}>
            {props.infoMatch ?? <Match when={false} children={null} />}
            <Match when={props.compact}>
              <CompactInfo gap="sm" align>
                <div
                  class={infoText()}
                  use:floating={{
                    tooltip: {
                      placement: "top",
                      content: () => (
                        <Column>
                          <span>
                            {t`Sent`}{" "}
                            <Time
                              format="datetime"
                              value={props.timestamp}
                              referenceTime={props._referenceTime}
                            />
                          </span>
                          <Show when={props.edited}>
                            <span>
                              {t`Edited`}{" "}
                              <Time
                                format="datetime"
                                value={props.edited}
                                referenceTime={props._referenceTime}
                              />
                            </span>
                          </Show>
                        </Column>
                      ),
                      aria: "",
                    },
                  }}
                >
                  <Time
                    format="time"
                    value={props.timestamp}
                    referenceTime={props._referenceTime}
                  />
                </div>
                {props.username}
                {props.info}
                <Show when={props.edited}>
                  <Symbol size={16}>edit</Symbol>
                </Show>
              </CompactInfo>
            </Match>
            <Match when={props.tail}>
              <div
                class={infoText({ hidden: !props.edited, prefix: true })}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: () => (
                      <Column>
                        <span>
                          {t`Sent`}{" "}
                          <Time
                            format="datetime"
                            value={props.timestamp}
                            referenceTime={props._referenceTime}
                          />
                        </span>
                        <Show when={props.edited}>
                          <span>
                            {t`Edited`}{" "}
                            <Time
                              format="datetime"
                              value={props.edited}
                              referenceTime={props._referenceTime}
                            />
                          </span>
                        </Show>
                      </Column>
                    ),
                    aria: "",
                  },
                }}
              >
                <Show
                  when={props.edited}
                  fallback={
                    <Time
                      value={props.timestamp}
                      format="time"
                      referenceTime={props._referenceTime}
                    />
                  }
                >
                  (edited)
                </Show>
              </div>
            </Match>
          </Switch>
        </Info>
        <Body editing={props.editing}>
          <Show when={!props.tail && !props.compact}>
            <Row gap="sm" align>
              <OverflowingText>{props.username}</OverflowingText>
              <NonBreakingText class={infoText()}>{props.info}</NonBreakingText>
              <Show when={props.pronouns}>
                <OverflowingText class={infoText({ shrink: true })}>
                  <span>{props.pronouns}</span>
                  <span>·</span>
                </OverflowingText>
              </Show>
              <NonBreakingText class={infoText()}>
                <Show
                  when={props.timestamp instanceof Date}
                  fallback={props.timestamp as JSX.Element}
                >
                  <span
                    use:floating={{
                      tooltip: {
                        placement: "top",
                        content: () => (
                          <>
                            {t`Sent`}{" "}
                            <Time
                              format="datetime"
                              value={props.timestamp}
                              referenceTime={props._referenceTime}
                            />
                          </>
                        ),
                        aria: "",
                      },
                    }}
                  >
                    <Time
                      format="calendar"
                      value={props.timestamp}
                      referenceTime={props._referenceTime}
                    />
                  </span>
                </Show>
                <Show when={props.edited}>
                  <span
                    use:floating={{
                      tooltip: {
                        placement: "top",
                        content: () => (
                          <>
                            {t`Edited`}{" "}
                            <Time
                              format="datetime"
                              value={props.edited}
                              referenceTime={props._referenceTime}
                            />
                          </>
                        ),
                        aria: "",
                      },
                    }}
                  >
                    (edited)
                  </span>
                </Show>
              </NonBreakingText>
            </Row>
          </Show>
          <Content>{props.children}</Content>
        </Body>
      </Row>
    </div>
  );
}
