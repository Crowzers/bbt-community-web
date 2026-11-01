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
    // BBT: antet plat, cu un fir dedesubt. 72 de înălțime și 20 pe laterale, ca în 25e (1 nov 2026); în 21a, 64 / 24.
    height: "72px",
    borderRadius: 0,
    padding: "0 20px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",

    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",

    backgroundSize: "cover !important",
    backgroundPosition: "center !important",
    "& svg": {
      flexShrink: 0,
    },
    // BBT: butoanele-iconiță din antet = cercuri gri de 36, la 6 unul de altul (25d, 31 oct 2026; în 21a, 40).
    // „Vezi profilul" (`.bbt-buton-panou`) e pastilă cu text și își ține forma.
    "& > button:not(.bbt-buton-panou), & > span > button": {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "#F3F3F6",
    },
    "& > :is(button, span) + :is(button, span)": {
      marginLeft: "-4px",
    },
    _phone: {
      "& > button:not(.bbt-buton-panou), & > span > button": {
        width: "40px",
        height: "40px",
        background: "#F2F2F3",
      },
      "& > :is(button, span) + :is(button, span)": {
        marginLeft: 0,
      },
    },
  },
  variants: {
    placement: {
      primary: {
        margin: 0,
        // Antetul firului din aplicație (19b): alb, fără fir dedesubt, 6 + pastila de 48 + 6, 12 pe laterale.
        _phone: {
          height: "60px",
          padding: "0 12px",
          gap: "8px",
          borderBottom: "0",
          background: "#FFFFFF",
        },
      },
      // Capul listei de canale: fără fir dedesubt, titlul stă în coloană. Din 25d: 14 sus, rândul de 34, 12 până la canale.
      secondary: {
        margin: 0,
        boxSizing: "border-box",
        padding: "14px 16px 12px",
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
