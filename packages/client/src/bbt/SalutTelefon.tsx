import { Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useNotificari, useSalut } from "./cont/date";
import { tineMinteLista } from "./intoarcere";
import { textMembri, useNumarMembri } from "./numarMembri";
import { UN_RAND } from "./telefon";
import { S1 } from "./tema";

/**
 * BBT: capul listei de canale pe telefon (S1, 4 nov 2026, schița „HubCampusTelTRW", decizia 11): „Hei, {nume}!" cu rândul de
 * membri și clopoțelul, pe cerneală. Pe desktop salutul stă în bara de sus (`BaraSus`), care pe telefon nu există.
 *
 * Până pe 4 nov: antetul roz cu beanbag (`AntetPagina`) și salutul în De Fonte 32, ca în aplicație. Clopoțelul duce, ca atunci,
 * la notificările contului; lista de mențiuni a clopoțelului de pe desktop n-are loc pe un ecran de 375.
 */
export function SalutTelefon() {
  const client = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const salut = useSalut();
  const notificari = useNotificari();
  const numar = useNumarMembri(() => client().servers.toList()[0]);
  const necitite = () => notificari.data?.necitite ?? 0;

  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        "flex-shrink": 0,
        padding: "14px 12px 6px 16px",
      }}
    >
      <div style={{ flex: 1, "min-width": 0 }}>
        <h1
          style={{
            ...UN_RAND,
            margin: 0,
            "font-family": "Inter, system-ui, sans-serif",
            "font-size": "20px",
            "line-height": "26px",
            "font-weight": 700,
            "letter-spacing": 0,
            color: "#FFFFFF",
          }}
        >
          {salut() ? `Hei, ${salut()}!` : "Hei!"}
        </h1>
        <Show when={numar().total > 0}>
          <div
            style={{
              ...UN_RAND,
              "font-size": "14px",
              "line-height": "20px",
              "font-weight": 500,
              color: S1.stins,
            }}
          >
            {textMembri(numar())}
          </div>
        </Show>
      </div>
      <button
        type="button"
        class="bbt-moale"
        aria-label={
          necitite() > 0 ? `Notificări, ${necitite()} necitite` : "Notificări"
        }
        onClick={() => {
          tineMinteLista(location.pathname);
          navigate("/cont/notificari");
        }}
        style={{
          position: "relative",
          width: "44px",
          height: "44px",
          "flex-shrink": 0,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: 0,
          border: 0,
          "border-radius": "50%",
          background: S1.placa,
          color: "#FFFFFF",
          cursor: "pointer",
          "-webkit-tap-highlight-color": "transparent",
        }}
      >
        <Symbol size={20}>notifications</Symbol>
        <Show when={necitite() > 0}>
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-4px",
              "min-width": "20px",
              height: "20px",
              padding: "0 5px",
              "box-sizing": "border-box",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "999px",
              border: `2px solid ${S1.lista}`,
              background: "#FFA8CD",
              color: "#0A0A0B",
              "font-size": "11px",
              "font-weight": 700,
            }}
          >
            {necitite() > 99 ? "99+" : necitite()}
          </span>
        </Show>
      </button>
    </div>
  );
}
