import { For, Show, createSignal, onCleanup } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { useClient, useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";

import { ButonInstalare } from "./ButonInstalare";
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
 *   (desktop) sau atingere, meniul de cont: rândurile contului din hub (`cont/ContulMeu.tsx`),
 *   plus ce ține de Community (setările lui, ieșirea).
 *
 * Înălțimea e 64px, nu 72 ca pe site: compromisul cerut („foarte puțin mai mari, cât să încapă
 * logoul mai mare") față de cei 48 ai primei variante.
 *
 * Căutarea (în canalul deschis) și clopoțelul (mențiuni + mesaje directe necitite) stau lângă cont,
 * ca în pânza TRW — vezi `CautareSiAlerte.tsx` pentru ce pot și ce nu pot face. Lângă ele, chiar
 * înaintea contului, butonul mare de instalare pe calculator (`ButonInstalare.tsx`, 20 oct 2026).
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

/**
 * Rândurile contului, aceleași ca meniul din stânga al contului (`cont/ContulMeu.tsx`, 23 din 30 oct 2026), deschise
 * în hub. `pagina` = ruta `/cont/<pagina>`.
 *
 * ⚠️ Până pe 30 oct se deschideau în hub DOAR în aplicația instalată, iar în browser pe site (decizia #6 din
 * `2026-10-20-hub-standalone-cont-design.md`). Userul a cerut contul în hub și pe web („hai să facem așa și pe web"),
 * deci nu mai există ramura spre site.
 */
const ACTIVITATE = [
  {
    pagina: "experiente",
    nume: "Experiențele mele",
    simbol: "confirmation_number",
  },
  { pagina: "diplome", nume: "Diplome", simbol: "workspace_premium" },
  { pagina: "plati", nume: "Plăți", simbol: "payments" },
];
const CONT = [
  { pagina: "profil", nume: "Profil public", simbol: "person" },
  { pagina: "date", nume: "Date personale", simbol: "badge" },
  { pagina: "notificari", nume: "Notificări", simbol: "notifications" },
];

export function BaraSus(props: { compact?: boolean }) {
  const client = useClient();
  const state = useState();
  const { logout } = useClientLifecycle();
  const { openModal } = useModals();
  const navigate = useNavigate();

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
          href={`/cont/${l.pagina}`}
          onClick={(e) => {
            e.preventDefault();
            setMeniu(false);
            navigate(`/cont/${l.pagina}`);
          }}
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
        // BBT: în aplicația instalată, cu bara de titlu a Windows-ului ascunsă (săgeata din ea,
        // `display_override: window-controls-overlay` din `vite.config.ts`), bara asta ține loc de
        // bară de titlu, iar butoanele native (minimizare, mărire, închidere) stau PESTE colțul ei din
        // dreapta (pe Mac, semafoarele în stânga). Fără spațiul de mai jos, pastila contului intra sub
        // ele (bug raportat de user, 20 oct 2026). Butoanele native nu pot fi scoase dintr-un PWA.
        // `titlebar-area-*` există doar cât bara de titlu e ascunsă; altfel valorile de rezervă dau 0.
        "padding-top": "0",
        "padding-bottom": "0",
        "padding-left": `calc(${props.compact ? "14px" : "18px"} + env(titlebar-area-x, 0px))`,
        "padding-right": `calc(${props.compact ? "8px" : "20px"} + 100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw))`,
        // Golurile barei mută fereastra, ca o bară de titlu (dublu clic = mărire). Ce se apasă e
        // `no-drag` mai jos: în zona de tras, Windows nu mai trimite clicuri și nici hover.
        "-webkit-app-region": "drag",
        "-webkit-user-select": "none",
        background: "#000",
        "border-bottom": `1px solid ${LINIE}`,
        color: "#fff",
      }}
    >
      {/* BBT: sigla duce mereu în chat, ca butonul Chat din `BaraSectiuni` (cererea userului,
          20 oct 2026: „e mai natural așa"). Din cont, din mesaje, de oriunde. */}
      <button
        type="button"
        aria-label="BBT Community, înapoi în chat"
        onClick={() => {
          const s = client().servers.toList()[0];
          if (s) navigate(`/server/${s.id}`);
        }}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          "min-width": 0,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
          "-webkit-app-region": "no-drag",
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
      </button>

      {/* BBT: căutarea în canal și clopoțelul, lângă cont (pânza TRW) — src/bbt/CautareSiAlerte.tsx. */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          "margin-left": "auto",
          "-webkit-app-region": "no-drag",
        }}
      >
        {/* Pe telefon, din bara asta rămâne doar butonul de instalare (cu tutorial unde nu se poate direct). */}
        <Show when={!props.compact} fallback={<ButonInstalare compact />}>
          <CautareSus />
          <Clopotel />
          {/* BBT: „Instalează pe Windows/Mac", lângă cont. Se ascunde singur în rest. */}
          <ButonInstalare />
        </Show>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          "align-items": "center",
          "align-self": "stretch",
          "-webkit-app-region": "no-drag",
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
