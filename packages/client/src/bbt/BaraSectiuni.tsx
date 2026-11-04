import { JSX, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "./config";
import { tintaSite } from "./instalare";
import { LATIME_RAIL } from "./rail";
import { IconBalon, IconDiez } from "./telefon";
import { S1 } from "./tema";

/**
 * BBT: bara din stânga pe desktop și tabletă (S1, 4 nov 2026, `website/docs/plans/2026-11-04-community-ca-slack-discord-studiu.md`
 * deciziile 1 și 12): plăci de 40 pe cerneală, ca la Discord și The Real World. Sus Comunitatea, mereu; dedesubt Mesajele; sub
 * linie, în faza 2, câte un spațiu pentru fiecare experiență la care omul e înscris (o tabără, un curs), arhivat o dată pe an și
 * rămas de citit. Fără „+": spațiul vine cu înscrierea.
 *
 * Ia locul listei de servere a lor (`ServerList`). Pe telefon aceeași bară, cu plăci de 44, direct pe ramă (decizia 11).
 *
 * Până pe 4 nov: pastila neagră din 25e/25f, cu Comunitate, Mesaje, Experiențe și avatarul. Experiențele au trecut în butonul din
 * capul listei, iar contul în cardul de la baza ei (`CardCont.tsx`), ca pe desktopul Discord.
 */

const ROZ = "#FFA8CD";
const NEGRU = "#0A0A0B";

function Placa(props: {
  nume: string;
  activ: boolean;
  /** 40 pe desktop, 44 pe telefon (ținta minimă de deget). */
  marime: number;
  /** Câte lucruri necitite; 0 = fără cifră. */
  cifra?: number;
  laApasare: () => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      class={props.activ ? "bbt-moale" : "bbt-moale bbt-tab-pastila"}
      title={props.nume}
      aria-label={props.nume}
      aria-current={props.activ ? "page" : undefined}
      onClick={() => props.laApasare()}
      style={{
        position: "relative",
        width: `${props.marime}px`,
        height: `${props.marime}px`,
        "flex-shrink": 0,
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        padding: 0,
        border: 0,
        "border-radius": "12px",
        background: props.activ ? ROZ : S1.placa,
        color: props.activ ? NEGRU : "#FFFFFF",
        cursor: "pointer",
        transition: "background-color 160ms ease-out",
      }}
    >
      {/* Liniuța albă de lângă placa deschisă, ca la Discord: se vede și când placa e roz. */}
      <Show when={props.activ}>
        <span
          style={{
            position: "absolute",
            // Lipită de marginea barei de 64, oricât de mare e placa.
            left: `${-(64 - props.marime) / 2}px`,
            top: `${(props.marime - 24) / 2}px`,
            width: "4px",
            height: "24px",
            "border-radius": "0 4px 4px 0",
            background: "#FFFFFF",
          }}
        />
      </Show>
      {props.children}
      <Show when={(props.cifra ?? 0) > 0}>
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-7px",
            "min-width": "20px",
            height: "20px",
            padding: "0 5px",
            "box-sizing": "border-box",
            "border-radius": "999px",
            border: `2px solid ${props.marime > 40 ? S1.rama : S1.lista}`,
            background: ROZ,
            color: NEGRU,
            "font-size": "11px",
            "font-weight": 700,
            "line-height": "16px",
            "text-align": "center",
          }}
        >
          {props.cifra! > 99 ? "99+" : props.cifra}
        </span>
      </Show>
    </button>
  );
}

export function BaraSectiuni(props: {
  /** Câte conversații directe au mesaje necitite. */
  necititeMesaje: number;
}) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ server?: string }>();
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const marime = () => (telefon() ? 44 : 40);

  const serverBbt = () => client().servers.toList()[0];
  const inServer = () => !!params.server;
  // Mesajele directe și lista de prieteni trăiesc în afara serverului.
  const inMesaje = () =>
    !inServer() &&
    (location.pathname.startsWith("/friends") ||
      location.pathname.startsWith("/channel"));

  return (
    <nav
      aria-label="Secțiuni"
      style={{
        width: LATIME_RAIL,
        "flex-shrink": 0,
        "box-sizing": "border-box",
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        gap: "12px",
        // Pe telefon bara stă direct pe ramă, fără panou, ca în schiță: lățimea e prețioasă pe 375.
        padding: telefon() ? "4px 0" : "12px 0",
        overflow: "hidden",
        "border-radius": "12px",
        background: telefon() ? "transparent" : S1.lista,
      }}
    >
      <Placa
        nume="Comunitate"
        marime={marime()}
        activ={inServer()}
        laApasare={() => {
          const s = serverBbt();
          if (s) navigate(`/server/${s.id}`);
        }}
      >
        <IconDiez size={20} />
      </Placa>
      <Placa
        nume="Mesaje"
        marime={marime()}
        activ={inMesaje()}
        cifra={props.necititeMesaje}
        // 23a: Mesaje deschide direct ultima conversație, cu lista lângă ea. Fără conversații, lista de prieteni (în Community
        // scrii doar prietenilor). Pe telefon doar lista: conversația o alegi tu, ca în orice aplicație de mesaje.
        laApasare={() => {
          const ultima = state.ordering.orderedConversations(client())[0];
          navigate(ultima && !telefon() ? `/channel/${ultima.id}` : "/friends");
        }}
      >
        <IconBalon size={20} />
      </Placa>

      <div style={{ flex: 1 }} />

      {/* „Site" (cererea userului, 31 oct 2026): nu e o secțiune, duce afară. În browser același tab, în aplicația instalată se
          deschide în browser (`tintaSite`). */}
      <a
        href={BBT_SITE_URL}
        target={tintaSite()}
        rel="noopener"
        class="bbt-moale bbt-tab-pastila"
        title="Mergi pe site"
        aria-label="Mergi pe site"
        style={{
          width: `${marime()}px`,
          height: `${marime()}px`,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "12px",
          color: S1.stins,
          "text-decoration": "none",
        }}
      >
        <Symbol size={18}>open_in_new</Symbol>
      </a>
    </nav>
  );
}
