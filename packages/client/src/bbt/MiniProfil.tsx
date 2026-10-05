import { useQuery } from "@tanstack/solid-query";
import { For, JSX, Match, Show, Switch } from "solid-js";
import type { ServerMember, User } from "stoat.js";

import { UserContextMenu } from "@revolt/app/menus/UserContextMenu";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar, IconButton } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_ADMIN_URL } from "./config";

/**
 * Cardul de profil BBT — ce apare la click pe un om (popover pe desktop, foaie pe telefon).
 *
 * Cererea userului (5 oct 2026): „să arate cum ne arăta pe Community-ul vechi, înainte de Stoat —
 * mini profile". Modelul e `website/src/app/community/MiniProfil.tsx`: copertă, avatar pe copertă,
 * nume + bifa de verificat, @username, bio pe 3 rânduri, rolurile muzicale, Power și „Din <lună>",
 * apoi „Vezi profilul" (roz) și „Mesaj".
 *
 * Datele vin din adminul BBT (`/api/public/stoat/profil/<id Stoat>`, sesiunea Stoat ca dovadă);
 * avatarul și numele, din Stoat (sunt copia celor din BBT). Fără profil BBT (botul, contul
 * proprietarului, un profil nepublic) se arată cardul Stoat de dinainte — `fallback`.
 */

type ProfilBBT = {
  nume: string;
  username: string;
  bio: string | null;
  coverUrl: string | null;
  roles: string[];
  mainRole: string | null;
  powerScore: number;
  nrBangere: number;
  membruDin: string | null;
  verificat: boolean;
  eu: boolean;
  profilUrl: string;
};

/** Aceleași etichete ca pe site (`website/src/app/u/[username]/stil.ts`): `other` = „Explorer". */
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

const luna = new Intl.DateTimeFormat("ro-RO", {
  month: "long",
  year: "numeric",
});

const ROZ = "#FFA8CD";
const FUNDAL = "#141414"; // foaia din tema BBT (src/bbt/tema.ts, alb 8% pe negru)
const LINIE = "rgb(255 255 255 / 10%)";

export function MiniProfilBBT(props: {
  user: User;
  member?: ServerMember;
  onClose: () => void;
  fallback: JSX.Element;
  /** În foaia de pe telefon, rama o desenează dialogul — fără a doua rotunjire înăuntru. */
  inFoaie?: boolean;
}) {
  const state = useState();
  const navigate = useNavigate();
  const { openModal } = useModals();

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

  function mesaj() {
    props.user.openDM().then((canal) => navigate(canal.path));
    props.onClose();
  }

  function editeaza() {
    openModal({
      type: "settings",
      config: "user",
      context: { page: "profile" },
    });
    props.onClose();
  }

  const nume = () =>
    props.member?.displayName ?? props.user.displayName ?? profil.data?.nume;

  return (
    <Switch>
      {/* Eroare (admin căzut) sau fără profil BBT: cardul Stoat — mai bine el decât un card gol. */}
      <Match when={profil.isError || profil.data === null}>
        {props.fallback}
      </Match>
      <Match when={profil.isLoading}>
        <div
          style={{
            width: props.inFoaie ? "100%" : "320px",
            padding: "32px 20px",
            "text-align": "center",
            color: "rgb(255 255 255 / 60%)",
            background: FUNDAL,
            "border-radius": props.inFoaie ? undefined : "16px",
            "font-size": "13px",
          }}
        >
          Se încarcă…
        </div>
      </Match>
      <Match when={profil.data}>
        {(p) => (
          <div
            on:pointerdown={(e) => e.stopPropagation()}
            style={{
              width: props.inFoaie ? "100%" : "320px",
              overflow: "hidden",
              background: FUNDAL,
              color: "#fff",
              "border-radius": props.inFoaie ? undefined : "16px",
              border: props.inFoaie ? undefined : `1px solid ${LINIE}`,
              "box-shadow": props.inFoaie
                ? undefined
                : "0 16px 48px rgb(0 0 0 / 60%)",
            }}
          >
            {/* Coperta. Fără imagine: o bandă în accentul mărcii, ca pe site — un dreptunghi gri
                ar fi arătat ca o imagine care n-a reușit să se încarce. */}
            <div
              style={{
                position: "relative",
                height: "76px",
                background: p().coverUrl
                  ? `center / cover no-repeat url("${p().coverUrl}")`
                  : "linear-gradient(120deg,#3A2233,#2A2A33)",
              }}
            />

            <div style={{ position: "relative", padding: "0 16px 16px" }}>
              <div
                style={{
                  "margin-top": "-36px",
                  "margin-bottom": "8px",
                  width: "fit-content",
                  "border-radius": "50%",
                  "box-shadow": `0 0 0 4px ${FUNDAL}`,
                }}
              >
                <Avatar
                  src={props.user.animatedAvatarURL}
                  fallback={nume()}
                  fallbackBackground
                  size={64}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "6px",
                  "flex-wrap": "wrap",
                }}
              >
                <span style={{ "font-size": "17px", "font-weight": 700 }}>
                  {nume()}
                </span>
                <Show when={p().verificat}>
                  <span
                    title="Email și telefon confirmate"
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      "justify-content": "center",
                      width: "18px",
                      height: "18px",
                      "border-radius": "50%",
                      background: "#1D9BF0",
                      "font-size": "12px",
                    }}
                  >
                    <Symbol size={12}>check</Symbol>
                  </span>
                </Show>
              </div>
              <div
                style={{ "font-size": "13px", color: "rgb(255 255 255 / 60%)" }}
              >
                @{p().username}
              </div>

              <Show when={p().bio}>
                <p
                  style={{
                    margin: "8px 0 0",
                    "font-size": "14px",
                    "line-height": 1.5,
                    color: "rgb(255 255 255 / 80%)",
                    "white-space": "pre-line",
                    display: "-webkit-box",
                    "-webkit-line-clamp": 3,
                    "-webkit-box-orient": "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p().bio}
                </p>
              </Show>

              <Show when={p().roles.length > 0}>
                <div
                  style={{
                    display: "flex",
                    "flex-wrap": "wrap",
                    gap: "6px",
                    "margin-top": "10px",
                  }}
                >
                  <For each={p().roles.slice(0, 4)}>
                    {(rol) => (
                      <span
                        style={{
                          "border-radius": "999px",
                          padding: "4px 10px",
                          "font-size": "12px",
                          "font-weight": 600,
                          background: "rgb(255 255 255 / 8%)",
                          color: "rgb(255 255 255 / 80%)",
                        }}
                      >
                        {ROLURI[rol] ?? rol}
                      </span>
                    )}
                  </For>
                </div>
              </Show>

              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "16px",
                  "margin-top": "12px",
                  "padding-top": "12px",
                  "border-top": `1px solid ${LINIE}`,
                  "font-size": "12px",
                  color: "rgb(255 255 255 / 60%)",
                }}
              >
                <span>
                  <strong style={{ color: "#fff" }}>{p().powerScore}</strong>{" "}
                  Power
                </span>
                <Show when={p().membruDin}>
                  <span style={{ "margin-left": "auto" }}>
                    Din {luna.format(new Date(p().membruDin!))}
                  </span>
                </Show>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  "margin-top": "12px",
                  "align-items": "center",
                }}
              >
                <a
                  href={p().profilUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    height: "36px",
                    "border-radius": "10px",
                    background: ROZ,
                    color: "#000",
                    "font-size": "13px",
                    "font-weight": 600,
                    "text-decoration": "none",
                  }}
                >
                  Vezi profilul
                </a>
                <Show
                  when={!p().eu}
                  fallback={
                    <ButonSecundar onClick={editeaza}>Editează</ButonSecundar>
                  }
                >
                  <ButonSecundar onClick={mesaj}>Mesaj</ButonSecundar>
                </Show>
                {/* Restul acțiunilor Stoat (prieten, blocare, moderare) — meniul lor, neschimbat. */}
                <IconButton
                  size="sm"
                  use:floating={{
                    contextMenu: () => (
                      <UserContextMenu
                        user={props.user}
                        member={props.member}
                        onClose={props.onClose}
                      />
                    ),
                    contextMenuHandler: "click",
                  }}
                >
                  <Symbol>more_vert</Symbol>
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </Match>
    </Switch>
  );
}

function ButonSecundar(props: { onClick: () => void; children: JSX.Element }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        height: "36px",
        padding: "0 14px",
        "border-radius": "10px",
        border: `1px solid ${LINIE}`,
        background: "transparent",
        color: "#fff",
        "font-size": "13px",
        "font-weight": 600,
        cursor: "pointer",
      }}
    >
      {props.children}
    </button>
  );
}
