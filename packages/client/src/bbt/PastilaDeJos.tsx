import { For, Show, createMemo } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

import { SlideState } from "../../components/ui/components/navigation/SlideDrawer";

import { useExperiente } from "./cont/date";
import { AvatarOm, IconBalon, IconBilet, IconDiez } from "./telefon";

/**
 * BBT: meniul de jos pe telefon, ACEEAȘI pastilă ca în aplicația mobilă (`mobil/src/ui/PastilaDeJos.tsx`, macheta 19):
 * cererea userului, 30 oct 2026: „pe telefon, varianta web să arate fix ca aplicația". Pastilă neagră plutitoare de 60,
 * tab-ul activ se lărgește în roz cu numele lui, celelalte rămân iconițe, iar la capăt stă avatarul cu inel roz, care
 * duce la Profil. Înlocuiește pe telefon bara de sus și bara de tab-uri (`BaraSus compact`, `BaraSectiuni orizontal`).
 *
 * ⚠️ Stă în `Interface.tsx`, peste tot, nu în lista de canale: pe telefon Experiențe și Profil sunt în `/cont`, care
 * alunecă PESTE listă (SlideDrawer), iar în lista de canale pastila ar fi rămas sub ele.
 *
 * Se vede pe paginile de nivel 1, ca în aplicație: listele (panoul închis), Experiențe și Profil. În fir și în
 * paginile din cont (Plăți, tabăra) nu: acolo jos stă bara de scris, respectiv pagina are „înapoi".
 */

type Tab = "comunitate" | "mesaje" | "experiente" | "profil";

const NEGRU = "#0A0A0B";
const ROZ = "#FFB3D9";
const ALB = "#FFFFFF";

const TABURI: { id: Tab; eticheta: string; Icon: typeof IconDiez }[] = [
  { id: "comunitate", eticheta: "Comunitate", Icon: IconDiez },
  { id: "mesaje", eticheta: "Mesaje", Icon: IconBalon },
  { id: "experiente", eticheta: "Experiențe", Icon: IconBilet },
];

export function PastilaDeJos() {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const experiente = useExperiente();

  const cale = () => location.pathname;
  const panouInchis = () => state.appDrawer()?.state === SlideState.HIDDEN;

  const activ = createMemo<Tab>(() => {
    if (cale() === "/cont" || cale() === "/cont/") return "profil";
    if (cale().startsWith("/cont")) return "experiente";
    return cale().startsWith("/server") ? "comunitate" : "mesaje";
  });

  const vizibila = () =>
    cale() === "/cont" ||
    cale() === "/cont/" ||
    cale() === "/cont/experiente" ||
    (!cale().startsWith("/cont") && panouInchis());

  // Punctul roz de pe iconiță, ca în aplicație: mesaje necitite, respectiv ceva care ține azi.
  const arePunct = (t: Tab) =>
    t === "mesaje"
      ? state.ordering
          .orderedConversations(client())
          .some((c) => c.type === "DirectMessage" && c.unread)
      : t === "experiente" && !!experiente.data?.active.some((e) => e.azi);

  function mergi(t: Tab) {
    if (t === "experiente") return navigate("/cont/experiente");
    if (t === "profil") return navigate("/cont");
    // Listele stau sub conținut: închidem panoul, ca lista să iasă la vedere.
    state.appDrawer()?.setShown(false);
    if (t === "mesaje") return navigate("/friends");
    const s = client().servers.toList()[0];
    if (s) navigate(`/server/${s.id}`);
  }

  return (
    <Show when={vizibila()}>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(env(safe-area-inset-bottom) + 6px)",
          "z-index": 15,
          display: "flex",
          "justify-content": "center",
          "pointer-events": "none",
        }}
      >
        {/* 60 de înălțime: 7 + tab-ul de 46 + 7, ca în 19a. Sticla din aplicație e aici neagră mată cu blur. */}
        <nav
          aria-label="Meniu"
          style={{
            "pointer-events": "auto",
            display: "flex",
            "align-items": "center",
            gap: "4px",
            padding: "7px",
            "border-radius": "30px",
            background: "rgba(10,10,11,0.92)",
            "-webkit-backdrop-filter": "blur(20px) saturate(1.6)",
            "backdrop-filter": "blur(20px) saturate(1.6)",
            "box-shadow": "0 8px 18px rgba(0,0,0,0.28)",
          }}
        >
          <For each={TABURI}>
            {(t) => {
              const eActiv = () => activ() === t.id;
              return (
                <button
                  type="button"
                  aria-label={t.eticheta}
                  aria-current={eActiv() ? "page" : undefined}
                  onClick={() => mergi(t.id)}
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    gap: eActiv() ? "8px" : "0",
                    height: "46px",
                    "min-width": "46px",
                    padding: eActiv() ? "0 18px" : "0 12px",
                    "box-sizing": "border-box",
                    "border-radius": "23px",
                    border: 0,
                    background: eActiv() ? ROZ : "transparent",
                    color: eActiv() ? NEGRU : ALB,
                    // Pastila roz „curge" spre tab-ul nou, ca `LayoutAnimation` din aplicație (220 ms).
                    transition:
                      "padding 220ms ease-in-out, background-color 220ms ease-in-out",
                    "font-family": "Inter, sans-serif",
                    cursor: "pointer",
                    "-webkit-tap-highlight-color": "transparent",
                  }}
                >
                  <span style={{ position: "relative", display: "flex" }}>
                    <t.Icon />
                    <Show when={arePunct(t.id) && !eActiv()}>
                      <span
                        style={{
                          position: "absolute",
                          top: "-2px",
                          right: "-4px",
                          width: "9px",
                          height: "9px",
                          "border-radius": "50%",
                          background: ROZ,
                        }}
                      />
                    </Show>
                  </span>
                  <Show when={eActiv()}>
                    <span style={{ "font-size": "14px", "font-weight": 800 }}>
                      {t.eticheta}
                    </span>
                  </Show>
                </button>
              );
            }}
          </For>
          {/* Avatarul stă într-un buton de 46, ca tab-urile; 34 + 2 × 3 de inel = 40, ca în 19a. */}
          <button
            type="button"
            aria-label="Profil"
            aria-current={activ() === "profil" ? "page" : undefined}
            onClick={() => mergi("profil")}
            style={{
              width: "46px",
              height: "46px",
              "margin-left": "4px",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "23px",
              border: 0,
              padding: 0,
              background: activ() === "profil" ? ROZ : "transparent",
              cursor: "pointer",
              "-webkit-tap-highlight-color": "transparent",
            }}
          >
            <span
              style={{
                display: "flex",
                "border-radius": "20px",
                border: `3px solid ${ROZ}`,
              }}
            >
              <AvatarOm om={client().user} marime={34} />
            </span>
          </button>
        </nav>
      </div>
    </Show>
  );
}

/**
 * Cât loc lasă ecranele jos, ca ultimul rând să nu stea sub pastilă (96, ca în aplicație). Fără zona de gest: `#root`
 * se oprește deasupra ei (`components/ui/styles.css`), deci listele n-o au de ocolit.
 */
export const LOC_PASTILA = "96px";
