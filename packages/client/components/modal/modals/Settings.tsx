import { createEffect, createSignal, on, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";
import { css } from "styled-system/css";

import { Settings, SettingsConfigurations } from "@revolt/app";
import { useState } from "@revolt/state";
import { DialogProps } from "@revolt/ui";
import { SlideDrawer } from "@revolt/ui/components/navigation/SlideDrawer";

import { Modals } from "../types";

/**
 * Modal to display server information
 */
export function SettingsModal(
  props: DialogProps & Modals & { type: "settings" },
) {
  const { setDiagDrawer } = useState();
  // eslint-disable-next-line solid/reactivity
  const config = SettingsConfigurations[props.config];

  //Drawer slider for mobile
  let rootRef, sDrawer: SlideDrawer | undefined;
  const [contRef, setContRef] = createSignal<HTMLDivElement>();
  createEffect(
    on(contRef, (cont) => {
      if (!cont || sDrawer) return;
      sDrawer = new SlideDrawer(cont, rootRef!);
      setDiagDrawer(sDrawer);
    }),
  );
  onCleanup(() => {
    sDrawer?.delete();
    setDiagDrawer((sDrawer = undefined));
  });

  return (
    <Portal mount={document.getElementById("floating")!}>
      <div
        style={{
          "z-index": 100,
          position: "fixed",
          width: "100%",
          // BBT: ecranul VIZIBIL (src/bbt/ecran.ts), ca #root. Cu `100vh`, pe iPhone partea de jos a
          // setărilor (butonul de salvare) stătea sub bara de adrese a Safari-ului (6 oct 2026).
          height:
            "calc(var(--bbt-ecran-h, 100dvh) - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
          left: 0,
          top: "calc(var(--bbt-ecran-sus, 0px) + env(safe-area-inset-top))",
          "pointer-events": "none",
        }}
      >
        <Presence>
          <Show when={props?.show}>
            <Motion.div
              ref={rootRef}
              class={settingsOverlay}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{
                duration: 0.3,
                easing: [0.17, 0.67, 0.58, 0.98],
              }}
            >
              <Settings
                onClose={props.onClose}
                render={config.render}
                title={config.title}
                list={config.list}
                context={props.context as never}
                contentRef={setContRef}
              />
            </Motion.div>
          </Show>
        </Presence>
      </div>
    </Portal>
  );
}

const settingsOverlay =
  "settings_overlay " +
  css({
    display: "flex",
    height: "100%",
    pointerEvents: "all",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-highest)",
  });
