import { Show, createSignal } from "solid-js";

import { useState } from "@revolt/state";

/**
 * BBT: cererea de notificări vine după un moment care îi dă sens (primul tău mesaj sau o mențiune), cu o frază înainte.
 * Până pe 1 nov 2026 pornea la primul clic oriunde în pagină, moment în care browserul primește refuz: pe web, cererile fără
 * context sunt acceptate de 6% pe desktop și 16% pe telefon (Web Almanac 2025), iar un refuz nu se mai poate cere din nou.
 *
 * Nu există în aplicația mobilă: acolo nu e push încă (Faza 5).
 */

const CHEIE_AMANAT = "bbt.notificari-amanate";
const PAUZA_MS = 14 * 24 * 60 * 60 * 1000;

function eAmanat() {
  try {
    const cand = Number(localStorage.getItem(CHEIE_AMANAT));
    return cand > 0 && Date.now() - cand < PAUZA_MS;
  } catch {
    return false;
  }
}

function amana() {
  try {
    localStorage.setItem(CHEIE_AMANAT, String(Date.now()));
  } catch {
    // Doar o comoditate: fără stocare, cererea revine la următorul moment.
  }
}

export function CerereNotificari(props: {
  /** A avut loc momentul util. */
  moment: boolean;
  laPornire: () => Promise<void>;
}) {
  const state = useState();
  const [inchisa, setInchisa] = createSignal(false);

  const poateCere = () =>
    "Notification" in window &&
    Notification.permission === "default" &&
    // „denied" aici = le-a oprit din Setări, nu din browser.
    state.settings.desktopNotificationsState !== "denied" &&
    !eAmanat();

  return (
    <Show when={props.moment && !inchisa() && poateCere()}>
      <div
        role="dialog"
        aria-label="Notificări"
        class="bbt-cerere-notificari"
        style={{
          position: "fixed",
          right: "28px",
          bottom: "28px",
          "z-index": 40,
          width: "320px",
          "box-sizing": "border-box",
          padding: "16px",
          "border-radius": "16px",
          border: "1px solid #E5E5E5",
          background: "#FFFFFF",
          "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
          color: "#0A0A0B",
          "font-size": "14px",
          "line-height": "20px",
        }}
      >
        <div style={{ "font-weight": 700, "font-size": "16px" }}>
          Vrei să știi când îți răspunde cineva?
        </div>
        <p style={{ margin: "6px 0 14px" }}>
          Îți trimitem o notificare când primești un mesaj. O oprești oricând
          din Setări.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            class="bbt-moale"
            onClick={() => {
              setInchisa(true);
              void props.laPornire();
            }}
            style={{
              height: "40px",
              padding: "0 18px",
              border: 0,
              "border-radius": "999px",
              background: "#0A0A0B",
              color: "#FFFFFF",
              cursor: "pointer",
              "font-family": "inherit",
              "font-size": "14px",
              "font-weight": 700,
            }}
          >
            Pornește
          </button>
          <button
            type="button"
            onClick={() => {
              amana();
              setInchisa(true);
            }}
            style={{
              height: "40px",
              padding: "0 14px",
              border: 0,
              "border-radius": "999px",
              background: "transparent",
              color: "#0A0A0B",
              cursor: "pointer",
              "font-family": "inherit",
              "font-size": "14px",
              "font-weight": 700,
            }}
          >
            Mai târziu
          </button>
        </div>
      </div>
    </Show>
  );
}
