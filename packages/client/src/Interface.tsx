import {
  createEffect,
  createSignal,
  JSX,
  Match,
  onCleanup,
  Show,
  Switch,
} from "solid-js";

import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, ServerContextMenu } from "@revolt/app";
import { MessageCache } from "@revolt/app/interface/channels/text/MessageCache";
import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClient, useClientLifecycle } from "@revolt/client";
import { useBaraConexiune } from "@revolt/client/baraConexiune";
import { NotificationsWorker } from "@revolt/client/NotificationsWorker";
import { useDevice } from "@revolt/common";
import {
  Navigate,
  useBeforeLeave,
  useLocation,
  useNavigate,
} from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { LoadingScreen } from "@revolt/ui";

import { SlideDrawer } from "../components/ui/components/navigation/SlideDrawer";
import { ApelPrimit } from "./bbt/ApelPrimit";
import { BaraSus } from "./bbt/BaraSus";
import { firDeschis } from "./bbt/fir";
import { FundalRama } from "./bbt/FundalRama";
import { membriDeschisi } from "./bbt/MembriComunitate";
import { PastilaDeJos } from "./bbt/PastilaDeJos";
import { RegulileComunitatii } from "./bbt/RegulileComunitatii";
import { RAZA_FOAIE, Sidebar, useListaLaVedere } from "./interface/Sidebar";

/**
 * Application layout
 */
const Interface = (props: { children: JSX.Element }) => {
  const state = useState();
  const client = useClient();
  const navigate = useNavigate();
  const { isLoggedIn, lifecycle } = useClientLifecycle();
  const location = useLocation();
  const { pathname } = location;
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const cuLista = useListaLaVedere();

  useBeforeLeave((e) => {
    if (!e.defaultPrevented) {
      if (e.to === "/settings") {
        // BBT: setările noastre, nu panoul lor.
        e.preventDefault();
        navigate("/cont/profil");
      } else if (typeof e.to === "string") {
        state.layout.setLastActivePath(e.to);
      }
    }
  });

  createEffect(() => {
    if (!isLoggedIn()) {
      state.layout.setNextPath(pathname);
      console.debug("WAITING... currently", lifecycle.state());
    }
  });

  const baraVizibila = useBaraConexiune();

  //Drawer slider for mobile
  let rootRef, sDrawer: SlideDrawer | undefined;
  const [contRef, setContRef] = createSignal<HTMLDivElement>();
  function rstLayout() {
    state.layout.setSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, false, false);
    state.layout.setSectionState(LAYOUT_SECTIONS.MEMBER_SIDEBAR, false, true);
  }
  createEffect(() => {
    //Create drawer
    const cont = contRef();
    // BBT: pe telefon, intrarea în aplicație arată lista de canale, nu canalul (vezi SlideDrawer).
    if (cont && !sDrawer) {
      sDrawer = new SlideDrawer(cont, rootRef!, false);
      sDrawer.poateGlisa = () =>
        location.pathname.includes("/channel/") &&
        !firDeschis() &&
        !membriDeschisi();
      sDrawer.faraAnimatie = true;
    }
    //Update on layout change
    if (sDrawer) {
      const en = sDrawer.enabled;
      setTimeout(() => {
        state.setAppDrawer(en ? sDrawer : undefined);
        if (en) rstLayout();
      }, 1);
    }
  });
  onCleanup(() => {
    sDrawer?.delete();
    state.setAppDrawer((sDrawer = undefined));
  });

  return (
    <MessageCache client={client()}>
      <AppRoot
        ref={rootRef}
        class="app_root"
        // BBT: stiva în care `FundalRama` stă sub bară și sub foaie.
        style={
          telefon() ? undefined : { position: "relative", isolation: "isolate" }
        }
      >
        <Titlebar />
        <Switch fallback={<LoadingScreen />}>
          <Match when={!isLoggedIn()}>
            <Navigate href="/login" />
          </Match>
          <Match when={lifecycle.loadedOnce()}>
            {/* BBT: bara de sus cu contul separat — doar desktop; pe telefon, pastila de jos. src/bbt/BaraSus.tsx */}
            <Show when={!telefon()}>
              <FundalRama />
              <BaraSus />
            </Show>
            <Layout
              disconnected={baraVizibila()}
              style={{
                "flex-grow": 1,
                "min-height": 0,
                // Marginea comună din 25e. Sus, marginea e banda.
                ...(telefon()
                  ? {}
                  : {
                      background: "transparent",
                      padding: "0 var(--bbt-margine) var(--bbt-margine)",
                    }),
              }}
              onDragOver={(e) => {
                if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
              }}
              onDrop={(e) => e.preventDefault()}
            >
              <Sidebar
                menuGenerator={(target) => ({
                  contextMenu: () => {
                    return (
                      <>
                        {target instanceof Server ? (
                          <ServerContextMenu server={target} />
                        ) : (
                          <ChannelContextMenu channel={target} />
                        )}
                      </>
                    );
                  },
                })}
              />
              <Content
                ref={setContRef}
                class="app_body"
                sidebar={state.layout.getSectionState(
                  LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
                  true,
                )}
                // BBT: foaia albă începe de la lista din `Sidebar` și continuă aici; fără listă, foaia e toată aici.
                style={
                  telefon()
                    ? undefined
                    : {
                        overflow: "hidden",
                        "border-radius": cuLista()
                          ? `0 ${RAZA_FOAIE} ${RAZA_FOAIE} 0`
                          : RAZA_FOAIE,
                      }
                }
              >
                {props.children}
              </Content>
            </Layout>
          </Match>
        </Switch>

        <NotificationsWorker />
        {/* BBT: pastila de meniu de pe telefon, ca în aplicația mobilă — src/bbt/PastilaDeJos.tsx */}
        <Show when={lifecycle.loadedOnce() && layout() === "phone"}>
          <PastilaDeJos />
        </Show>
        {/* BBT: „X te sună" — src/bbt/ApelPrimit.tsx */}
        <Show when={lifecycle.loadedOnce()}>
          <ApelPrimit />
          <RegulileComunitatii />
        </Show>
      </AppRoot>
    </MessageCache>
  );
};

const AppRoot = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
});

/**
 * Parent container
 */
const Layout = styled("div", {
  base: {
    display: "flex",
    height: "100%",
    minWidth: 0,
  },
  variants: {
    disconnected: {
      true: {
        color: "var(--md-sys-color-on-primary-container)",
        background: "var(--md-sys-color-primary-container)",
      },
      false: {
        color: "var(--md-sys-color-outline)",
        background: "var(--md-sys-color-surface-container-high)",
      },
    },
  },
});

/**
 * Main content container
 */
const Content = styled("div", {
  base: {
    background: "var(--md-sys-color-surface-container-low)",
    display: "flex",
    width: "100%",
    minWidth: 0,
    // BBT: ancora ecranului de răspunsuri (`bbt/FirRaspunsuri.tsx`).
    position: "relative",
  },
  variants: {
    sidebar: {
      false: {
        // BBT: fără ramă rotunjită când lista de canale e ascunsă — layout plat (pânza TRW).
        overflow: "hidden",

        _tablet: {
          paddingLeft: 0,
        },
      },
    },
  },
});

export default Interface;
