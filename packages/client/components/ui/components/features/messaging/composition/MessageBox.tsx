import { BiRegularBlock } from "solid-icons/bi";
import { Accessor, JSX, Match, Show, Switch, onMount } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Row } from "@revolt/ui";
import { AutoCompleteSearchSpace } from "@revolt/ui/components/utils/autoComplete";

import { TextEditor2 } from "../../texteditor/TextEditor2";

interface Props {
  /**
   * Initial content
   */
  initialValue: readonly [string];

  /**
   * Node replacement
   */
  nodeReplacement?: readonly [string | "_focus"];

  /**
   * Text content
   */
  content: string;

  /**
   * Handle event to send message
   */
  onSendMessage: () => void;

  /**
   * Handle event when user is typing
   */
  onTyping: () => void;

  /**
   * Handle event when user wants to edit the last message in chat
   */
  onEditLastMessage: () => void;

  /**
   * Update text content
   * @param v New content
   */
  setContent: (v: string) => void;

  /**
   * Actions to the left of the message box
   */
  actionsStart: JSX.Element;

  /**
   * Actions to the right of the message box
   */
  actionsEnd: JSX.Element;

  /**
   * Elements appended after the message box row
   */
  actionsAppend: JSX.Element;

  /**
   * Whether there are elements appended after the message box row
   */
  hasActionsAppend: boolean;

  /**
   * Placeholder in message box
   */
  placeholder: string;

  /**
   * Whether sending messages is allowed
   */
  sendingAllowed: boolean;

  /**
   * Whether the user is currently timed out in this channel/server
   */
  timeoutActive?: boolean;

  /**
   * Auto complete config
   */
  autoCompleteSearchSpace?: Accessor<AutoCompleteSearchSpace>;

  /**
   * Update the current draft selection
   *
   * @deprecated have to hook into ProseMirror instance now!
   */
  updateDraftSelection?: (start: number, end: number) => void;
}

/**
 * Message box container
 */
const Base = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,

    // BBT: proporțiile din 25d (31 oct 2026): caseta are 56 pe un rând = 8 + 40 + 8, cu „+", emoji și microfonul în cercuri
    // de 40, la 12 unul de altul. Paddingul e cu 1 mai mic din cauza chenarului. Textul lung crește în sus.
    // 🔥 ALBĂ cu chenar din 4 nov 2026 (S1, schița „HubCampusDesktop"), cu colțurile panourilor (12): o unealtă, nu o pastilă de
    // aplicație. Între 30 oct și 4 nov era pastila NEAGRĂ din 21 și 23, cu variabilele de culoare suprascrise pe alb. Variabilele
    // rămân scrise AICI, ca iconițele dinăuntru să nu depindă de fundalul conversației.
    minHeight: "56px",
    boxSizing: "border-box",
    padding: "7px 7px 7px 9px",
    gap: "12px",
    borderRadius: "12px",
    border: "1px solid #E5E5E5",

    display: "flex",
    alignItems: "flex-end",
    background: "#FFFFFF",
    color: "#0A0A0B",
    "--md-sys-color-on-surface": "#0A0A0B",
    "--md-sys-color-on-surface-variant": "#6C6C6D",
    "--md-sys-color-outline": "#8D8D9A",

    // 🔥 Pe telefon, ca la WhatsApp, ca în aplicație (4 nov, cererea userului: „mai mult loc în pagină"): fără casetă, iconițele
    // stau direct pe fâșia de jos (`Parent`), iar rotunjit e doar câmpul de text (`CampTelefon`). Până atunci, pastila albă
    // de 60 cu chenar. Textul rămâne la 16: sub 16, iOS mărește pagina la focus.
    _phone: {
      minHeight: "36px",
      padding: 0,
      gap: "2px",
      borderRadius: 0,
      border: 0,
      background: "transparent",
      "--message-size": "16px",
    },
  },
});

/**
 * Câmpul de text pe telefon, ca la WhatsApp și ca în aplicație (`mobil/src/fir/BaraScris.tsx`): rotunjit, 36 pe un rând, gri
 * deschis. Pe desktop `display: contents`: caseta din 25d rămâne cum era.
 */
const CampTelefon = styled("div", {
  base: {
    display: "contents",
    _phone: {
      display: "flex",
      alignItems: "center",
      flexGrow: 1,
      minWidth: 0,
      minHeight: "36px",
      boxSizing: "border-box",
      padding: "0 12px",
      borderRadius: "18px",
      background: "#F3F3F6",
      border: "1px solid #E5E5E5",
    },
  },
});

const Parent = styled("div", {
  base: {
    flexGrow: 1,
    flexShrink: 0,

    display: "flex",
    gap: "var(--gap-md)",
    // BBT: zona de mesaje n-are padding lateral (e plată, pânza TRW) — marginea o pune caseta. 12 / 20 / 16 ca în
    // 25d; pe telefon, mai strâns.
    margin: "12px 20px 16px",
    // Pe telefon, fâșia de jos ca la WhatsApp: pe toată lățimea, cu o linie fină deasupra, 6 de jur împrejur.
    _phone: {
      margin: 0,
      padding: "6px",
      background: "#FFFFFF",
      borderTop: "1px solid #E5E5E5",
    },
    maxHeight: "var(--layout-height-message-box)",
  },
});

/**
 * Blocked message
 */
const Blocked = styled(Row, {
  base: {
    flexGrow: 1,
    fontSize: "14px",
    userSelect: "none",
    padding: "var(--gap-md)",
  },
  variants: {
    noPad: { true: { padding: 0 } },
  },
});

/**
 * Specific-width icon container
 */
export const InlineIcon = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "40px",

    // BBT: „+" și emoji = cercuri de 40 (21a, 30 oct 2026). Până atunci pătrate de 32 cu colțuri de 8 (pânza TRW).
    "& > button": {
      width: "40px",
      height: "40px",
      paddingInline: 0,
      borderRadius: "50%",
    },
  },
  variants: {
    size: {
      short: { width: "4px" },
      normal: {
        width: "40px",
        // „+" și camera din aplicație: 38 × 36, fără cerc în jur (bara ca la WhatsApp, 4 nov; până atunci 44 × 48).
        _phone: {
          width: "38px",
          height: "36px",
          "& > button": { width: "38px", height: "36px" },
        },
      },
    },
  },
  defaultVariants: {
    size: "normal",
  },
});

const FloatingAction = styled("div", {
  base: {
    flexShrink: 0,
    flexGrow: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
  },
  variants: {
    size: {
      short: {
        height: "1em",
      },
      normal: {
        height: "1.5em",
      },
      tall: {
        height: "2em",
      },
    },
    error: {
      true: {
        color: "var(--md-sys-color-error)",
      },
    },
  },
});

const ActionContainer = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    flexGrow: 1,
  },
  variants: {
    column: {
      true: {
        flexFlow: "column",
      },
    },
  },
});

/**
 * Message box
 */
export function MessageBox(props: Props) {
  // props.updateDraftSelection?.(
  //   event.currentTarget.selectionStart,
  //   event.currentTarget.selectionEnd,
  // );

  /**
   * Set initial draft selection
   */
  onMount(() =>
    props.updateDraftSelection?.(props.content.length, props.content.length),
  );

  return (
    <Parent>
      <Base>
        <Switch fallback={props.actionsStart}>
          <Match when={props.timeoutActive || !props.sendingAllowed}>
            <InlineIcon>
              <Blocked>
                <BiRegularBlock size={24} />
              </Blocked>
            </InlineIcon>
          </Match>
        </Switch>
        <Switch
          fallback={
            <>
              <CampTelefon>
                <TextEditor2
                  placeholder={props.placeholder}
                  initialValue={props.initialValue}
                  nodeReplacement={props.nodeReplacement}
                  onChange={props.setContent}
                  onComplete={props.onSendMessage}
                  onTyping={props.onTyping}
                  onPreviousContext={props.onEditLastMessage}
                  autoCompleteSearchSpace={props.autoCompleteSearchSpace}
                />
              </CampTelefon>
              <Show when={props.sendingAllowed}>{props.actionsEnd}</Show>
            </>
          }
        >
          <Match when={props.timeoutActive}>
            <Blocked align noPad>
              <Trans>
                You are timed out and can't send messages right now.
              </Trans>
            </Blocked>
          </Match>
          <Match when={!props.sendingAllowed}>
            <Blocked align noPad>
              <Trans>
                You don't have permission to send messages in this channel.
              </Trans>
            </Blocked>
          </Match>
        </Switch>
      </Base>
      <Show when={props.sendingAllowed}>{props.actionsAppend}</Show>
    </Parent>
  );
}

MessageBox.InlineIcon = InlineIcon;

MessageBox.FloatingAction = FloatingAction;

MessageBox.ActionContainer = ActionContainer;
