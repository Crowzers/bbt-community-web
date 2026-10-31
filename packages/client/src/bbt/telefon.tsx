import { JSX, Show } from "solid-js";

import type { Message, User } from "stoat.js";

import { C, DE_FONTE } from "./cont/ui";
import { mesajSistem } from "./mesajSistem";
import { durataVocal, formateazaDurata } from "./vocal/nume";

/**
 * BBT: piesele comune ale ecranelor de telefon (sub 600px). Cererea userului, 30 oct 2026: „pe telefon, hub-ul din
 * browser arată fix ca aplicația". Tot ce e aici e COPIAT din `mobil/src/ui` și `mobil/src/fir`, cu măsurile de acolo:
 * o cifră schimbată aici trebuie schimbată și în aplicație, altfel cele două încep să difere.
 *
 * Desktopul nu folosește nimic din fișierul ăsta: el rămâne pe machetele 21 și 23.
 */

/** `TITLU_PAGINA` din `mobil/src/ui/fonturi.ts`: aceeași mărime pe toate paginile de nivel 1. */
export const TITLU_PAGINA: JSX.CSSProperties = {
  ...DE_FONTE,
  margin: 0,
  "font-size": "32px",
  "line-height": "38px",
  color: C.text,
};

/** `deFonte(marime, rand)` din aplicație. */
export function deFonte(marime: number, rand?: number): JSX.CSSProperties {
  return {
    ...DE_FONTE,
    "font-size": `${marime}px`,
    ...(rand ? { "line-height": `${rand}px` } : {}),
  };
}

/** Un rând de text tăiat cu „…", ca `numberOfLines={1}`. */
export const UN_RAND: JSX.CSSProperties = {
  overflow: "hidden",
  "text-overflow": "ellipsis",
  "white-space": "nowrap",
};

/** Cercul de 40 de lângă titlu (căutare, rotiță): gri, ca în 20a și 20e. */
export const CERC_40: JSX.CSSProperties = {
  width: "40px",
  height: "40px",
  "flex-shrink": 0,
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  padding: 0,
  border: 0,
  "border-radius": "50%",
  background: C.foaie,
  color: C.text,
  cursor: "pointer",
  "-webkit-tap-highlight-color": "transparent",
};

/**
 * Iconițele din `mobil/src/ui/Iconite.tsx`: aceleași desene, pe grila de 24, cu mărimea și linia implicite de acolo.
 * Lucide seamănă, dar balonul, biletul și diezul sunt altfel desenate.
 */
function Icon(props: {
  size: number;
  linie: number;
  color?: string;
  children: JSX.Element;
}) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color ?? "currentColor"}
      stroke-width={props.linie}
      stroke-linecap="round"
      stroke-linejoin="round"
      style={{ "flex-shrink": 0 }}
    >
      {props.children}
    </svg>
  );
}

type PropsIcon = { size?: number; color?: string };

export const IconClopotel = (p: PropsIcon) => (
  <Icon size={p.size ?? 18} linie={2.2} color={p.color}>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10.3 20.5a2 2 0 0 0 3.4 0" />
  </Icon>
);

export const IconDiez = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.4} color={p.color}>
    <path d="M9 4 7 20M17 4l-2 16M4 9h17M3 15h17" />
  </Icon>
);
export const IconBalon = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.4} color={p.color}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />
  </Icon>
);
export const IconBilet = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.4} color={p.color}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" />
  </Icon>
);
export const IconInapoi = (p: PropsIcon) => (
  <Icon size={p.size ?? 20} linie={2.6} color={p.color}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);
export const IconPlus = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.6} color={p.color}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconCautare = (p: PropsIcon) => (
  <Icon size={p.size ?? 18} linie={2.4} color={p.color}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4-4" />
  </Icon>
);
export const IconQR = (p: PropsIcon) => (
  <Icon size={p.size ?? 18} linie={2.6} color={p.color}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6h-3" />
  </Icon>
);
export const IconCamera = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.2} color={p.color}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6c.3-.4.7-.6 1.2-.6h4c.5 0 .9.2 1.2.6L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </Icon>
);
export const IconMicrofon = (p: PropsIcon) => (
  <Icon size={p.size ?? 22} linie={2.2} color={p.color}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Icon>
);
export const IconRotita = (p: PropsIcon) => (
  <Icon size={p.size ?? 18} linie={2.2} color={p.color}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);

/**
 * Fundalurile cercului fără poză. Alese după id, ca un om să-și păstreze culoarea peste tot. ⚠️ Tot șase, în aceeași ordine:
 * alt număr de culori i-ar schimba culoarea fiecărui om. Griul și lila deschisă se topeau în fundalul firului, cu tot cu cerc
 * (userul, 31 oct), așa că au două tonuri mai pline, aceleași ca în aplicație.
 */
const FUNDALURI = [
  "#DCEEFF",
  C.galbenDeschis,
  C.verdeDeschis,
  "#E9CCFF",
  C.rozDeschis,
  "#FEDBCD",
];

function fundal(id: string | undefined) {
  if (!id) return C.rozDeschis;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FUNDALURI[h % FUNDALURI.length];
}

/**
 * Poza omului din Community; fără poză, beanbag-ul din `mobil/src/ui/Avatar.tsx` pe un cerc în culorile BBT: „b"-ul din
 * logo, de jos, aplecat ușor și tăiat de cerc (varianta C aleasă de user, 31 oct).
 *
 * ⚠️ Poza se ia DOAR când omul și-a pus una (`om.avatar`): `avatarURL` nu e niciodată gol, fără poză cade pe avatarul
 * implicit al Stoat, cu forma lor de marcă.
 */
export function AvatarOm(props: { om: User | undefined; marime: number }) {
  const url = () => (props.om?.avatar ? props.om.avatarURL : undefined);
  return (
    <span
      style={{
        position: "relative",
        display: "block",
        width: `${props.marime}px`,
        height: `${props.marime}px`,
        "flex-shrink": 0,
        "border-radius": "50%",
        overflow: "hidden",
        background: fundal(props.om?.id),
      }}
    >
      <Show
        when={url()}
        fallback={
          <svg
            width={props.marime}
            height={props.marime}
            viewBox="0 0 40 40"
            style={{ display: "block" }}
          >
            <path
              d="M465.95,348.05c-1.8-14.59-5-29.03-13.44-41.59h-.03c-6.62-17.06-18.26-30.42-31.57-42.49-17.36-15.74-38.57-24.66-60.05-32.97-22.98-8.92-46.31-16.94-68.94-26.83-34.87-15.26-58.05-40.49-68.47-77.21-2.32-8.24-4.65-16.46-6.89-24.73-3.52-12.86-6.84-25.8-12.34-38.07-8.79-19.63-23.36-32.77-44.19-38.44-19.48-5.3-38.87-7.02-58.4,1-14.91,6.12-53.98,20.03-72.84,61.23-9.22,20.93-13.04,43.19-16.26,65.57-2.65,18.29-4.2,36.7-6.87,54.98-3,20.36-4.57,40.79-5.3,61.3-.72,19.86-.32,39.72,1.3,59.6,1.55,18.81,3.4,37.52,7.82,55.83,11.92,49.46,38.49,89.73,78.01,121.55,41.94,33.77,90.28,51.56,143.68,55.33,43.12,3.07,84.71-4.55,124.9-20.36,24.06-9.44,45.66-22.61,62.37-42.42,36.85-43.71,54.63-93.77,47.51-151.28"
              transform="translate(6 13) rotate(-9 14 20) scale(0.066)"
              fill="rgba(10,10,11,0.28)"
            />
          </svg>
        }
      >
        <img
          src={url()}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            "object-fit": "cover",
          }}
        />
      </Show>
    </span>
  );
}

/** Cipurile din 19a și 20a. `peNegru`: cipul ales e negru (20a); altfel alb cu umbră, pe gri (19a). */
export function Cip(props: {
  text: string;
  activ: boolean;
  peNegru?: boolean;
  laApasare: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.activ}
      onClick={() => props.laApasare()}
      style={{
        "flex-shrink": 0,
        padding: "7px 14px",
        border: 0,
        "border-radius": "999px",
        background: !props.activ
          ? C.foaie
          : props.peNegru
            ? C.negru
            : C.fundal,
        "box-shadow":
          props.activ && !props.peNegru
            ? "0 2px 8px rgba(0,0,0,0.1)"
            : undefined,
        color: !props.activ ? C.stins : props.peNegru ? C.peNegru : C.text,
        "font-family": "inherit",
        "font-size": "12px",
        "line-height": "15px",
        "font-weight": props.activ ? 800 : 700,
        "white-space": "nowrap",
        cursor: "pointer",
        "-webkit-tap-highlight-color": "transparent",
      }}
    >
      {props.text}
    </button>
  );
}

/**
 * Rândul de sub numele canalului sau al omului în liste: „Dianka: Mesaj vocal (0:05)", „Tu: am pus beat-ul". Copie
 * după `mobil/src/fir/rezumat.ts`; tipul fișierului se citește la fel, vocalul după nume.
 */
export function rezumatMesaj(
  m: Message | undefined,
  euId: string | undefined,
  cuAutor: boolean,
): string {
  if (!m) return "";
  const sistem = mesajSistem(m, euId);
  if (sistem) return sistem.text;
  const f = m.attachments?.[0];
  let text = (m.content ?? "").trim();
  if (!text && f) {
    const durata = durataVocal(f.filename);
    const tip = f.metadata.type;
    text =
      durata !== null
        ? `Mesaj vocal (${formateazaDurata(durata)})`
        : tip === "Audio"
          ? "Mesaj vocal"
          : tip === "Image"
            ? "Poză"
            : tip === "Video"
              ? "Video"
              : (f.filename ?? "Fișier");
  }
  if (!text) return "";
  if (m.authorId && m.authorId === euId) return `Tu: ${text}`;
  return cuAutor && m.author ? `${m.author.displayName}: ${text}` : text;
}

const ZILE = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
const LUNI = [
  "ian",
  "feb",
  "mar",
  "apr",
  "mai",
  "iun",
  "iul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** Ora din dreapta rândului: „18:04" azi, „Ieri", ziua săptămânii, apoi „12 oct". */
export function oraRand(d: Date | undefined, acum = new Date()): string {
  if (!d) return "";
  const zi = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const zile = Math.round((zi(acum) - zi(d)) / 86_400_000);
  if (zile <= 0)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (zile === 1) return "Ieri";
  if (zile < 7) return ZILE[d.getDay()];
  return `${d.getDate()} ${LUNI[d.getMonth()]}`;
}

/** „15 nov". */
export function ziScurta(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${LUNI[d.getMonth()]}`;
}

/** „12-19 dec", „30 nov-2 dec", „14 nov" (o singură zi). Cu cratimă, nu cu linie lungă. */
export function interval(start: string, end: string | null): string {
  const a = new Date(start);
  const b = end ? new Date(end) : null;
  if (!b || (a.getDate() === b.getDate() && a.getMonth() === b.getMonth()))
    return ziScurta(start);
  if (a.getMonth() === b.getMonth())
    return `${a.getDate()}-${b.getDate()} ${LUNI[b.getMonth()]}`;
  return `${ziScurta(start)}-${ziScurta(end!)}`;
}

/** „aug" sau „aug 2025" pentru alt an decât cel curent (lista „Trecute"). */
export function lunaScurta(iso: string, acum = new Date()): string {
  const d = new Date(iso);
  return d.getFullYear() === acum.getFullYear()
    ? LUNI[d.getMonth()]
    : `${LUNI[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Pune `f` după ce se desenează ruta nouă. ⚠️ Ecranul se schimbă pe loc (`SlideDrawer.faraAnimatie`): chemat înaintea
 * routerului, ar arăta un cadru cu ce era dedesubt (lista veche, canalul de dinainte).
 */
export function dupaNavigare(f: () => void) {
  requestAnimationFrame(f);
}
