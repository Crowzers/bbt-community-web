import { styled } from "styled-system/jsx";

export interface Props {
  readonly placement: "primary" | "secondary";

  readonly topBorder?: boolean;
  readonly bottomBorder?: boolean;
}

/**
 * Header component
 */
export const Header = styled("div", {
  base: {
    gap: "10px",
    flex: "0 auto",
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    fontWeight: 600,
    userSelect: "none",
    overflow: "hidden",
    // BBT (pânza TRW): antet plat, 52px, cu un fir dedesubt — nu pastilă rotunjită cu margini.
    height: "52px",
    borderRadius: 0,
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",

    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",

    backgroundSize: "cover !important",
    backgroundPosition: "center !important",
    "& svg": {
      flexShrink: 0,
    },
    // BBT: butoanele-iconiță din antet — 32px, colțuri de 8px (pânza TRW), nu cercuri de 40px.
    "& > button": {
      height: "32px",
      borderRadius: "8px",
    },
  },
  variants: {
    placement: {
      primary: {
        margin: 0,
      },
      secondary: {
        margin: 0,
        padding: "0 14px",
        backgroundColor: "transparent",
      },
    },
    image: {
      true: {
        color: "white",
        fill: "white",

        alignItems: "flex-end",
        justifyContent: "stretch",
        textShadow: "0px 0px 1px var(--md-sys-color-shadow)",
        height: "120px",

        "& > div": {
          flexGrow: 1,
          padding: "6px 14px",
          background: "linear-gradient(0deg, black, transparent)",
        },
      },
    },
    transparent: {
      true: {
        width: "calc(100% - var(--gap-md))",
        zIndex: "10",
      },
    },
  },
  compoundVariants: [],
  defaultVariants: {
    placement: "primary",
    image: false,
    transparent: false,
  },
});

/**
 * Position an element below a floating header
 *
 * Ensure you place a div inside to make the positioning work
 */
export const BelowFloatingHeader = styled("div", {
  base: {
    position: "relative",
    zIndex: "10",

    // i guess this works, probably refactor this later
    "& > div > div": {
      width: "100%",
      position: "absolute",
      top: "var(--gap-md)",
    },
  },
});
