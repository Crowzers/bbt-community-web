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

/** Fundalurile cercului fără poză. Alese după id, ca un om să-și păstreze culoarea peste tot. */
const FUNDALURI = [
  "#DCEEFF",
  C.galbenDeschis,
  C.verdeDeschis,
  "#F8F0FF",
  C.rozDeschis,
  C.foaie,
];

function fundal(id: string | undefined) {
  if (!id) return C.foaie;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FUNDALURI[h % FUNDALURI.length];
}

/**
 * Poza omului din Community; fără poză, silueta din `mobil/src/ui/Avatar.tsx` pe un cerc în culorile BBT.
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
            <circle cx="20" cy="15.5" r="7.5" fill="rgba(10,10,11,0.28)" />
            <path
              d="M5.5 40c0-8.6 6.5-14.5 14.5-14.5S34.5 31.4 34.5 40z"
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
