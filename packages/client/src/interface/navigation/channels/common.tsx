import { styled } from "styled-system/jsx";

/**
 * Common styles for sidebar
 */
export const SidebarBase = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    flexDirection: "column",
    overflow: "hidden",
    // BBT: plat, cu un fir spre zona de mesaje (pânza TRW), nu ramă rotunjită.
    borderRight: "1px solid rgba(255,255,255,0.08)",
    // borderRadius: "var(--borderRadius-lg)",
    // margin: "var(--gap-md) var(--gap-md) var(--gap-md) 0",
    width: "var(--layout-width-channel-sidebar)",

    fill: "var(--md-sys-color-on-surface)",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",

    "& a": {
      textDecoration: "none",
    },

    _phone: {
      flexGrow: 1,
    },
  },
});
