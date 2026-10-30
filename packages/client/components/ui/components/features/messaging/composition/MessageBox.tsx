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

    // BBT: proporțiile din 21a (30 oct 2026, „păstrăm proporțiile la tot ce a făcut el"): pastila are 56 pe un
    // rând = 6 + 44 (microfonul rotund) + 6, cu „+" și emoji în cercuri de 40. Textul lung crește în sus. Până atunci
    // 44 (casetă de 44 cu butoane pătrate de 32, pânza TRW).
    // 🔥 Pastila NEAGRĂ din 21 și 23 (30 oct 2026, „bara de scris e pastila neagră"), ca în aplicația de telefon.
    // Până atunci: #141414 cu fir, colțuri de 10px. Variabilele de culoare se suprascriu AICI, ca textul și
    // iconițele dinăuntru (care citesc tema albă) să iasă albe pe negru.
    minHeight: "56px",
    boxSizing: "border-box",
    padding: "6px 6px 6px 8px",
    gap: "6px",
    borderRadius: "28px",
    border: "1px solid transparent",

    display: "flex",
    alignItems: "flex-end",
    background: "#0A0A0B",
    color: "#FFFFFF",
    "--md-sys-color-on-surface": "#FFFFFF",
    "--md-sys-color-on-surface-variant": "#C9C9CE",
    "--md-sys-color-outline": "#A0A0AA",
  },
});

const Parent = styled("div", {
  base: {
    flexGrow: 1,
    flexShrink: 0,

    display: "flex",
    gap: "var(--gap-md)",
    // BBT: zona de mesaje n-are padding lateral (e plată, pânza TRW) — marginea o pune caseta. 12 / 24 / 20 ca în
    // 21a; pe telefon, mai strâns.
    margin: "12px 24px 20px",
    _phone: {
      margin: "0 12px 12px",
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
    height: "44px",

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
      normal: { width: "40px" },
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
