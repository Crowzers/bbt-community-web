import { For, JSX, Show, onCleanup, onMount } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useAlunecare } from "./Alunecare";
import { BBT_SITE_URL } from "./config";
import { useCont, useExperiente } from "./cont/date";
import { eInExperiente } from "./cont/pagini";
import { tintaSite } from "./instalare";
import { latimeRail, railDeschis, tastaRail } from "./rail";
import { AvatarOm, IconBalon, IconBilet, IconDiez, UN_RAND } from "./telefon";

/**
 * BBT: meniul principal pe desktop și tabletă: pastila neagră din aplicație, ridicată pe verticală (cererea userului, 31 oct 2026).
 * Ia locul listei de servere a lor (`ServerList`): BBT Community e UN server (design §2 decizia 12), deci o listă de servere
 * n-avea ce lista. Pe telefon, `PastilaDeJos.tsx`.
 *
 * Copie după 25e și 25f (cererea userului, 1 nov 2026), care înlocuiesc cele două pastile de mai devreme: o singură pastilă, pe
 * toată înălțimea foii, cu secțiunile sus, iar avatarul și site-ul jos. Închisă: 52 de lățime, 8 sus și jos, butoane de 36 la 10
 * unul de altul. Deschisă (`rail.ts`): 200, 10 de jur împrejur, rânduri de 48 la 4 unul de altul, cu numele lângă iconiță.
 * Rozul e un singur strat care curge spre intrarea nouă (`Alunecare.tsx`), cu arcul din aplicație; în Profil dispare, iar
 * avatarul primește inelul.
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
/** Cercul de sub iconița activă, în pastila deschisă (25f). */
const ROZ_TARE = "#FF8EC6";
const ALB = "#FFFFFF";
const ALB_STINS = "rgba(255,255,255,0.8)";
/** Arcul tab-ului din aplicație: 300 ms, o optime la 100 BPM. */
const ARC = "300ms cubic-bezier(.34,1.56,.64,1)";

const TEXT_RAND: JSX.CSSProperties = {
  ...UN_RAND,
  "font-size": "14px",
  "font-weight": 700,
};

const rand = (inaltime = "48px"): JSX.CSSProperties =>
  railDeschis()
    ? {
        position: "relative",
        "z-index": 1,
        width: "100%",
        height: inaltime,
        "flex-shrink": 0,
        "box-sizing": "border-box",
        display: "flex",
        "align-items": "center",
        gap: "12px",
        padding: "0 10px",
        border: 0,
        "border-radius": "999px",
        background: "transparent",
        cursor: "pointer",
        "font-family": "inherit",
        "text-align": "left",
      }
    : {
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
  const cont = useCont();

  onMount(() => document.addEventListener("keydown", tastaRail));
  onCleanup(() => document.removeEventListener("keydown", tastaRail));

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

  const pasi = () => (railDeschis() ? "4px" : "10px");

  return (
    <nav
      aria-label="Secțiuni"
      style={{
        width: latimeRail(),
        "flex-shrink": 0,
        "box-sizing": "border-box",
        display: "flex",
        "flex-direction": "column",
        "align-items": railDeschis() ? "stretch" : "center",
        gap: pasi(),
        padding: railDeschis() ? "10px" : "8px 0",
        overflow: "hidden",
        "border-radius": railDeschis() ? "28px" : "26px",
        background: NEGRU,
        transition: "width 200ms ease-out",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          "flex-direction": "column",
          gap: pasi(),
        }}
      >
        <alunecare.Strat
          culoare={ROZ}
          raza="24px"
          tranzitie={`transform ${ARC}, height ${ARC}`}
        />
        <For each={sectiuni}>
          {(s, i) => (
            <button
              ref={alunecare.rand(i())}
              type="button"
              class={s.activ() ? "bbt-moale" : "bbt-moale bbt-tab-pastila"}
              title={railDeschis() ? undefined : s.nume}
              aria-label={s.nume}
              aria-current={s.activ() ? "page" : undefined}
              onClick={() => s.laApasare()}
              style={{
                ...rand(),
                color: s.activ() ? NEGRU : railDeschis() ? ALB_STINS : ALB,
                transition:
                  "color 220ms ease-in-out, background-color 160ms ease-out, transform 160ms ease-out",
              }}
            >
              <span
                style={{
                  position: "relative",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "flex-shrink": 0,
                  ...(railDeschis()
                    ? {
                        width: "32px",
                        height: "32px",
                        "border-radius": "50%",
                        background: s.activ() ? ROZ_TARE : "transparent",
                      }
                    : {}),
                }}
              >
                <s.Icon size={20} />
                <Show when={s.punct() && !s.activ()}>
                  <span
                    style={{
                      position: "absolute",
                      top: railDeschis() ? "4px" : "-2px",
                      right: railDeschis() ? "2px" : "-4px",
                      width: "9px",
                      height: "9px",
                      "border-radius": "50%",
                      background: ROZ,
                    }}
                  />
                </Show>
              </span>
              <Show when={railDeschis()}>
                <span style={TEXT_RAND}>{s.nume}</span>
              </Show>
            </button>
          )}
        </For>
      </div>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        class="bbt-moale"
        title={railDeschis() ? undefined : "Profil"}
        aria-label="Profil"
        aria-current={profilActiv() ? "page" : undefined}
        onClick={() => navigate("/cont")}
        style={{ ...rand("56px"), color: ALB }}
      >
        {/* Inelul doar în Profil: cu rozul plecat de sus, altfel n-ai vedea unde ești. */}
        <span
          style={{
            display: "flex",
            "flex-shrink": 0,
            "border-radius": "50%",
            outline: profilActiv() ? `2px solid ${ROZ}` : "none",
            "outline-offset": "1px",
          }}
        >
          <AvatarOm om={client().user} marime={railDeschis() ? 32 : 36} />
        </span>
        <Show when={railDeschis()}>
          <span style={{ "min-width": 0, "line-height": 1.1 }}>
            <span
              style={{
                ...UN_RAND,
                display: "block",
                "font-size": "13px",
                "font-weight": 800,
              }}
            >
              {cont.data?.numeAfisat ?? client().user?.displayName}
            </span>
            {/* Aceeași regulă ca în `ProfilDesktop.tsx`: telefonul confirmat face „Artist verificat". */}
            <Show when={cont.data?.phoneVerified}>
              <span
                style={{
                  display: "block",
                  "margin-top": "2px",
                  "font-size": "12px",
                  "font-weight": 700,
                  color: ROZ,
                }}
              >
                Artist verificat
              </span>
            </Show>
          </span>
        </Show>
      </button>
      {/* „Site" (cererea userului, 31 oct 2026): nu e o secțiune, duce afară. În browser același tab, în aplicația instalată
          se deschide în browser (`tintaSite`). */}
      <a
        href={BBT_SITE_URL}
        target={tintaSite()}
        rel="noopener"
        class="bbt-moale bbt-tab-pastila"
        title={railDeschis() ? undefined : "Site"}
        aria-label="Mergi pe site"
        style={{
          ...rand(),
          color: railDeschis() ? ALB_STINS : "rgba(255,255,255,0.7)",
          "text-decoration": "none",
        }}
      >
        <span
          style={{
            display: "flex",
            "flex-shrink": 0,
            "align-items": "center",
            "justify-content": "center",
            ...(railDeschis() ? { width: "32px", height: "32px" } : {}),
          }}
        >
          <Symbol size={16}>open_in_new</Symbol>
        </span>
        <Show when={railDeschis()}>
          <span style={TEXT_RAND}>Mergi pe site</span>
        </Show>
      </a>
    </nav>
  );
}
