import { For, JSX, Show, createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * BBT: piesele comune ale contului din hub.
 *
 * 🔥 **Paleta albă din macheta 23** (30 oct 2026), aceeași cu aplicația de telefon (`mobil/src/ui/culori.ts`):
 * fundal alb, carduri #F2F2F3, pill negru pentru acțiunea principală, roz pentru ce e „azi", galben pentru plăți
 * scadente, verde pentru plătit, roșu doar pentru ieșire și întârzieri. Până atunci contul era pe paleta închisă
 * a hub-ului (`tema.ts`); restul hub-ului (canalele, mesajele) trece pe alb într-un pas următor.
 *
 * ⚠️ Numele vechi (`foaie`, `stins`, `chihlimbar`…) au rămas, ca Playlist-ul și setările să se mute pe alb fără
 * să fie rescrise; doar valorile s-au schimbat. Textul pe roz și pe galben e NEGRU: alb pe roz dă 1,6:1.
 *
 * Mărimile urmează pragul casei: 16 în câmpuri (sub 16 Safari pe iOS mărește pagina), 14 minim în rest, 12 doar
 * pe etichetele cu majuscule.
 */

export const C = {
  fundal: "#FFFFFF",
  /** Cardurile (#F2F2F3 din machetă). */
  foaie: "#F2F2F3",
  /** Câmpurile și rândul apăsat. */
  foaieTare: "#F3F3F6",
  linie: "#E5E5E5",
  text: "#0A0A0B",
  /** #0A0A0B la 60%, textul secundar din machetă. */
  stins: "#6C6C6D",
  /** Placeholder și metadate. */
  slab: "#8D8D9A",
  roz: "#FFB3D9",
  rozDeschis: "#FFE4F1",
  rozIntens: "#B85C86",
  negru: "#0A0A0B",
  peNegru: "#FFFFFF",
  /** Plătit, pe alb (verdele deschis al pastilelor nu se citește ca text). */
  verde: "#1E9E62",
  verdeDeschis: "#99E9C4",
  /** Ratele plătite din bara de progres. */
  verdeBara: "#55DB9C",
  galben: "#FFD731",
  galbenDeschis: "#FFEFAD",
  /** Text de avertisment pe alb (scadențe, „Completează profilul"). */
  chihlimbar: "#A66A00",
  rosu: "#CA1A38",
  camps: "#FFD731",
  workshops: "#FB4903",
  cursuri: "#5C4ADE",
};

/** Titlurile mari din 23 (`fonte.css`). Spațierea de pe site, fără spațiere negativă: regulă de marcă. */
export const DE_FONTE: JSX.CSSProperties = {
  "font-family": '"De Fonte BBT", Inter, sans-serif',
  "font-weight": 400,
  "letter-spacing": "0.01em",
  "font-synthesis": "none",
};

/** Titlul paginii (23b: „Experiențele mele" mare), cu ce stă în dreapta lui (23b: „Vezi site ↗", 23d: „Schimbă…"). */
export function TitluPagina(props: {
  children: JSX.Element;
  dreapta?: JSX.Element;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "16px",
        "flex-wrap": "wrap",
        margin: "0 0 20px",
      }}
    >
      <h1
        style={{
          ...DE_FONTE,
          margin: 0,
          // 36, ca în 23b.
          "font-size": "36px",
          "line-height": "1.05",
          color: C.text,
        }}
      >
        {props.children}
      </h1>
      {props.dreapta}
    </div>
  );
}

export function Card(props: {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}) {
  return (
    <div
      style={{
        "border-radius": "28px",
        background: C.foaie,
        overflow: "hidden",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

/** Eticheta mică cu majuscule (23: „AZI · 19:00 · CONTROL CLUB", „DOCUMENTE"). 12 e voie doar pe majuscule. */
export function Eticheta(props: { culoare?: string; children: JSX.Element }) {
  return (
    <span
      style={{
        "font-size": "12px",
        "font-weight": 700,
        "letter-spacing": "0.06em",
        "text-transform": "uppercase",
        color: props.culoare ?? C.stins,
      }}
    >
      {props.children}
    </span>
  );
}

const CULORI_PASTILA = {
  ok: { bg: C.verdeDeschis, text: C.negru },
  asteapta: { bg: C.galben, text: C.negru },
  neutru: { bg: C.fundal, text: C.stins },
  roz: { bg: C.roz, text: C.negru },
  // „Plătit" de pe biletul de azi (23b).
  negru: { bg: C.negru, text: C.peNegru },
};

export function Pastila(props: {
  fel: keyof typeof CULORI_PASTILA;
  children: JSX.Element;
}) {
  const culori = () => CULORI_PASTILA[props.fel];
  return (
    <span
      style={{
        display: "inline-flex",
        "align-items": "center",
        gap: "4px",
        // 23b: pastile mici, 5 / 10, text gros de 12 (11 în machetă; 12 e pragul casei).
        padding: "5px 10px",
        "border-radius": "999px",
        background: culori().bg,
        color: culori().text,
        "font-size": "12px",
        "font-weight": 800,
        "white-space": "nowrap",
      }}
    >
      {props.children}
    </span>
  );
}

const PIELE_BUTON = {
  negru: { bg: C.negru, text: C.peNegru, contur: "transparent" },
  // Plățile scadente: galben, ca în 23b, 23e și în aplicația de telefon (20d).
  galben: { bg: C.galben, text: C.negru, contur: "transparent" },
  alb: { bg: C.fundal, text: C.text, contur: C.linie },
};

/**
 * Butonul unei acțiuni. `negru` = principala (pill-ul din 23), `galben` = o plată, `alb` = drumurile secundare
 * („Deschide", „Vezi site ↗"). `href` = link (deschis în browser dacă e în afara hub-ului).
 */
export function Buton(props: {
  children: JSX.Element;
  piele?: keyof typeof PIELE_BUTON;
  /** `submit` în formulare: Enter și clicul trimit formularul, fără cod în plus. */
  tip?: "button" | "submit";
  onClick?: () => void;
  href?: string;
  target?: string;
  dezactivat?: boolean;
  lat?: boolean;
  mic?: boolean;
}) {
  const piele = () => PIELE_BUTON[props.piele ?? "negru"];
  const stil = (): JSX.CSSProperties => ({
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    gap: "8px",
    width: props.lat ? "100%" : undefined,
    // Butonul mic = 11 / 16 cu text de 13, ca în 23b („Plătește", „Deschide", „Vezi site ↗").
    height: props.mic ? "38px" : "46px",
    padding: props.mic ? "0 16px" : "0 22px",
    "box-sizing": "border-box",
    "border-radius": "999px",
    border: `1px solid ${props.dezactivat ? "transparent" : piele().contur}`,
    background: props.dezactivat ? C.foaie : piele().bg,
    color: props.dezactivat ? C.slab : piele().text,
    "font-family": "inherit",
    "font-size": props.mic ? "13px" : "16px",
    "font-weight": 800,
    "white-space": "nowrap",
    "text-decoration": "none",
    cursor: props.dezactivat ? "default" : "pointer",
  });
  return (
    <Show
      when={props.href}
      fallback={
        <button
          type={props.tip ?? "button"}
          disabled={props.dezactivat}
          onClick={() => props.onClick?.()}
          style={stil()}
        >
          {props.children}
        </button>
      }
    >
      <a
        href={props.href}
        target={props.target}
        rel={props.target ? "noopener" : undefined}
        style={stil()}
        onClick={() => props.onClick?.()}
      >
        {props.children}
      </a>
    </Show>
  );
}

/** „Active | Istoric" (23b): pill negru pe fila deschisă, gri pe cealaltă. */
export function FileActivIstoric(props: {
  active: () => JSX.Element;
  istoric: () => JSX.Element;
}) {
  const [fila, setFila] = createSignal<"active" | "istoric">("active");
  const buton = (cheie: "active" | "istoric", text: string) => (
    <button
      type="button"
      onClick={() => setFila(cheie)}
      aria-pressed={fila() === cheie}
      style={{
        // 23b: 9 / 16, text gros de 13.
        height: "34px",
        padding: "0 16px",
        "border-radius": "999px",
        border: "0",
        background: fila() === cheie ? C.negru : C.foaie,
        color: fila() === cheie ? C.peNegru : C.stins,
        "font-family": "inherit",
        "font-size": "13px",
        "font-weight": 800,
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
  return (
    <>
      <div style={{ display: "flex", gap: "8px", "margin-bottom": "18px" }}>
        {buton("active", "Active")}
        {buton("istoric", "Istoric")}
      </div>
      <Show when={fila() === "active"} fallback={props.istoric()}>
        {props.active()}
      </Show>
    </>
  );
}

/**
 * Locul gol. `roz` = cardul din 23c („Încă nimic aici" + „Vezi site ↗"), unde golul e un îndemn, nu o lipsă; altfel
 * cardul gri. ⚠️ Fără chenarul punctat de dinainte: 23 l-a scos dinadins.
 */
export function StareGoala(props: {
  titlu: string;
  text: string;
  link?: { href: string; text: string };
  roz?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "flex-start",
        gap: "8px",
        padding: "28px",
        "border-radius": "24px",
        background: props.roz ? C.roz : C.foaie,
      }}
    >
      <p
        style={{
          ...DE_FONTE,
          margin: 0,
          color: C.text,
          "font-size": "26px",
          "line-height": "1.1",
        }}
      >
        {props.titlu}
      </p>
      <p
        style={{
          margin: 0,
          color: props.roz ? C.text : C.stins,
          "font-size": "16px",
          "line-height": "1.45",
          "max-width": "460px",
        }}
      >
        {props.text}
      </p>
      <Show when={props.link}>
        <div style={{ "margin-top": "8px" }}>
          <Buton piele="alb" href={props.link!.href} target="_blank">
            {props.link!.text}
          </Buton>
        </div>
      </Show>
    </div>
  );
}

export function Mesaj(props: {
  fel?: "eroare" | "info";
  children: JSX.Element;
}) {
  return (
    <p
      role={props.fel === "eroare" ? "alert" : undefined}
      style={{
        margin: "0 0 16px",
        padding: "12px 16px",
        "border-radius": "16px",
        background:
          props.fel === "eroare" ? "rgba(202,26,56,0.08)" : C.galbenDeschis,
        color: props.fel === "eroare" ? C.rosu : C.text,
        "font-size": "14px",
        "line-height": "1.45",
      }}
    >
      {props.children}
    </p>
  );
}

/** Rândul cu pictogramă + text mic (dată, loc), ca pe cardurile site-ului. */
export function RandInfo(props: { simbol: string; children: JSX.Element }) {
  return (
    <span
      style={{
        display: "inline-flex",
        "align-items": "center",
        gap: "6px",
        color: C.stins,
        "font-size": "14px",
      }}
    >
      <Symbol size={15}>{props.simbol}</Symbol>
      {props.children}
    </span>
  );
}

/**
 * Fereastra peste cont (23g: plata; cererea de anulare; QR-ul mărit). ⚠️ În `Portal`, pe `body`: pe telefon contul
 * stă într-un SlideDrawer mutat cu `transform`, iar un `position: fixed` dinăuntru s-ar fi poziționat față de drawer,
 * nu de ecran. Escape și clicul pe fundal o închid.
 */
export function Fereastra(props: {
  titlu: string;
  laInchidere: () => void;
  latime?: number;
  fundal?: string;
  children: JSX.Element;
}) {
  onMount(() => {
    const tasta = (e: KeyboardEvent) =>
      e.key === "Escape" && props.laInchidere();
    document.addEventListener("keydown", tasta);
    onCleanup(() => document.removeEventListener("keydown", tasta));
  });
  return (
    <Portal>
      <div
        onClick={() => props.laInchidere()}
        style={{
          position: "fixed",
          inset: 0,
          "z-index": 1000,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "16px",
          background: "rgba(10,10,11,0.45)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={props.titlu}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            "max-width": `${props.latime ?? 460}px`,
            "max-height": "calc(100vh - 32px)",
            "overflow-y": "auto",
            padding: "24px",
            "box-sizing": "border-box",
            "border-radius": "28px",
            background: props.fundal ?? C.fundal,
            color: C.text,
            "font-family": "Inter, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              gap: "12px",
              "margin-bottom": "16px",
            }}
          >
            <h2
              style={{
                ...DE_FONTE,
                margin: 0,
                "font-size": "26px",
                "line-height": "1.1",
              }}
            >
              {props.titlu}
            </h2>
            <button
              type="button"
              aria-label="Închide"
              onClick={() => props.laInchidere()}
              style={{
                width: "38px",
                height: "38px",
                "flex-shrink": 0,
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "999px",
                border: "0",
                background: C.foaie,
                color: C.text,
                cursor: "pointer",
              }}
            >
              <Symbol size={18}>close</Symbol>
            </button>
          </div>
          {props.children}
        </div>
      </div>
    </Portal>
  );
}

/* ── Formulare (Profil public, Date personale) ───────────────────────────────────────────── */

const stilCamp: JSX.CSSProperties = {
  width: "100%",
  height: "48px",
  padding: "0 16px",
  "box-sizing": "border-box",
  "border-radius": "14px",
  border: "1px solid transparent",
  // Alb: câmpurile stau mereu pe un card gri (`Sectiune`, formularul profilului), unde gri pe gri nu se vedea.
  background: C.fundal,
  color: C.text,
  outline: "none",
  "font-family": "inherit",
  // 16, nu mai puțin: sub 16 Safari pe iOS mărește pagina la fiecare câmp atins.
  "font-size": "16px",
};

export function Eticheta2(props: { children: JSX.Element }) {
  return (
    <span
      style={{
        display: "block",
        "margin-bottom": "6px",
        color: C.stins,
        "font-size": "12px",
        "font-weight": 700,
        "letter-spacing": "0.06em",
        "text-transform": "uppercase",
      }}
    >
      {props.children}
    </span>
  );
}

export function CampText(props: {
  eticheta: JSX.Element;
  valoare: string;
  laSchimbare: (v: string) => void;
  tip?: string;
  placeholder?: string;
  maxim?: number;
  autocomplete?: string;
  inputmode?: "numeric" | "tel" | "text" | "url";
  inainte?: string;
  randuri?: number;
  /** Pe pagina albă (23f): pastilă gri de 48, nu câmp alb pe cardul gri. */
  peAlb?: boolean;
}) {
  const stil = (): JSX.CSSProperties =>
    props.peAlb
      ? {
          ...stilCamp,
          background: C.foaie,
          "border-radius": "999px",
          padding: "0 18px",
        }
      : stilCamp;
  return (
    <label style={{ display: "block" }}>
      <Eticheta2>{props.eticheta}</Eticheta2>
      <Show
        when={props.inainte}
        fallback={
          <Show
            when={props.randuri}
            fallback={
              <input
                type={props.tip ?? "text"}
                value={props.valoare}
                placeholder={props.placeholder}
                maxLength={props.maxim}
                autocomplete={props.autocomplete}
                inputMode={props.inputmode}
                onInput={(e) => props.laSchimbare(e.currentTarget.value)}
                style={stil()}
              />
            }
          >
            <textarea
              rows={props.randuri}
              value={props.valoare}
              placeholder={props.placeholder}
              maxLength={props.maxim}
              onInput={(e) => props.laSchimbare(e.currentTarget.value)}
              style={{
                ...stil(),
                height: "auto",
                padding: props.peAlb ? "14px 18px" : "12px 16px",
                "border-radius": props.peAlb ? "24px" : "14px",
                resize: "none",
                "line-height": "1.45",
              }}
            />
          </Show>
        }
      >
        <div
          style={{
            ...stil(),
            display: "flex",
            "align-items": "center",
            gap: "2px",
          }}
        >
          <span style={{ color: C.slab }}>{props.inainte}</span>
          <input
            value={props.valoare}
            placeholder={props.placeholder}
            onInput={(e) => props.laSchimbare(e.currentTarget.value)}
            style={{
              "flex-grow": 1,
              "min-width": 0,
              height: "100%",
              border: "0",
              background: "transparent",
              color: C.text,
              outline: "none",
              "font-family": "inherit",
              "font-size": "16px",
            }}
          />
        </div>
      </Show>
    </label>
  );
}

export function CampAlege(props: {
  eticheta: JSX.Element;
  valoare: string;
  laSchimbare: (v: string) => void;
  optiuni: readonly (string | { valoare: string; text: string })[];
  gol?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <Eticheta2>{props.eticheta}</Eticheta2>
      <select
        value={props.valoare}
        onChange={(e) => props.laSchimbare(e.currentTarget.value)}
        style={{ ...stilCamp, "color-scheme": "light" }}
      >
        <Show when={props.gol}>
          <option value="">{props.gol}</option>
        </Show>
        <For
          each={props.optiuni as (string | { valoare: string; text: string })[]}
        >
          {(o) =>
            typeof o === "string" ? (
              <option value={o}>{o}</option>
            ) : (
              <option value={o.valoare}>{o.text}</option>
            )
          }
        </For>
      </select>
    </label>
  );
}

/** Cardul unei secțiuni (Date personale, Facturare): titlu mic sus, acțiune în dreapta (Editează / Anulează). */
export function Sectiune(props: {
  titlu: string;
  actiune?: { text: string; laApasare: () => void };
  pericol?: boolean;
  children: JSX.Element;
}) {
  return (
    <div
      style={{
        "border-radius": "24px",
        background: C.foaie,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
          padding: "18px 22px 0",
        }}
      >
        <Eticheta culoare={props.pericol ? C.rosu : undefined}>
          {props.titlu}
        </Eticheta>
        <Show when={props.actiune}>
          <button
            type="button"
            onClick={() => props.actiune!.laApasare()}
            style={{
              border: "0",
              background: "transparent",
              color: C.text,
              "font-family": "inherit",
              "font-size": "14px",
              "font-weight": 700,
              "text-decoration": "underline",
              cursor: "pointer",
            }}
          >
            {props.actiune!.text}
          </button>
        </Show>
      </div>
      <div style={{ padding: "14px 22px 20px" }}>{props.children}</div>
    </div>
  );
}

/** Rând „etichetă ... valoare" din cardurile de citit (Date personale, Date cont). */
export function RandValoare(props: {
  eticheta: string;
  children: JSX.Element;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "16px",
        padding: "10px 0",
        "border-top": `1px solid ${C.linie}`,
      }}
    >
      <span style={{ color: C.stins, "font-size": "14px", "flex-shrink": 0 }}>
        {props.eticheta}
      </span>
      <span
        style={{
          color: C.text,
          "font-size": "14px",
          "text-align": "right",
          "min-width": 0,
          "overflow-wrap": "anywhere",
        }}
      >
        {props.children}
      </span>
    </div>
  );
}

export function MesajSalvare(props: {
  stare: { tip: "ok" | "err"; text: string } | null;
}) {
  return (
    <Show when={props.stare}>
      <span
        role={props.stare!.tip === "err" ? "alert" : "status"}
        style={{
          color: props.stare!.tip === "ok" ? C.verde : C.rosu,
          "font-size": "14px",
        }}
      >
        {props.stare!.text}
      </span>
    </Show>
  );
}

/** Se încarcă… (aceeași frază peste tot în cont). */
export function Incarcare() {
  return (
    <p style={{ color: C.stins, "font-size": "14px", margin: "8px 0" }}>
      Se încarcă…
    </p>
  );
}
