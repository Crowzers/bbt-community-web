import { cva } from "styled-system/css";

/**
 * Styles for the main content of a page
 *
 * This creates a surface on the lowest level with appropriate padding and separation.
 */
export const main = cva({
  base: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,

    display: "flex",
    overflow: "hidden",
    flexDirection: "column",

    // BBT (layout TRW, pânza aprobată 5 oct 2026): zona de mesaje e PLATĂ — fără ramă, fără colțuri,
    // lipită de lista de canale și de cea de membri, separate doar de un fir. #0D0D0D = alb 5% pe negru.
    paddingInline: 0,
    margin: 0,
    borderRadius: 0,
    background: "#0D0D0D",
    paddingBottom: "env(keyboard-inset-height)",

    _tablet: {
      margin: 0,
      borderRadius: "var(--borderRadius-xl) 0 0 0",
    },

    _phone: {
      margin: 0,
      borderRadius: 0,
    },
  },
});
