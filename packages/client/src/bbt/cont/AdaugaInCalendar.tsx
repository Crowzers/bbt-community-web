import { JSX, Show, createSignal, onCleanup, onMount } from "solid-js";

import { BBT_SITE_URL } from "../config";
import { sistemTelefon } from "../instalare";
import {
  type CalendarTabara,
  descarcaIcs,
  fisierIcs,
  linkGoogleCalendar,
  numeFisierIcs,
} from "./calendarIcs";
import { Buton, C } from "./ui";

/**
 * BBT: „Adaugă în calendar” pe calculator (26 nov 2026, varianta A aleasă de user pe schițe), copia comportamentului de
 * pe site (`website/src/components/AdaugaInCalendar.tsx`). Butonul deschide un meniu cu Google Calendar și Apple
 * Calendar, fiecare cu sigla lui. Până atunci descărca direct fișierul `.ics`, care pe calculator rămânea în Descărcări.
 *
 * - Doar Google și Apple: userul, „nu folosește nimeni Outlook”.
 * - Sub Apple Calendar NU scrie „descarcă fișierul” (userul, pe schiță).
 * - Pe telefon și tabletă nu se schimbă nimic: fișierul deschide calendarul telefonului.
 */

/** Telefonul și tableta (și iPad-ul care se dă drept Mac) rămân pe fișier, fără alegere. */
export const peTelefon = () => sistemTelefon() !== null;

/**
 * Fișierul `.ics` al taberei, cu alarmă cu o zi înainte (25 nov 2026, ca pe site). `id` ține evenimentul unul singur
 * dacă omul apasă de două ori; linkul din eveniment duce la pagina taberei de pe site.
 */
export function adaugaInCalendar(calendar: CalendarTabara, id: string) {
  const ics = fisierIcs(calendar, {
    uid: `tabara-${id}@beanbagtheory.ro`,
    url: `${BBT_SITE_URL}/my-camp/${id}`,
    alarma: `Mâine pleci: ${calendar.titlu}`,
  });
  descarcaIcs(ics, numeFisierIcs(calendar.titlu));
}

/** Sigla Google Calendar (versiunea din 2020), vectorii oficiali: cifrele sunt contururi, nu depind de font. */
export function SiglaGoogleCalendar(props: { size?: number }) {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 200 200"
      aria-hidden="true"
      style={{ "flex-shrink": 0 }}
    >
      <g transform="translate(3.75 3.75)">
        <path
          fill="#FFFFFF"
          d="M148.882,43.618l-47.368-5.263l-57.895,5.263L38.355,96.25l5.263,52.632l52.632,6.579l52.632-6.579 l5.263-53.947L148.882,43.618z"
        />
        <path
          fill="#1A73E8"
          d="M65.211,125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c0.829,3.158,2.276,5.605,4.342,7.342 c2.053,1.737,4.553,2.592,7.474,2.592c2.987,0,5.553-0.908,7.697-2.724s3.224-4.132,3.224-6.934c0-2.868-1.132-5.211-3.395-7.026 s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921,0,5.382-0.789,7.382-2.368c2-1.579,3-3.737,3-6.487 c0-2.447-0.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684,0-4.816,0.711-6.395,2.145s-2.724,3.197-3.447,5.276 l-9.039-3.763c1.197-3.395,3.395-6.395,6.618-8.987c3.224-2.592,7.342-3.895,12.342-3.895c3.697,0,7.026,0.711,9.974,2.145 c2.947,1.434,5.263,3.421,6.934,5.947c1.671,2.539,2.5,5.382,2.5,8.539c0,3.224-0.776,5.947-2.329,8.184 c-1.553,2.237-3.461,3.947-5.724,5.145v0.539c2.987,1.25,5.421,3.158,7.342,5.724c1.908,2.566,2.868,5.632,2.868,9.211 s-0.908,6.776-2.724,9.579c-1.816,2.803-4.329,5.013-7.513,6.618c-3.197,1.605-6.789,2.421-10.776,2.421 C73.408,129.263,69.145,127.934,65.211,125.276z"
        />
        <path
          fill="#1A73E8"
          d="M121.25,79.961l-9.974,7.25l-5.013-7.605l17.987-12.974h6.895v61.197h-9.895L121.25,79.961z"
        />
        <path
          fill="#EA4335"
          d="M148.882,196.25l47.368-47.368l-23.684-10.526l-23.684,10.526l-10.526,23.684L148.882,196.25z"
        />
        <path
          fill="#34A853"
          d="M33.092,172.566l10.526,23.684h105.263v-47.368H43.618L33.092,172.566z"
        />
        <path
          fill="#4285F4"
          d="M12.039-3.75C3.316-3.75-3.75,3.316-3.75,12.039v136.842l23.684,10.526l23.684-10.526V43.618h105.263 l10.526-23.684L148.882-3.75H12.039z"
        />
        <path
          fill="#188038"
          d="M-3.75,148.882v31.579c0,8.724,7.066,15.789,15.789,15.789h31.579v-47.368H-3.75z"
        />
        <path
          fill="#FBBC04"
          d="M148.882,43.618v105.263h47.368V43.618l-10.526-23.684L148.882,43.618z"
        />
        <path
          fill="#1967D2"
          d="M196.25,43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z"
        />
      </g>
    </svg>
  );
}

/** Mărul Apple, în culoarea textului. */
export function SiglaApple(props: { size?: number }) {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ "flex-shrink": 0 }}
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

/** Rândul din meniu, ca rândurile hărților din `CumAjungi.tsx`. */
export const RAND_MENIU: JSX.CSSProperties = {
  display: "flex",
  "align-items": "center",
  gap: "10px",
  width: "100%",
  padding: "10px 12px",
  "box-sizing": "border-box",
  "border-radius": "12px",
  border: 0,
  background: "transparent",
  color: C.text,
  "font-family": "inherit",
  "font-size": "16px",
  "font-weight": 600,
  "text-align": "left",
  "text-decoration": "none",
  cursor: "pointer",
};

export const ETICHETA_MENIU: JSX.CSSProperties = {
  display: "block",
  padding: "8px 12px 6px",
  color: C.stins,
  "font-size": "12px",
  "font-weight": 700,
  "letter-spacing": "0.15em",
  "text-transform": "uppercase",
};

const peste = (e: MouseEvent) =>
  ((e.currentTarget as HTMLElement).style.background = C.foaie);
const afaraDe = (e: MouseEvent) =>
  ((e.currentTarget as HTMLElement).style.background = "transparent");

/** Cele două rânduri: Google Calendar (link) și Apple Calendar (fișierul). Folosite și de meniul adresei. */
export function OptiuniCalendar(props: {
  calendar: CalendarTabara;
  id: string;
  laAlegere: () => void;
  /** Linia dintre Google și Apple: doar în meniul butonului, ca pe schița A; meniul adresei n-o are. */
  cuLinie?: boolean;
}) {
  return (
    <>
      <a
        role="menuitem"
        href={linkGoogleCalendar(
          props.calendar,
          `${BBT_SITE_URL}/my-camp/${props.id}`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => props.laAlegere()}
        style={RAND_MENIU}
        onMouseEnter={peste}
        onMouseLeave={afaraDe}
      >
        <SiglaGoogleCalendar />
        Google Calendar
      </a>
      <Show when={props.cuLinie}>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            margin: "4px 12px",
            "border-top": `1px solid ${C.linie}`,
          }}
        />
      </Show>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          adaugaInCalendar(props.calendar, props.id);
          props.laAlegere();
        }}
        style={RAND_MENIU}
        onMouseEnter={peste}
        onMouseLeave={afaraDe}
      >
        <SiglaApple />
        Apple Calendar
      </button>
    </>
  );
}

/**
 * Butonul din cardul „Cum ajungi” al filei Info. Pe calculator deschide meniul sub el; pe telefon descarcă direct.
 * ⚠️ Cardul din jur trebuie să lase meniul să iasă (`overflow: visible`): `Card` are `overflow: hidden`.
 */
export function ButonCalendar(props: { calendar: CalendarTabara; id: string }) {
  const [deschis, setDeschis] = createSignal(false);
  let cutie: HTMLDivElement | undefined;

  onMount(() => {
    const afara = (e: PointerEvent) => {
      if (cutie && !cutie.contains(e.target as Node)) setDeschis(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setDeschis(false);
    document.addEventListener("pointerdown", afara);
    document.addEventListener("keydown", esc);
    onCleanup(() => {
      document.removeEventListener("pointerdown", afara);
      document.removeEventListener("keydown", esc);
    });
  });

  return (
    <div
      ref={cutie}
      style={{ position: "relative", display: "flex", "margin-top": "8px" }}
    >
      <Buton
        lat
        piele="alb"
        onClick={() =>
          peTelefon()
            ? adaugaInCalendar(props.calendar, props.id)
            : setDeschis((v) => !v)
        }
      >
        Adaugă în calendar
      </Buton>
      <Show when={deschis()}>
        <div
          role="menu"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 6px)",
            "z-index": 20,
            padding: "6px",
            "border-radius": "16px",
            border: `1px solid ${C.linie}`,
            background: C.fundal,
            "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
          }}
        >
          <span style={ETICHETA_MENIU}>Adaugă în</span>
          <OptiuniCalendar
            calendar={props.calendar}
            id={props.id}
            laAlegere={() => setDeschis(false)}
            cuLinie
          />
        </div>
      </Show>
    </div>
  );
}
