import { For, JSX, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";
import { useAlunecare } from "./Alunecare";
import { BBT_SITE_URL } from "./config";
import { useExperiente } from "./cont/date";
import { eInExperiente } from "./cont/pagini";
import { tintaSite } from "./instalare";
import { AvatarOm, IconBalon, IconBilet, IconDiez } from "./telefon";

/**
 * BBT: meniul principal pe desktop și tabletă: pastila neagră din aplicație, ridicată pe verticală, doar cu iconițe (cererea
 * userului, 31 oct 2026, demo-ul „A cu pastila scurtă"). Ia locul listei de servere a lor (`ServerList`): BBT Community e UN
 * server (design §2 decizia 12), deci o listă de servere n-avea ce lista. Pe telefon, `PastilaDeJos.tsx`.
 *
 * Două pastile (cererea userului, 1 nov 2026: colțul din stânga sus era încărcat): sus logoul și secțiunile, urcate în bandă cu
 * marginea negativă a coloanei; jos ce ține de tine și ce duce afară, avatarul și site-ul.
 *
 * Măsurile sunt din 25d (cererea userului, 31 oct 2026): 52 de lățime, 8 de jur împrejur, butoane de 36 la 8 unul de altul, ca
 * spațiile dintr-o pastilă să fie egale (1 nov 2026). Rozul e un singur strat care curge spre intrarea nouă (`Alunecare.tsx`), cu
 * arcul din aplicație; în Profil dispare de sus, iar sub avatar inelul se îngroașă. Numele stă doar în `title`, la hover: fără
 * etichete, ca să rămână o pastilă subțire.
 *
 * Până pe 31 oct: rail alb de 104 cu numele sub iconițe (21/23). Punctul roz a înlocuit cifra, ca în aplicație.
 * ⛔ Fără Challenge: userul nu l-a vrut în meniu.
 *
 * Experiențe și Profil sunt separate, ca în aplicație (cererea userului, 31 oct 2026). Până atunci, „Experiențe" deschidea tot
 * contul, deci lângă bilete stăteau setările de profil.
 */

type Sectiune = {
  nume: string;
  Icon: (p: { size?: number; color?: string }) => JSX.Element;
  activ: () => boolean;
  punct: () => boolean;
  laApasare: () => void;
};

const NEGRU = "#0A0A0B";
const ROZ = "#FFA8CD";
const ALB = "#FFFFFF";
/** Arcul tab-ului din aplicație: 300 ms, o optime la 100 BPM. */
const ARC = "300ms cubic-bezier(.34,1.56,.64,1)";

const BUTON: JSX.CSSProperties = {
  position: "relative",
  "z-index": 1,
  width: "36px",
  height: "36px",
  "flex-shrink": 0,
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  padding: 0,
  border: 0,
  "border-radius": "18px",
  background: "transparent",
  cursor: "pointer",
};

const PASTILA: JSX.CSSProperties = {
  position: "relative",
  display: "flex",
  "flex-direction": "column",
  gap: "8px",
  padding: "8px",
  "border-radius": "26px",
  background: NEGRU,
  // Pastila de sus stă în bandă, care mută fereastra: fără asta, Windows nu mai trimite clicuri.
  "-webkit-app-region": "no-drag",
};

export function BaraSectiuni(props: {
  /** Câte conversații directe au mesaje necitite. */
  necititeMesaje: number;
}) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ server?: string }>();
  const experiente = useExperiente();

  const serverBbt = () => client().servers.toList()[0];
  const inServer = () => !!params.server;

  const sectiuni: Sectiune[] = [
    {
      nume: "Comunitate",
      Icon: IconDiez,
      activ: inServer,
      punct: () => false,
      laApasare: () => {
        const s = serverBbt();
        if (s) navigate(`/server/${s.id}`);
      },
    },
    {
      nume: "Mesaje",
      Icon: IconBalon,
      // Mesajele directe și lista de prieteni trăiesc în afara serverului.
      activ: () =>
        !inServer() &&
        (location.pathname.startsWith("/friends") ||
          location.pathname.startsWith("/channel")),
      punct: () => props.necititeMesaje > 0,
      // 23a: Mesaje deschide direct ultima conversație, cu lista lângă ea. Fără conversații, lista de prieteni
      // (în Community scrii doar prietenilor).
      laApasare: () => {
        const ultima = state.ordering.orderedConversations(client())[0];
        navigate(ultima ? `/channel/${ultima.id}` : "/friends");
      },
    },
    {
      nume: "Experiențe",
      Icon: IconBilet,
      activ: () => eInExperiente(location.pathname),
      // Ceva de făcut acum: o plată sau o semnătură.
      punct: () => !!experiente.data?.active.some((e) => e.plata),
      laApasare: () => navigate("/cont/experiente"),
    },
  ];
  const profilActiv = () =>
    location.pathname.startsWith("/cont") && !eInExperiente(location.pathname);

  const alunecare = useAlunecare(() => sectiuni.findIndex((s) => s.activ()));

  return (
    <div
      style={{
        width: "52px",
        "flex-shrink": 0,
        display: "flex",
        "flex-direction": "column",
        "justify-content": "space-between",
        "align-items": "center",
        // Urcă peste bandă (`z-index` 20 în `BaraSus.tsx`), până la `--bbt-sus-pastila` de marginea ferestrei.
        position: "relative",
        "z-index": 21,
        "margin-top": "calc(var(--bbt-sus-pastila) - var(--bbt-banda))",
      }}
    >
      <nav aria-label="Secțiuni" style={PASTILA}>
        {/* BBT: sigla duce mereu în chat, ca secțiunea Comunitate (cererea userului, 20 oct 2026: „e mai natural așa"). Fără
            cerc și fără hover, iar linia de sub ea o desparte de meniu: stând între iconițe, părea o intrare în plus (1 nov 2026). */}
        <button
          type="button"
          title="BBT"
          aria-label="BBT, înapoi în chat"
          onClick={() => {
            const s = serverBbt();
            if (s) navigate(`/server/${s.id}`);
          }}
          style={{
            display: "flex",
            "align-items": "center",
            height: "30px",
            padding: 0,
            border: 0,
            background: "transparent",
            color: ALB,
            cursor: "pointer",
          }}
        >
          <Wordmark
            aria-label="BBT"
            style={{ width: "36px", height: "auto" }}
          />
        </button>
        <div
          aria-hidden="true"
          style={{
            width: "20px",
            height: "1px",
            "align-self": "center",
            background: "rgba(255, 255, 255, 0.28)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            "flex-direction": "column",
            gap: "8px",
          }}
        >
          <alunecare.Strat
            culoare={ROZ}
            raza="18px"
            tranzitie={`transform ${ARC}, height ${ARC}`}
          />
          <For each={sectiuni}>
            {(s, i) => (
              <button
                ref={alunecare.rand(i())}
                type="button"
                class={s.activ() ? "bbt-moale" : "bbt-moale bbt-tab-pastila"}
                title={s.nume}
                aria-label={s.nume}
                aria-current={s.activ() ? "page" : undefined}
                onClick={() => s.laApasare()}
                style={{
                  ...BUTON,
                  color: s.activ() ? NEGRU : ALB,
                  transition:
                    "color 220ms ease-in-out, background-color 160ms ease-out, transform 160ms ease-out",
                }}
              >
                <span style={{ position: "relative", display: "flex" }}>
                  <s.Icon size={20} />
                  <Show when={s.punct() && !s.activ()}>
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
              </button>
            )}
          </For>
        </div>
      </nav>
      <div style={PASTILA}>
        {/* Avatarul stă într-un buton de 36, ca tab-urile: 28 + 2 × 2 de inel, iar cei 2 rămași se fac roz în Profil. */}
        <button
          type="button"
          class="bbt-moale"
          title="Profil"
          aria-label="Profil"
          aria-current={profilActiv() ? "page" : undefined}
          onClick={() => navigate("/cont")}
          style={{
            ...BUTON,
            background: profilActiv() ? ROZ : "transparent",
            transition:
              "background-color 220ms ease-in-out, transform 160ms ease-out",
          }}
        >
          <span
            style={{
              display: "flex",
              "border-radius": "16px",
              border: `2px solid ${ROZ}`,
            }}
          >
            <AvatarOm om={client().user} marime={28} />
          </span>
        </button>
        {/* „Site" (cererea userului, 31 oct 2026): nu e o secțiune, duce afară. În browser același tab, în aplicația instalată
            se deschide în browser (`tintaSite`). */}
        <a
          href={BBT_SITE_URL}
          target={tintaSite()}
          rel="noopener"
          class="bbt-moale bbt-tab-pastila"
          title="Site"
          aria-label="Site"
          style={{ ...BUTON, color: ALB, "text-decoration": "none" }}
        >
          <Symbol size={20}>open_in_new</Symbol>
        </a>
      </div>
    </div>
  );
}
