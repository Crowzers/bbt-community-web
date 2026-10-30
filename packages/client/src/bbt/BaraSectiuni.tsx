import { For, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "./config";
import { tintaSite } from "./instalare";

/**
 * Bara de secțiuni a BBT Community — meniul principal, la fel oriunde ai fi (modelul TRW: Chat,
 * Courses, Friends…). Ia locul listei de servere a lor (`ServerList`): BBT Community e UN server
 * (design §2 decizia 12), deci o listă de servere n-avea ce lista. Pânza aprobată de user pe
 * 5 oct 2026: https://claude.ai/artifact/VF8eFPB2Xm7uznVkPX6t5F
 *
 * 🔥 **Rail-ul din 21 și 23** (30 oct 2026): aceleași intrări ca pastila de jos din aplicația de telefon —
 * Comunitate, Mesaje, Experiențe — plus Site jos. Albă, 104px, intrarea activă = pătrat negru rotunjit cu iconița și
 * numele albe. Până atunci: neagră, 72px, Chat / Mesaje / Site. „Experiențe" deschide contul (`/cont/experiente`).
 * ⛔ Fără Challenge — userul nu l-a vrut în meniu.
 *
 * Contul NU stă aici (era avatarul de jos): e în bara de sus, `BaraSus.tsx`.
 *
 * Două forme: verticală (desktop, stânga) și orizontală (telefon, jos — bara de tab-uri).
 */

type Sectiune = {
  nume: string;
  simbol: string;
  activ: () => boolean;
  /** Necitite, pe iconiță. */
  badge?: () => number;
  laApasare: () => void;
};

const NEGRU = "#0A0A0B";
const STINS = "#6C6C6D";
const ROZ = "#FFB3D9";
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
      activ: () => location.pathname.startsWith("/cont"),
      laApasare: () => navigate("/cont/experiente"),
    },
  ];

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
          background: activ ? NEGRU : "transparent",
          "text-decoration": "none",
          border: "0",
          font: "inherit",
          cursor: "pointer",
        };

  const continut = (s: {
    nume: string;
    simbol: string;
    badge?: () => number;
  }) => (
    <>
      <Symbol size={22}>{s.simbol}</Symbol>
      {/* 14, nu 11 ca în machetă: pragul casei pentru textul din interfață. */}
      <span style={{ "font-size": "14px", "font-weight": 700 }}>{s.nume}</span>
      <Show when={(s.badge?.() ?? 0) > 0}>
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "calc(50% + 6px)",
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
      <For each={sectiuni}>
        {(s) => (
          <button
            type="button"
            aria-current={s.activ() ? "page" : undefined}
            onClick={() => s.laApasare()}
            style={stilElement(s.activ())}
          >
            {continut(s)}
          </button>
        )}
      </For>
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
