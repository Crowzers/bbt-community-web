import { Accessor, JSX, Setter, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useDevice } from "@revolt/common";
import { useState } from "@revolt/state";
import { Breadcrumbs, IconButton, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";

import { SettingsList } from "..";
import { useSettingsNavigation } from "../Settings";

/**
 * Content portion of the settings menu
 */
export function SettingsContent(props: {
  onClose?: () => void;
  children: JSX.Element;
  list: Accessor<SettingsList<unknown>>;
  title: (ctx: SettingsList<never>, key: string) => string;
  page: Accessor<string | undefined>;
  ref: Setter<HTMLDivElement | undefined>;
  action: Accessor<(() => JSX.Element) | undefined>;
}) {
  const { navigate } = useSettingsNavigation();
  const { diagDrawer } = useState();
  const { layout } = useDevice();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div ref={props.ref} use:scrollable={{ class: base }}>
      <Show when={props.page()}>
        <InnerContent class="settings_cont">
          <InnerColumn>
            {/* BBT: pe telefon/tabletă, ieșirile vizibile. Butonul „X" de pe desktop e ascuns sub
                lățimea de tabletă, iar înapoi la listă se ajungea DOAR glisând — pe iPhone nimeni
                nu ghicea, deci panoul nu mai avea ieșire (6 oct 2026). */}
            <BaraTelefon>
              {/* Lista paginilor e un ecran separat DOAR pe telefon; pe tabletă stă alături. */}
              <Show when={layout() === "phone"}>
                <button
                  type="button"
                  onClick={() => diagDrawer()?.setShown(false)}
                >
                  <Symbol size={18}>arrow_back</Symbol>
                  Meniu
                </button>
              </Show>
              <Show when={props.onClose}>
                <button
                  type="button"
                  aria-label="Închide"
                  onClick={() => props.onClose?.()}
                >
                  <Symbol size={18}>close</Symbol>
                </button>
              </Show>
            </BaraTelefon>
            <Show when={props.page() !== "account"}>
              <Text class="title" size="large">
                <Breadcrumbs
                  elements={props.page()!.split("/")}
                  renderElement={(key) =>
                    props.title(props.list() as SettingsList<never>, key)
                  }
                  navigate={(keys) => navigate(keys.join("/"))}
                />
              </Text>
            </Show>
            {props.children}
            <div class={css({ minHeight: "80px" })} />
          </InnerColumn>
        </InnerContent>
      </Show>
      <ActionRail>
        <Show when={props.onClose}>
          <CloseAction class="close">
            <IconButton variant="tonal" onPress={props.onClose}>
              <MdClose />
            </IconButton>
          </CloseAction>
        </Show>
        <FloatingActions>
          <Presence>
            <Show when={props.action()} keyed>
              {(renderAction) => (
                <Motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                      duration: reduceMotion ? 0 : 0.2,
                      easing: [0.3, 0, 0.8, 0.15],
                    },
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.3,
                    easing: [0.05, 0.7, 0.1, 1],
                  }}
                  style={{ "transform-origin": "center" }}
                >
                  {renderAction()}
                </Motion.div>
              )}
            </Show>
          </Presence>
        </FloatingActions>
      </ActionRail>
    </div>
  );
}

/**
 * Base styles
 */
const base = css({
  minWidth: 0,
  flex: "1 1 800px",
  flexDirection: "row",
  display: "flex",
  background: "var(--md-sys-color-surface-container-low)",
  borderStartStartRadius: "30px",
  borderEndStartRadius: "30px",

  "& > a": {
    textDecoration: "none",
  },

  _phone: {
    borderRadius: 0,
  },

  _tablet: {
    // prevent the fixed action rail from scroll with this element instead of the viewport
    willChange: "auto !important",
  },
});

/**
 * Settings pane
 */
const InnerContent = styled("div", {
  base: {
    gap: "13px",
    minWidth: 0,
    width: "100%",
    display: "flex",
    maxWidth: "740px",
    padding: "80px 32px",
    justifyContent: "stretch",
    zIndex: 1,

    _tablet: { padding: "0 12px 12px" },
    // BBT: `minHeight: 100%` în loc de `height: 100vh` — pe iPhone 100vh e mai înalt decât ecranul
    // vizibil, iar ultimele câmpuri (și „Salvare") nu se mai puteau aduce în ecran.
    _phone: { minHeight: "100%" },
  },
});

/**
 * Pane content column
 */
const InnerColumn = styled("div", {
  base: {
    width: "100%",
    gap: "var(--gap-md)",
    display: "flex",
    flexDirection: "column",
    marginBlockEnd: "80px",
  },
});

/**
 * Viewport-height rail for settings controls
 */
const ActionRail = styled("div", {
  base: {
    height: "100vh",
    minWidth: "56px",
    padding: "80px 8px calc(var(--gap-xl) + env(safe-area-inset-bottom))",

    zIndex: 2,
    flexGrow: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,

    _tablet: {
      position: "fixed",
      insetInlineEnd: 0,
      // BBT: ecranul vizibil (src/bbt/ecran.ts), ca butoanele plutitoare să nu stea sub bara Safari.
      top: "calc(var(--bbt-ecran-sus, 0px) + env(safe-area-inset-top))",
      height:
        "calc(var(--bbt-ecran-h, 100dvh) - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      padding: "12px",
      paddingBlockEnd: "calc(12px + env(safe-area-inset-bottom))",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      pointerEvents: "none",

      "& > *": {
        pointerEvents: "auto",
      },
    },
  },
});

/**
 * BBT: bara de sus pe telefon/tabletă — „← Meniu" (lista paginilor) și „X". Lipită sus cât derulezi.
 */
const BaraTelefon = styled("div", {
  base: {
    display: "none",

    _tablet: {
      position: "sticky",
      top: 0,
      zIndex: 3,
      height: "52px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginInline: "-12px",
      paddingInline: "4px",
      background: "var(--md-sys-color-surface-container-low)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",

      "& button": {
        height: "40px",
        minWidth: "40px",
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        border: 0,
        borderRadius: "10px",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
      },
      "& button:last-child": {
        marginInlineStart: "auto",
      },
    },
  },
});

/**
 * Bottom-end anchor for actions belonging to the current settings page
 */
const FloatingActions = styled("div", {
  base: {
    height: "fit-content",
  },
});

/**
 * Positioning for close button
 */
const CloseAction = styled("div", {
  base: {
    visibility: "visible",

    "&:after": {
      content: '"ESC"',
      marginTop: "4px",
      display: "flex",
      justifyContent: "center",
      width: "40px",
      fontWeight: 600,
      color: "var(--md-sys-color-on-surface)",
      fontSize: "0.75rem",
    },

    _tablet: {
      display: "none",
    },
  },
});
