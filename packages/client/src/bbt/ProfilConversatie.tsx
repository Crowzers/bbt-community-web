import { For, Show, createMemo } from "solid-js";

import { useQuery } from "@tanstack/solid-query";
import { Channel, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_ADMIN_URL } from "./config";

/**
 * BBT: profilul omului cu care vorbești, în dreapta conversației (23a, 30 oct 2026). Deschis din start pe desktop;
 * „Vezi profilul" din antet (`ChannelHeader.tsx`) îl ascunde și îl arată.
 *
 * Datele vin din adminul BBT, ca la cardul de profil (`MiniProfil.tsx`, aceeași cheie de cache): numele, rolul, bifa
 * de verificat, textul profilului. Avatarul și numele, din Stoat (sunt copia celor din BBT).
 *
 * Ce e altfel decât în 23a, dinadins:
 * - Fără „Împreună în" (taberele comune): adminul nu le dă pentru alt om, iar lista lui de tabere e a lui.
 * - „Fișiere trimise" = doar ce e deja încărcat din conversație (Stoat n-are o listă a fișierelor dintr-un canal).
 *   Derulezi mai sus în conversație, apar și cele mai vechi.
 */

type ProfilBBT = {
  nume: string;
  username: string;
  bio: string | null;
  mainRole: string | null;
  verificat: boolean;
  profilUrl: string;
};

/** Aceleași etichete ca pe site (`website/src/app/u/[username]/stil.ts`) și în `MiniProfil.tsx`. */
const ROLURI: Record<string, string> = {
  producer: "Producer",
  dj: "DJ",
  beatmaker: "Beatmaker",
  vocalist: "Vocalist",
  songwriter: "Songwriter",
  instrumentist: "Instrumentist",
  sound_engineer: "Sound Engineer",
  other: "Explorer",
};

const TEXT = "#0A0A0B";
const STINS = "#6C6C6D";

export function ProfilConversatie(props: { user: User; channel: Channel }) {
  const state = useState();
  const client = useClient();

  const profil = useQuery(() => ({
    queryKey: ["bbt-profil", props.user.id],
    retry: false,
    staleTime: 60_000,
    queryFn: async (): Promise<ProfilBBT | null> => {
      const r = await fetch(
        `${BBT_ADMIN_URL}/api/public/stoat/profil/${props.user.id}`,
        {
          headers: { "X-Session-Token": state.auth.getSession()?.token ?? "" },
        },
      );
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
  }));

  const fisiere = createMemo(() =>
    client()
      .messages.filter(
        (m) => m.channelId === props.channel.id && !!m.attachments?.length,
      )
      .sort((a, b) => b.id.localeCompare(a.id))
      .flatMap((m) => m.attachments ?? [])
      .slice(0, 8),
  );

  const online = () => props.user.online && props.user.presence !== "Invisible";

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        gap: "12px",
        padding: "28px 20px",
        color: TEXT,
        "font-family": "Inter, sans-serif",
      }}
    >
      <Avatar
        size={96}
        src={props.user.animatedAvatarURL}
        fallback={props.user.displayName}
        fallbackBackground
      />
      <div style={{ "text-align": "center" }}>
        <p
          style={{
            margin: 0,
            "font-family": '"De Fonte BBT", Inter, sans-serif',
            "font-size": "26px",
            "letter-spacing": "0.01em",
            "font-synthesis": "none",
            "line-height": "1.1",
          }}
        >
          {props.user.displayName}
        </p>
        <p style={{ margin: "4px 0 0", color: STINS, "font-size": "14px" }}>
          {[
            profil.data?.mainRole
              ? (ROLURI[profil.data.mainRole] ?? profil.data.mainRole)
              : null,
            online() ? "online" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Show when={profil.data?.verificat}>
        <span
          style={{
            padding: "4px 10px",
            "border-radius": "999px",
            background: "#99E9C4",
            "font-size": "14px",
            "font-weight": 700,
          }}
        >
          ✓ Verificat
        </span>
      </Show>
      <Show when={profil.data?.bio}>
        <p
          style={{
            margin: 0,
            "text-align": "center",
            "font-size": "14px",
            "line-height": "1.5",
            color: TEXT,
            "white-space": "pre-line",
          }}
        >
          {profil.data!.bio}
        </p>
      </Show>
      <Show when={profil.data?.profilUrl}>
        <a
          href={profil.data!.profilUrl}
          target="_blank"
          rel="noopener"
          style={{
            display: "inline-flex",
            "align-items": "center",
            height: "38px",
            padding: "0 16px",
            "border-radius": "999px",
            background: "#F2F2F3",
            color: TEXT,
            "font-size": "14px",
            "font-weight": 700,
            "text-decoration": "none",
          }}
        >
          Profilul pe site ↗
        </a>
      </Show>

      <Show when={fisiere().length}>
        <div style={{ width: "100%", "margin-top": "12px" }}>
          <p
            style={{
              margin: "0 0 8px",
              "text-align": "center",
              color: STINS,
              "font-size": "12px",
              "font-weight": 700,
              "letter-spacing": "0.06em",
              "text-transform": "uppercase",
            }}
          >
            Fișiere trimise
          </p>
          <div
            style={{
              "border-radius": "20px",
              background: "#F2F2F3",
              padding: "4px 14px",
            }}
          >
            <For each={fisiere()}>
              {(f, i) => (
                <a
                  href={f.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "10px",
                    padding: "10px 0",
                    "border-top": i() === 0 ? "0" : "1px solid #E5E5E5",
                    color: TEXT,
                    "text-decoration": "none",
                    "font-size": "14px",
                  }}
                >
                  <span
                    style={{
                      "flex-grow": 1,
                      "min-width": 0,
                      overflow: "hidden",
                      "text-overflow": "ellipsis",
                      "white-space": "nowrap",
                      "font-weight": 600,
                    }}
                  >
                    {f.filename ?? "Fișier"}
                  </span>
                  <span style={{ color: STINS, "flex-shrink": 0 }}>
                    {f.humanReadableSize}
                  </span>
                  <Symbol size={18}>download</Symbol>
                </a>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
