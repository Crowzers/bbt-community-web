import { For, Show } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { NIVELE, formatXp, nivelPentruScor } from "./nivele";

/**
 * Harta nivelelor, varianta H2 „drumul" (design `2026-11-18-inel-nivel-design.md` §5, decizia 11): treptele în
 * ordine, cu pragul fiecăreia, treapta omului cu bara de progres și „Mai ai X XP până la Y" sus. Varianta respinsă,
 * H1 „scara", arăta doar treptele; aici distanța până la următoarea e primul lucru citit, fiindcă apropierea de
 * țintă e ce motivează (Kivetz 2006).
 *
 * Se deschide din „?" de lângă Power în mini-profil și ia locul cardului, în același popover (desktop) sau în
 * aceeași foaie (telefon și tabletă): fără a doua fereastră peste prima, iar „‹" te întoarce la profil.
 * Echipa n-are „?" (scorul ei nu contează), deci n-ajunge aici.
 */
export function HartaNivele(props: { scor: number; onInapoi: () => void }) {
  const pozitie = () => nivelPentruScor(props.scor);
  // De jos în sus: Beginner jos, Icon sus, ca un drum pe care urci.
  const trepte = () => [...NIVELE.keys()].reverse();

  return (
    <div style={{ padding: "12px 16px 16px", color: "#0A0A0B" }}>
      <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
        <button
          type="button"
          aria-label="Înapoi la profil"
          onClick={props.onInapoi}
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            width: "32px",
            height: "32px",
            "margin-left": "-6px",
            padding: 0,
            border: 0,
            "border-radius": "50%",
            background: "transparent",
            color: "#0A0A0B",
            cursor: "pointer",
          }}
        >
          <Symbol size={20}>chevron_left</Symbol>
        </button>
        <span style={{ "font-size": "17px", "font-weight": 700 }}>
          Nivelele BBT
        </span>
      </div>

      <Show when={pozitie().urmator}>
        {(urmator) => (
          <p
            style={{
              margin: "6px 0 0",
              "font-size": "14px",
              "line-height": 1.45,
              color: "#0A0A0B",
            }}
          >
            Mai ai <b>{formatXp(pozitie().panaLaUrmator)} XP</b> până la{" "}
            <b>{urmator().nume}</b>
          </p>
        )}
      </Show>

      <ol style={{ margin: "14px 0 0", padding: 0, "list-style": "none" }}>
        <For each={trepte()}>
          {(i) => {
            const nivel = NIVELE[i];
            const atins = () => i <= pozitie().index;
            const curent = () => i === pozitie().index;
            const ultima = i === 0;
            return (
              <li style={{ display: "flex", gap: "12px" }}>
                {/* Bulina și drumul până la treapta de dedesubt. */}
                <div
                  style={{
                    display: "flex",
                    "flex-direction": "column",
                    "align-items": "center",
                    width: "14px",
                    "flex-shrink": 0,
                  }}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      "margin-top": "3px",
                      "box-sizing": "border-box",
                      "border-radius": "50%",
                      border: `2px solid ${nivel.culoare}`,
                      // Plină = atinsă (§5): culoarea singură nu spune „ai ajuns aici".
                      background: atins() ? nivel.culoare : "#FFFFFF",
                    }}
                  />
                  <Show when={!ultima}>
                    <span
                      style={{
                        flex: 1,
                        width: "2px",
                        "min-height": "12px",
                        background: atins() ? "#0A0A0B" : "#E5E5E5",
                        opacity: atins() ? 0.2 : 1,
                      }}
                    />
                  </Show>
                </div>
                <div
                  style={{
                    flex: 1,
                    "min-width": 0,
                    "padding-bottom": ultima ? 0 : "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      "align-items": "baseline",
                      "justify-content": "space-between",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        "font-size": "14px",
                        "font-weight": curent() ? 700 : 600,
                        color: atins() ? "#0A0A0B" : "#6C6C6D",
                      }}
                    >
                      {nivel.nume}
                    </span>
                    <span
                      style={{
                        "font-size": "13px",
                        color: "#6C6C6D",
                        "white-space": "nowrap",
                      }}
                    >
                      {formatXp(nivel.prag)} XP
                    </span>
                  </div>
                  <Show when={curent() && pozitie().urmator}>
                    <div
                      role="progressbar"
                      aria-label={`Progres spre ${pozitie().urmator!.nume}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(pozitie().progres * 100)}
                      style={{
                        height: "6px",
                        "margin-top": "6px",
                        "border-radius": "999px",
                        background: "#F2F2F3",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(3, pozitie().progres * 100)}%`,
                          height: "100%",
                          "border-radius": "999px",
                          background: nivel.culoare,
                        }}
                      />
                    </div>
                  </Show>
                </div>
              </li>
            );
          }}
        </For>
      </ol>

      <p
        style={{
          margin: "14px 0 0",
          "font-size": "13px",
          color: "#6C6C6D",
        }}
      >
        O tabără aduce cam 750-950 XP.
      </p>
    </div>
  );
}
