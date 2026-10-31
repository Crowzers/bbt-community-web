import { For, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useAlunecare } from "./Alunecare";
import { BBT_SITE_URL } from "./config";
import { useExperiente } from "./cont/date";
import { eInExperiente } from "./cont/pagini";
import { tintaSite } from "./instalare";
import { AvatarOm } from "./telefon";

/**
 * Bara de secțiuni a BBT Community — meniul principal, la fel oriunde ai fi (modelul TRW: Chat,
 * Courses, Friends…). Ia locul listei de servere a lor (`ServerList`): BBT Community e UN server
 * (design §2 decizia 12), deci o listă de servere n-avea ce lista. Pânza aprobată de user pe
 * 5 oct 2026: https://claude.ai/artifact/VF8eFPB2Xm7uznVkPX6t5F
 *
 * 🔥 **Rail-ul din 21 și 23** (30 oct 2026): aceleași intrări ca pastila de jos din aplicația de telefon —
 * Comunitate, Mesaje, Experiențe, Profil — plus Site jos. Albă, 104px, intrarea activă = pătrat negru rotunjit cu iconița și
 * numele albe. Până atunci: neagră, 72px, Chat / Mesaje / Site.
 * ⛔ Fără Challenge — userul nu l-a vrut în meniu.
 *
 * Experiențe și Profil sunt separate, ca în aplicație (cererea userului, 31 oct 2026). Până atunci, „Experiențe" deschidea tot
 * contul, deci lângă bilete stăteau setările de profil. Bara de sus (`BaraSus.tsx`) are doar două scurtături: Profil și Setări.
 *
 * Două forme: verticală (desktop, stânga) și orizontală (telefon, jos — bara de tab-uri).
 */

type Sectiune = {
  nume: string;
  simbol: string;
  activ: () => boolean;
  /** Necitite, pe iconiță. */
  badge?: () => number;
  /** Avatarul tău în locul iconiței, ca în pastila din aplicație. */
  avatar?: boolean;
  laApasare: () => void;
};

const NEGRU = "#0A0A0B";
const STINS = "#6C6C6D";
const ROZ = "#FFA8CD";
const LINIE = "#E5E5E5";

export function BaraSectiuni(props: {
  orizontal?: boolean;
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
      simbol: "tag",
      activ: inServer,
      laApasare: () => {
        const s = serverBbt();
        if (s) navigate(`/server/${s.id}`);
      },
    },
    {
      nume: "Mesaje",
      simbol: "chat",
      // Mesajele directe și lista de prieteni trăiesc în afara serverului.
      activ: () =>
        !inServer() &&
        (location.pathname.startsWith("/friends") ||
          location.pathname.startsWith("/channel")),
      badge: () => props.necititeMesaje,
      // 23a: Mesaje deschide direct ultima conversație, cu lista lângă ea. Fără conversații, lista de prieteni
      // (în Community scrii doar prietenilor).
      laApasare: () => {
        const ultima = state.ordering.orderedConversations(client())[0];
        navigate(ultima ? `/channel/${ultima.id}` : "/friends");
      },
    },
    {
      nume: "Experiențe",
      simbol: "confirmation_number",
      activ: () => eInExperiente(location.pathname),
      // Câte au ceva de făcut acum (o plată sau o semnătură), cifra roz din 23b.
      badge: () =>
        (experiente.data?.active ?? []).filter((e) => e.plata).length,
      laApasare: () => navigate("/cont/experiente"),
    },
    {
      nume: "Profil",
      simbol: "person",
      avatar: true,
      activ: () =>
        location.pathname.startsWith("/cont") &&
        !eInExperiente(location.pathname),
      laApasare: () => navigate("/cont"),
    },
  ];

  const alunecare = useAlunecare(() => sectiuni.findIndex((s) => s.activ()));

  const stilElement = (activ: boolean) =>
    props.orizontal
      ? {
          position: "relative" as const,
          flex: 1,
          display: "flex",
          "flex-direction": "column" as const,
          "align-items": "center",
          "justify-content": "center",
          gap: "3px",
          color: activ ? NEGRU : STINS,
          "text-decoration": "none",
          background: "transparent",
          border: "0",
          font: "inherit",
          cursor: "pointer",
        }
      : {
          position: "relative" as const,
          width: "88px",
          padding: "10px 0",
          "border-radius": "20px",
          display: "flex",
          "flex-direction": "column" as const,
          "align-items": "center",
          gap: "5px",
          color: activ ? "#FFFFFF" : STINS,
          // Fundalul negru e stratul care alunecă (`Alunecare.tsx`), nu al butonului.
          background: "transparent",
          "z-index": 1,
          transition: "color 200ms ease",
          "text-decoration": "none",
          border: "0",
          font: "inherit",
          cursor: "pointer",
        };

  const continut = (s: {
    nume: string;
    simbol: string;
    badge?: () => number;
    avatar?: boolean;
  }) => (
    <>
      {/* Iconița într-o cutie fixă de 22: glifa singură aducea înălțimea rândului de text și urca. */}
      <span
        style={{
          width: "22px",
          height: "22px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        <Show when={s.avatar} fallback={<Symbol size={22}>{s.simbol}</Symbol>}>
          <AvatarOm om={client().user} marime={22} />
        </Show>
      </span>
      {/* Pe rail, proporțiile din 21/23 (cererea userului, 30 oct: „nu se vede frumos centrat în pătrat"): pătrat de
          88 × 61, iconița sus la 10, numele pe un rând de 14, cu aer pe laterale. Cu numele la 14px, „Comunitate"
          umplea pătratul până la margini. 12, nu 11 ca în machetă: sub 12 nu scriem nimic. */}
      <span
        style={
          props.orizontal
            ? { "font-size": "14px", "font-weight": 700 }
            : {
                "font-size": "12px",
                "line-height": "14px",
                "font-weight": 700,
                "letter-spacing": "-0.01em",
              }
        }
      >
        {s.nume}
      </span>
      <Show when={(s.badge?.() ?? 0) > 0}>
        <span
          style={{
            position: "absolute",
            top: props.orizontal ? "6px" : "8px",
            ...(props.orizontal
              ? { left: "calc(50% + 6px)" }
              : { right: "14px" }),
            "min-width": "18px",
            height: "18px",
            padding: "0 5px",
            "box-sizing": "border-box",
            "border-radius": "999px",
            // Roz cu cifră neagră, ca în 23 (până pe 30 oct, roșu).
            background: ROZ,
            color: NEGRU,
            "font-size": "12px",
            "font-weight": 700,
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
          }}
        >
          {s.badge!()}
        </span>
      </Show>
    </>
  );

  return (
    <nav
      aria-label="Secțiuni"
      style={
        props.orizontal
          ? {
              height: "60px",
              "flex-shrink": 0,
              display: "flex",
              "border-top": `1px solid ${LINIE}`,
              background: "#FFFFFF",
            }
          : {
              width: "104px",
              "flex-shrink": 0,
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              gap: "6px",
              padding: "12px 8px",
              "box-sizing": "border-box",
              "border-right": `1px solid ${LINIE}`,
              background: "#FFFFFF",
            }
      }
    >
      {/* Pe desktop, pătratul negru al intrării active alunecă spre cea nouă, ca pastila roz din aplicația de
          telefon (30 oct 2026). Pe telefon bara de jos n-are fundal pe activ, deci nici ce să alunece. */}
      <div
        style={
          props.orizontal
            ? { display: "contents" }
            : {
                position: "relative",
                display: "flex",
                "flex-direction": "column",
                gap: "6px",
              }
        }
      >
        <Show when={!props.orizontal}>
          <alunecare.Strat culoare={NEGRU} raza="20px" />
        </Show>
        <For each={sectiuni}>
          {(s, i) => (
            <button
              ref={alunecare.rand(i())}
              class="bbt-moale"
              type="button"
              aria-current={s.activ() ? "page" : undefined}
              onClick={() => s.laApasare()}
              style={stilElement(s.activ())}
            >
              {continut(s)}
            </button>
          )}
        </For>
      </div>
      <Show when={!props.orizontal}>
        <div style={{ "flex-grow": 1 }} />
      </Show>
      {/* „Site ↗": în browser același tab, în aplicația instalată se deschide în browser (`tintaSite`). */}
      <a
        href={BBT_SITE_URL}
        target={tintaSite()}
        rel="noopener"
        style={stilElement(false)}
      >
        {continut({ nume: "Site", simbol: "open_in_new" })}
      </a>
    </nav>
  );
}
