import { For, Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate, useParams } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "./config";

/**
 * Bara de secțiuni a BBT Community — meniul principal, la fel oriunde ai fi (modelul TRW: Chat,
 * Courses, Friends…). Ia locul listei de servere a lor (`ServerList`): BBT Community e UN server
 * (design §2 decizia 12), deci o listă de servere n-avea ce lista. Pânza aprobată de user pe
 * 5 oct 2026: https://claude.ai/artifact/VF8eFPB2Xm7uznVkPX6t5F
 *
 * ⚠️ Etapa 1 = doar secțiuni care merg din prima zi, fără butoane spre ecrane goale (decizia
 * userului): Chat, Mesaje, Site. Live (cu programul și înregistrările) vine odată cu webinarele;
 * Lecții abia când există destule înregistrări. ⛔ Fără Challenge — userul nu l-a vrut în meniu.
 *
 * Contul NU mai stă aici (era avatarul de jos): e în bara de sus, `BaraSus.tsx`.
 *
 * Două forme: verticală (desktop, stânga) și orizontală (telefon, jos — bara de tab-uri).
 */

type Sectiune = {
  nume: string;
  simbol: string;
  activ: () => boolean;
  /** Necitite, pe iconiță. */
  badge?: () => number;
  /** Navigare internă… */
  laApasare?: () => void;
  /** …sau pagină de pe site, în fila nouă. */
  link?: string;
};

export function BaraSectiuni(props: {
  orizontal?: boolean;
  /** Câte conversații directe au mesaje necitite. */
  necititeMesaje: number;
}) {
  const client = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ server?: string }>();

  const serverBbt = () => client().servers.toList()[0];
  const inServer = () => !!params.server;

  const sectiuni: Sectiune[] = [
    {
      nume: "Chat",
      simbol: "forum",
      activ: inServer,
      laApasare: () => {
        const s = serverBbt();
        if (s) navigate(`/server/${s.id}`);
      },
    },
    {
      nume: "Mesaje",
      simbol: "mail",
      // Mesajele directe și lista de prieteni trăiesc în afara serverului.
      activ: () =>
        !inServer() &&
        (location.pathname.startsWith("/friends") ||
          location.pathname.startsWith("/channel")),
      badge: () => props.necititeMesaje,
      laApasare: () => navigate("/friends"),
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
          color: activ ? "#fff" : "rgba(255,255,255,0.55)",
          "text-decoration": "none",
          background: "transparent",
          border: "0",
          font: "inherit",
          cursor: "pointer",
        }
      : {
          position: "relative" as const,
          width: "56px",
          padding: "7px 0 6px",
          "border-radius": "10px",
          display: "flex",
          "flex-direction": "column" as const,
          "align-items": "center",
          gap: "3px",
          color: activ ? "#fff" : "rgba(255,255,255,0.6)",
          background: activ ? "rgba(255,255,255,0.1)" : "transparent",
          "text-decoration": "none",
          border: "0",
          font: "inherit",
          cursor: "pointer",
        };

  const continut = (s: Sectiune) => (
    <>
      <Symbol size={props.orizontal ? 21 : 20}>{s.simbol}</Symbol>
      <span
        style={{
          "font-size": props.orizontal ? "10.5px" : "10px",
          "font-weight": 500,
        }}
      >
        {s.nume}
      </span>
      <Show when={(s.badge?.() ?? 0) > 0}>
        <span
          style={{
            position: "absolute",
            top: props.orizontal ? "6px" : "2px",
            ...(props.orizontal
              ? { left: "calc(50% + 6px)" }
              : { right: "6px" }),
            "min-width": "16px",
            height: "16px",
            padding: "0 4px",
            "box-sizing": "border-box",
            "border-radius": "8px",
            background: "#e5484d",
            color: "#fff",
            "font-size": "10px",
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
              "border-top": "1px solid rgba(255,255,255,0.08)",
              background: "#000",
            }
          : {
              width: "64px",
              "flex-shrink": 0,
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              gap: "4px",
              "padding-top": "10px",
              "border-right": "1px solid rgba(255,255,255,0.08)",
              background: "#000",
            }
      }
    >
      <For each={sectiuni}>
        {(s) =>
          s.link ? (
            <a
              href={s.link}
              target="_blank"
              rel="noopener"
              style={stilElement(false)}
            >
              {continut(s)}
            </a>
          ) : (
            <button
              type="button"
              aria-current={s.activ() ? "page" : undefined}
              onClick={s.laApasare}
              style={stilElement(s.activ())}
            >
              {continut(s)}
            </button>
          )
        }
      </For>
      <Show when={!props.orizontal}>
        <div style={{ "flex-grow": 1 }} />
      </Show>
      <a
        href={BBT_SITE_URL}
        style={{
          ...stilElement(false),
          ...(props.orizontal ? {} : { "margin-bottom": "10px" }),
        }}
      >
        <Symbol size={props.orizontal ? 21 : 20}>arrow_back</Symbol>
        <span
          style={{
            "font-size": props.orizontal ? "10.5px" : "10px",
            "font-weight": 500,
          }}
        >
          Site
        </span>
      </a>
    </nav>
  );
}
