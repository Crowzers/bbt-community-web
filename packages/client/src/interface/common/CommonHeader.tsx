import { BiRegularChevronRight } from "solid-icons/bi";

import { JSX, Match, Switch } from "solid-js";

import MdArrowBack from "@material-design-icons/svg/outlined/arrow_back.svg?component-solid";

import { useLingui } from "@lingui/solid/macro";
import { css } from "styled-system/css";

import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";

/**
 * Wrapper for header icons which adds the chevron on the
 * correct side for toggling sidebar (if on desktop) and
 * the hamburger icon to open sidebar (if on mobile).
 *
 * BBT: cu lista deschisă, fără săgeată (25e): nu mai închide nimic de aici. Rămâne doar ca să redeschidă o listă închisă.
 */
export function HeaderIcon(props: { children: JSX.Element }) {
  const state = useState();
  const { t } = useLingui();

  return (
    <div
      class={container}
      onClick={() => {
        const ad = state.appDrawer();
        if (ad) ad.setShown(false);
        else if (
          !state.layout.getSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, true)
        )
          state.layout.toggleSectionState(
            LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
            true,
          );
      }}
      use:floating={{
        tooltip: {
          placement: "bottom",
          content: t`Toggle main sidebar`,
        },
      }}
    >
      <Switch
        fallback={
          <>
            <BiRegularChevronRight size={20} />
            {props.children}
          </>
        }
      >
        <Match when={state.appDrawer()}>
          <MdArrowBack />
        </Match>
        <Match
          when={state.layout.getSectionState(
            LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
            true,
          )}
        >
          {props.children}
        </Match>
      </Switch>
    </div>
  );
}

const container = css({
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
});
