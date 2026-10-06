import { For, Show, createSignal, onCleanup } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { useClient, useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";

import { CautareSus, Clopotel } from "./CautareSiAlerte";
import { BBT_ADMIN_URL, BBT_SITE_URL } from "./config";

/**
 * Bara de sus a BBT Community — copia barei din Community-ul vechi
 * (`website/src/app/community/BaraSus.tsx` + `CasetaUtilizator.tsx`), la cererea userului
 * (5 oct 2026): „logoul să fie mare cum e în Community-ul vechi, iar user card-ul din dreapta
 * sus să fie același cu cel de pe website".
 *
 * - Stânga: sigla BBT completă, albă, 30px, + „COMMUNITY" (15px, majuscule, spațiere 0.18em).
 * - Dreapta: caseta de cont — avatar 34px, nume, sub el „Artist verificat" (verde) sau
 *   „Completează profilul" (chihlimbar), exact regula de pe site (telefon confirmat). La hover
 *   (desktop) sau atingere, meniul de cont al site-ului: aceleași linkuri ca `MeniuCont`
 *   (`dashboardNavItems`), deschise pe site, plus ce ține de Community (setările lui, ieșirea).
 *
 * Înălțimea e 64px, nu 72 ca pe site: compromisul cerut („foarte puțin mai mari, cât să încapă
 * logoul mai mare") față de cei 48 ai primei variante.
 *
 * Căutarea (în canalul deschis) și clopoțelul (mențiuni + mesaje directe necitite) stau lângă cont,
 * ca în pânza TRW — vezi `CautareSiAlerte.tsx` pentru ce pot și ce nu pot face.
 *
 * Telefon (`compact`): în capul ecranului cu lista de canale (`src/interface/Sidebar.tsx`).
 */

type ProfilEu = {
  numeComplet: string;
  numeAfisat: string | null;
  username: string | null;
  verificat: boolean;
  siteUrl: string;
};

const LINIE = "rgba(255,255,255,0.08)";
const FOAIE = "#141414";

/** Aceleași rânduri ca meniul de cont al site-ului (`website/src/lib/dashboardNavItems.ts`). */
const ACTIVITATE = [
  { href: "/dashboard/mycamps", nume: "My Camps", simbol: "camping" },
  { href: "/dashboard/workshops", nume: "My Workshops", simbol: "bolt" },
  { href: "/dashboard/cursuri", nume: "My Courses", simbol: "school" },
  {
    href: "/dashboard/diplome",
    nume: "Diplomele mele",
    simbol: "workspace_premium",
  },
];
const CONT = [
  { href: "/dashboard/plati", nume: "Plățile mele", simbol: "payments" },
  { href: "/dashboard/wishlist", nume: "Wishlist", simbol: "favorite" },
  { href: "/dashboard/setari", nume: "Setări cont", simbol: "settings" },
];

export function BaraSus(props: { compact?: boolean }) {
  const client = useClient();
  const state = useState();
  const { logout } = useClientLifecycle();
  const { openModal } = useModals();

  const [meniu, setMeniu] = createSignal(false);
  let inchidere: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(inchidere));

  const profil = useQuery(() => ({
    queryKey: ["bbt-profil-eu"],
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ProfilEu | null> => {
      const r = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/profil`, {
        headers: { "X-Session-Token": state.auth.getSession()?.token ?? "" },
      });
      return r.ok ? r.json() : null;
    },
  }));

  const eu = () => client().user;
  const nume = () =>
    eu()?.displayName ?? profil.data?.numeComplet ?? "Contul meu";
  const site = () => profil.data?.siteUrl ?? BBT_SITE_URL;
  const linkProfil = () =>
    profil.data?.username
      ? `${site()}/u/${profil.data.username}`
      : `${site()}/dashboard/profil`;

  function deschideSetari(pagina?: string) {
    setMeniu(false);
    openModal({
      type: "settings",
      config: "user",
      context: pagina ? { page: pagina } : undefined,
    });
  }

  const randMeniu = {
    display: "flex",
    "align-items": "center",
    gap: "8px",
    "min-height": "44px",
    padding: "0 16px",
    "font-size": "13.5px",
    "font-weight": 500,
    color: "rgba(255,255,255,0.8)",
    "text-decoration": "none",
    background: "transparent",
    border: "0",
    width: "100%",
    cursor: "pointer",
    // ⚠️ `font-family`, NU `font: inherit`: scurtătura resetează și `font-size` de mai sus.
    "font-family": "inherit",
    "text-align": "left" as const,
  };

  const Grup = (p: { linkuri: typeof ACTIVITATE }) => (
    <For each={p.linkuri}>
      {(l) => (
        <a
          href={`${site()}${l.href}`}
          target="_blank"
          rel="noopener"
          onClick={() => setMeniu(false)}
          style={randMeniu}
        >
          <Symbol size={15}>{l.simbol}</Symbol>
          {l.nume}
        </a>
      )}
    </For>
  );

  return (
    <header
      style={{
        height: props.compact ? "56px" : "64px",
        "flex-shrink": 0,
        // Deasupra conținutului: meniul de cont cade peste lista de canale și mesaje.
        // ⚠️ Pe telefon bara stă în ecranul cu lista de canale, iar ecranul canalului ALUNECĂ peste el:
        // cu z-index permanent, bara rămânea deasupra canalului și îi acoperea antetul. Acolo urcă
        // doar cât e deschis meniul (care se deschide din ecranul cu lista, deci nimic nu e acoperit).
        position: "relative",
        "z-index": !props.compact || meniu() ? 20 : undefined,
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "12px",
        padding: props.compact ? "0 8px 0 14px" : "0 20px 0 18px",
        background: "#000",
        "border-bottom": `1px solid ${LINIE}`,
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          "min-width": 0,
        }}
      >
        <Wordmark
          aria-label="BBT"
          style={{
            height: props.compact ? "24px" : "30px",
            width: "auto",
            color: "#fff",
            "flex-shrink": 0,
          }}
        />
        <span
          style={{
            "font-size": props.compact ? "13px" : "15px",
            "font-weight": 700,
            "letter-spacing": "0.18em",
            "text-transform": "uppercase",
          }}
        >
          Community
        </span>
      </div>

      {/* BBT: căutarea în canal și clopoțelul, lângă cont (pânza TRW) — src/bbt/CautareSiAlerte.tsx. */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          "margin-left": "auto",
        }}
      >
        <Show when={!props.compact}>
          <CautareSus />
          <Clopotel />
        </Show>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          "align-items": "center",
          "align-self": "stretch",
        }}
        onMouseEnter={() => {
          clearTimeout(inchidere);
          if (!props.compact) setMeniu(true);
        }}
        onMouseLeave={() => {
          // Răgaz scurt: între pastilă și panou e un gol, iar fără el meniul s-ar închide exact
          // când mouse-ul îl traversează. Același truc ca pe site.
          inchidere = setTimeout(() => setMeniu(false), 200);
        }}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={meniu()}
          aria-label="Contul meu"
          onClick={() => setMeniu((m) => !m)}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "10px",
            padding: props.compact ? "4px" : "6px 16px 6px 6px",
            "border-radius": "999px",
            border: props.compact ? "0" : `1px solid ${LINIE}`,
            background:
              meniu() && !props.compact
                ? "rgba(255,255,255,0.06)"
                : "transparent",
            color: "#fff",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <Avatar
            src={eu()?.animatedAvatarURL}
            fallback={nume()}
            fallbackBackground
            size={34}
          />
          <Show when={!props.compact}>
            <span
              style={{
                "text-align": "left",
                "line-height": "1.25",
                "min-width": 0,
              }}
            >
              <span
                style={{
                  display: "block",
                  "max-width": "150px",
                  overflow: "hidden",
                  "text-overflow": "ellipsis",
                  "white-space": "nowrap",
                  "font-size": "14px",
                  "font-weight": 700,
                }}
              >
                {nume()}
              </span>
              <span
                style={{
                  display: "block",
                  "font-size": "12px",
                  "font-weight": 600,
                  color: profil.data?.verificat ? "#5BD08A" : "#E0A854",
                }}
              >
                {profil.data?.verificat
                  ? "Artist verificat"
                  : "Completează profilul"}
              </span>
            </span>
          </Show>
        </button>

        <Show when={meniu()}>
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              "z-index": 50,
              width: "240px",
              "padding-top": props.compact ? "4px" : "0",
            }}
          >
            <div
              style={{
                overflow: "hidden",
                "border-radius": "16px",
                border: `1px solid ${LINIE}`,
                background: FOAIE,
                padding: "8px 0",
                "box-shadow": "0 16px 48px rgba(0,0,0,0.6)",
              }}
            >
              <a
                href={linkProfil()}
                target="_blank"
                rel="noopener"
                onClick={() => setMeniu(false)}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                  padding: "4px 16px 12px",
                  "margin-bottom": "4px",
                  "border-bottom": `1px solid ${LINIE}`,
                  "text-decoration": "none",
                  color: "#fff",
                }}
              >
                <Avatar
                  src={eu()?.animatedAvatarURL}
                  fallback={nume()}
                  fallbackBackground
                  size={38}
                />
                <span style={{ "min-width": 0, "line-height": "1.3" }}>
                  <span
                    style={{
                      display: "block",
                      "font-size": "13.5px",
                      "font-weight": 700,
                    }}
                  >
                    {nume()}
                  </span>
                  <Show when={profil.data?.username}>
                    <span
                      style={{
                        display: "block",
                        "font-size": "12px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      @{profil.data!.username}
                    </span>
                  </Show>
                  <Show when={profil.data?.verificat}>
                    <span
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        gap: "4px",
                        "margin-top": "2px",
                        "font-size": "12px",
                        "font-weight": 700,
                        color: "#5BD08A",
                      }}
                    >
                      <Symbol size={11}>check_circle</Symbol> Artist verificat
                    </span>
                  </Show>
                </span>
              </a>

              <Grup linkuri={ACTIVITATE} />
              <div
                style={{ margin: "4px 0", "border-top": `1px solid ${LINIE}` }}
              />
              <Grup linkuri={CONT} />
              <div
                style={{
                  "margin-top": "4px",
                  "padding-top": "4px",
                  "border-top": `1px solid ${LINIE}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => deschideSetari("profile")}
                  style={randMeniu}
                >
                  <Symbol size={15}>person</Symbol> Profilul în Community
                </button>
                <button
                  type="button"
                  onClick={() => deschideSetari("notifications")}
                  style={randMeniu}
                >
                  <Symbol size={15}>notifications</Symbol> Setări Community
                </button>
                <a
                  href={`${site()}/camps?vitrina=1`}
                  target="_blank"
                  rel="noopener"
                  onClick={() => setMeniu(false)}
                  style={randMeniu}
                >
                  <Symbol size={15}>explore</Symbol> Descoperă experiențe
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMeniu(false);
                    logout();
                  }}
                  style={{ ...randMeniu, color: "#FF8A80" }}
                >
                  <Symbol size={15}>logout</Symbol> Deconectare
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </header>
  );
}
