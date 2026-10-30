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
    // BBT: antet plat, cu un fir dedesubt. 64 de înălțime și 24 pe laterale, ca în 21a (30 oct 2026); până atunci
    // 52 / 16 (pânza TRW).
    height: "64px",
    borderRadius: 0,
    padding: "0 24px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",

    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",

    backgroundSize: "cover !important",
    backgroundPosition: "center !important",
    "& svg": {
      flexShrink: 0,
    },
    // BBT: butoanele-iconiță din antet = cercuri gri de 40 (21a, 30 oct 2026; până atunci pătrate de 32, pânza TRW).
    // „Vezi profilul" (`.bbt-buton-panou`) e pastilă cu text și își ține forma.
    "& > button:not(.bbt-buton-panou), & > span > button": {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#F2F2F3",
    },
  },
  variants: {
    placement: {
      primary: {
        margin: 0,
      },
      // Capul listei de canale: fără fir dedesubt, titlul stă în coloană (21a).
      secondary: {
        margin: 0,
        padding: "0 16px 0 22px",
        borderBottom: "0",
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
