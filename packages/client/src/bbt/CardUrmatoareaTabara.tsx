import { Show } from "solid-js";

import { useExperiente } from "./cont/date";
import { perioada } from "./cont/Experiente";
import { C, DE_FONTE } from "./cont/ui";

/**
 * BBT: următoarea tabără a omului, jos în panoul Membri (25e). Fără tabără activă, cardul nu apare.
 *
 * Stă mereu la baza panoului: `margin-top: auto` îl împinge jos când lista e scurtă (panoul e coloană flex, `raspuns.css`), iar
 * `sticky` îl ține la vedere când lista e mai lungă decât panoul.
 */
export function CardUrmatoareaTabara() {
  const experiente = useExperiente();
  const tabara = () => experiente.data?.active.find((e) => e.fel === "camp");

  return (
    <Show when={tabara()}>
      {(t) => (
        <div
          style={{
            position: "sticky",
            bottom: "16px",
            "z-index": 1,
            margin: "auto 14px 16px",
            display: "flex",
            "flex-direction": "column",
            gap: "4px",
            padding: "14px",
            "border-radius": "20px",
            background: "#FFEEF5",
            color: C.text,
          }}
        >
          <div
            style={{
              "font-size": "12px",
              "font-weight": 800,
              "letter-spacing": "0.06em",
            }}
          >
            URMĂTOAREA TABĂRĂ
          </div>
          <div
            style={{
              ...DE_FONTE,
              "font-size": "16px",
              "line-height": "18px",
            }}
          >
            {t().titlu}
          </div>
          <div
            style={{
              "font-size": "12px",
              "font-weight": 600,
              color: C.stins,
            }}
          >
            {perioada(t().dataStart, t().dataEnd)}
            {t().locatie ? ` · ${t().locatie}` : ""}
          </div>
        </div>
      )}
    </Show>
  );
}
