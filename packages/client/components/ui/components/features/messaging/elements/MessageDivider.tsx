import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

/**
 * Divider line
 */
const Base = styled("div", {
  base: {
    height: 0,
    display: "flex",
    userSelect: "none",
    alignItems: "center",
    // BBT (pânza TRW): data CENTRATĂ pe un fir fin — „—— Astăzi ——".
    justifyContent: "center",
    margin: "17px 16px",

    "& time": {
      marginTop: "-2px",
      fontSize: "11px",
      lineHeight: "11px",
      fontWeight: 500,
      paddingInline: "10px",

      color: "rgba(255,255,255,0.48)",
      background: "#0D0D0D",
    },
  },
  variants: {
    unread: {
      true: {
        borderTop: "thin solid var(--md-sys-color-primary)",
      },
      false: {
        borderTop: "1px solid rgba(255,255,255,0.08)",
      },
    },
  },
  defaultVariants: {
    unread: false,
  },
});

/**
 * Unread indicator
 */
const Unread = styled("div", {
  base: {
    fontSize: "0.625rem",
    fontWeight: 600,
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",

    padding: "0 6px",
    marginTop: "-1px",
    borderRadius: "60px",
  },
});

interface Props {
  /**
   * Display the date
   */
  date?: string;

  /**
   * Show unread indicator
   */
  unread?: boolean;
}

/**
 * Generic message divider
 */
export function MessageDivider(props: Props) {
  return (
    <Base unread={props.unread}>
      <Show when={props.unread}>
        <Unread>
          <Trans>NEW</Trans>
        </Unread>
      </Show>
      <Show when={props.date}>
        <time>{props.date}</time>
      </Show>
    </Base>
  );
}
