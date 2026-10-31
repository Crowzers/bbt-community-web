import { JSX, Show, createSignal } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";
import { comutaSunetele, sunetePornite } from "../sunete";
import { UN_RAND } from "../telefon";

import { useNotificari, useRapoarte } from "./date";
import { Buton, C, Fereastra } from "./ui";

/**
 * BBT: Setări pe telefon, în spatele rotiței din Profil (varianta B, cererea userului, 31 oct 2026), ca
 * `mobil/src/app/setari.tsx`. Pe desktop și tabletă aceleași rânduri stau în meniul din stânga (`ContulMeu.tsx`).
 *
 * Față de aplicație are și grupul Community: setările clientului există doar aici, iar meniul de la avatar nu le mai ține.
 */
export function SetariTelefon() {
  const navigate = useNavigate();
  const { openModal } = useModals();
  const notificari = useNotificari();
  const rapoarte = useRapoarte();
  const { logout } = useClientLifecycle();
  const [iesire, setIesire] = createSignal(false);

  const deschideCommunity = (page: string) =>
    openModal({ type: "settings", config: "user", context: { page } });

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
      <div style={GRUP}>
        <Rand
          text="Editează profilul"
          detaliu="Date, adresă, facturare"
          laApasare={() => navigate("/cont/profil")}
        />
        <Rand
          text="Plăți și facturi"
          laApasare={() => navigate("/cont/plati")}
        />
        <Rand
          text="Notificări"
          detaliu={
            notificari.data?.necitite
              ? String(notificari.data.necitite)
              : undefined
          }
          laApasare={() => navigate("/cont/notificari")}
        />
        <Rand
          text="Sunete"
          detaliu={sunetePornite() ? "Pornite" : "Oprite"}
          laApasare={comutaSunetele}
          ultim
        />
      </div>

      <div style={GRUP}>
        <Rand
          text="Profilul în Community"
          laApasare={() => deschideCommunity("profile")}
        />
        <Rand
          text="Setări Community"
          laApasare={() => deschideCommunity("notifications")}
          ultim
        />
      </div>

      {/* Doar pentru cine are voie la rapoarte, ca „Administrare Community" din aplicație. */}
      <Show when={rapoarte.data}>
        {(lista) => (
          <div style={GRUP}>
            <Rand
              text="Rapoarte"
              detaliu={lista().length ? String(lista().length) : undefined}
              laApasare={() => navigate("/cont/rapoarte")}
              ultim
            />
          </div>
        )}
      </Show>

      <div style={GRUP}>
        <Rand
          text="Ajutor și contact BBT"
          laApasare={() =>
            (window.location.href = "mailto:contact@beanbagtheory.ro")
          }
        />
        <Rand
          text="Termeni și confidențialitate"
          laApasare={() => window.open(`${BBT_SITE_URL}/termeni`, "_blank")}
          ultim
        />
      </div>

      <button
        type="button"
        onClick={() => setIesire(true)}
        style={{
          "align-self": "center",
          padding: "14px",
          border: 0,
          background: "transparent",
          color: C.rosu,
          "font-family": "inherit",
          "font-size": "15px",
          "font-weight": 800,
          cursor: "pointer",
        }}
      >
        Ieși din cont
      </button>

      <Show when={iesire()}>
        <Fereastra
          titlu="Ieși din cont?"
          laInchidere={() => setIesire(false)}
          latime={400}
        >
          <p
            style={{
              margin: "0 0 18px",
              color: C.stins,
              "font-size": "16px",
              "line-height": "1.45",
            }}
          >
            Te poți întoarce oricând cu emailul și parola de pe site.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <Buton piele="alb" lat onClick={() => setIesire(false)}>
              Rămân
            </Buton>
            <Buton lat onClick={() => logout()}>
              Ieși
            </Buton>
          </div>
        </Fereastra>
      </Show>
    </div>
  );
}

const GRUP: JSX.CSSProperties = {
  overflow: "hidden",
  "border-radius": "28px",
  background: C.foaie,
};

function Rand(props: {
  text: string;
  detaliu?: string;
  laApasare: () => void;
  ultim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        width: "100%",
        padding: "15px 16px",
        "box-sizing": "border-box",
        border: 0,
        "border-bottom": props.ultim ? 0 : `0.5px solid ${C.linie}`,
        background: "transparent",
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          flex: 1,
          "font-size": "15px",
          "font-weight": 600,
        }}
      >
        {props.text}
      </span>
      <Show when={props.detaliu}>
        <span
          style={{
            ...UN_RAND,
            "max-width": "50%",
            color: C.slab,
            "font-size": "13px",
          }}
        >
          {props.detaliu}
        </span>
      </Show>
      <span style={{ display: "flex", color: C.slab }}>
        <Symbol size={16}>chevron_right</Symbol>
      </span>
    </button>
  );
}
