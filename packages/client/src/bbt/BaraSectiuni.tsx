import { For, JSX, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

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
 * Măsurile sunt ale pastilei din aplicație (`mobil/src/ui/PastilaDeJos.tsx`): 60 de lățime, 7 de jur împrejur, butoane de 46,
 * iar la capăt avatarul cu inel roz. Rozul e un singur strat care curge spre intrarea nouă (`Alunecare.tsx`), cu arcul din
 * aplicație. Numele stă doar în `title`, la hover: fără etichete, ca să rămână o pastilă subțire.
 *
 * Până pe 31 oct: rail alb de 104 cu numele sub iconițe (21/23). Punctul roz a înlocuit cifra, ca în aplicație.
 * ⛔ Fără Challenge: userul nu l-a vrut în meniu.
 *
 * Experiențe și Profil sunt separate, ca în aplicație (cererea userului, 31 oct 2026). Până atunci, „Experiențe" deschidea tot
 * contul, deci lângă bilete stăteau setările de profil. Bara de sus (`BaraSus.tsx`) are doar două scurtături: Profil și Setări.
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
  width: "46px",
  height: "46px",
  "flex-shrink": 0,
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  padding: 0,
  border: 0,
  "border-radius": "23px",
  background: "transparent",
  cursor: "pointer",
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
    location.pathname.startsWith("/cont") &&
    !eInExperiente(location.pathname);

  const alunecare = useAlunecare(() =>
    profilActiv() ? sectiuni.length : sectiuni.findIndex((s) => s.activ()),
  );

  return (
    <div
      style={{
        width: "84px",
        "flex-shrink": 0,
        display: "flex",
        "justify-content": "center",
        "align-items": "flex-start",
      }}
    >
      <nav
        aria-label="Secțiuni"
        style={{
          position: "relative",
          display: "flex",
          "flex-direction": "column",
          gap: "4px",
          padding: "7px",
          "border-radius": "30px",
          background: "rgba(10,10,11,0.92)",
          "-webkit-backdrop-filter": "blur(20px) saturate(1.6)",
          "backdrop-filter": "blur(20px) saturate(1.6)",
          "box-shadow": "0 8px 18px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            "flex-direction": "column",
            gap: "4px",
          }}
        >
          <alunecare.Strat
            culoare={ROZ}
            raza="23px"
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
                  <s.Icon />
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
          {/* „Site": în browser același tab, în aplicația instalată se deschide în browser (`tintaSite`). */}
          <a
            href={BBT_SITE_URL}
            target={tintaSite()}
            rel="noopener"
            class="bbt-moale bbt-tab-pastila"
            title="Site"
            aria-label="Site"
            style={{ ...BUTON, color: ALB, "text-decoration": "none" }}
          >
            <Symbol size={22}>open_in_new</Symbol>
          </a>
          {/* Avatarul stă într-un buton de 46, ca tab-urile; 34 + 2 × 3 de inel = 40, ca în aplicație. */}
          <button
            ref={alunecare.rand(sectiuni.length)}
            type="button"
            class="bbt-moale"
            title="Profil"
            aria-label="Profil"
            aria-current={profilActiv() ? "page" : undefined}
            onClick={() => navigate("/cont")}
            style={BUTON}
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
        </div>
      </nav>
    </div>
  );
}
