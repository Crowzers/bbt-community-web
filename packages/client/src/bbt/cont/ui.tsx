import { For, JSX, Show, createSignal } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * BBT: piesele comune ale contului din hub.
 *
 * Paleta e a hub-ului (întunecată, `tema.ts`), nu a site-ului: contul trebuie să arate ca restul
 * aplicației, nu ca o pagină de site lipită înăuntru. Regulile de culoare ale site-ului rămân:
 * roz = acțiune (text NEGRU pe el, alb ar da 1,6:1), culoarea teritoriului = UNDE ești (eticheta
 * taberei, a workshopului, a cursului), niciodată un buton.
 */

export const C = {
  fundal: "#0D0D0D",
  foaie: "#141414",
  foaieTare: "#1B1B1B",
  linie: "rgba(255,255,255,0.08)",
  text: "#fff",
  stins: "rgba(255,255,255,0.6)",
  slab: "rgba(255,255,255,0.4)",
  roz: "#FFA8CD",
  rozIntens: "#B85C86",
  verde: "#5BD08A",
  chihlimbar: "#E0A854",
  rosu: "#FF8A80",
  camps: "#FFD731",
  workshops: "#FB4903",
  cursuri: "#5C4ADE",
};

export function TitluPagina(props: { children: JSX.Element }) {
  return (
    <h1
      style={{
        margin: "0 0 20px",
        "font-size": "22px",
        "font-weight": 700,
        color: C.text,
      }}
    >
      {props.children}
    </h1>
  );
}

export function Card(props: {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}) {
  return (
    <div
      style={{
        "border-radius": "16px",
        border: `1px solid ${C.linie}`,
        background: C.foaie,
        overflow: "hidden",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

/** Eticheta mică, majuscule, în culoarea teritoriului (ca pe site, `text-[12px] uppercase`). */
export function Eticheta(props: { culoare?: string; children: JSX.Element }) {
  return (
    <span
      style={{
        "font-size": "11px",
        "font-weight": 700,
        "letter-spacing": "0.12em",
        "text-transform": "uppercase",
        color: props.culoare ?? C.stins,
      }}
    >
      {props.children}
    </span>
  );
}

const CULORI_PASTILA = {
  ok: { bg: "rgba(91,208,138,0.12)", text: C.verde },
  asteapta: { bg: "rgba(224,168,84,0.14)", text: C.chihlimbar },
  neutru: { bg: "rgba(255,255,255,0.06)", text: C.stins },
};

export function Pastila(props: {
  fel: "ok" | "asteapta" | "neutru";
  children: JSX.Element;
}) {
  const culori = () => CULORI_PASTILA[props.fel];
  return (
    <span
      style={{
        display: "inline-flex",
        "align-items": "center",
        gap: "4px",
        padding: "3px 10px",
        "border-radius": "999px",
        background: culori().bg,
        color: culori().text,
        "font-size": "12px",
        "font-weight": 600,
        "white-space": "nowrap",
      }}
    >
      {props.children}
    </span>
  );
}

/** Buton principal: roz, text negru. `href` = link (deschis în browser dacă e în afara hub-ului). */
export function ButonRoz(props: {
  children: JSX.Element;
  /** `submit` în formulare: Enter și clicul trimit formularul, fără cod în plus. */
  tip?: "button" | "submit";
  onClick?: () => void;
  href?: string;
  target?: string;
  dezactivat?: boolean;
  lat?: boolean;
}) {
  const stil = (): JSX.CSSProperties => ({
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    gap: "8px",
    width: props.lat ? "100%" : undefined,
    height: "42px",
    padding: "0 18px",
    "box-sizing": "border-box",
    "border-radius": "999px",
    border: "0",
    background: props.dezactivat ? "rgba(255,255,255,0.12)" : C.roz,
    color: props.dezactivat ? C.slab : "#000",
    "font-family": "inherit",
    "font-size": "14px",
    "font-weight": 700,
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

/** Buton secundar (contur), pentru drumuri care nu sunt acțiunea principală a ecranului. */
export function ButonContur(props: {
  children: JSX.Element;
  onClick?: () => void;
  href?: string;
  target?: string;
}) {
  const stil: JSX.CSSProperties = {
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    gap: "8px",
    height: "40px",
    padding: "0 16px",
    "box-sizing": "border-box",
    "border-radius": "999px",
    border: `1px solid ${C.linie}`,
    background: "transparent",
    color: C.text,
    "font-family": "inherit",
    "font-size": "13.5px",
    "font-weight": 600,
    "text-decoration": "none",
    cursor: "pointer",
  };
  return (
    <Show
      when={props.href}
      fallback={
        <button type="button" onClick={() => props.onClick?.()} style={stil}>
          {props.children}
        </button>
      }
    >
      <a
        href={props.href}
        target={props.target}
        rel={props.target ? "noopener" : undefined}
        style={stil}
      >
        {props.children}
      </a>
    </Show>
  );
}

/** „Active | Istoric", ca `InscrieriTabs` de pe site. */
export function FileActivIstoric(props: {
  active: () => JSX.Element;
  istoric: () => JSX.Element;
  nrActive: number;
}) {
  const [fila, setFila] = createSignal<"active" | "istoric">("active");
  const buton = (cheie: "active" | "istoric", text: string) => (
    <button
      type="button"
      onClick={() => setFila(cheie)}
      aria-pressed={fila() === cheie}
      style={{
        height: "34px",
        padding: "0 14px",
        "border-radius": "999px",
        border: `1px solid ${fila() === cheie ? "transparent" : C.linie}`,
        background: fila() === cheie ? "rgba(255,255,255,0.1)" : "transparent",
        color: fila() === cheie ? C.text : C.stins,
        "font-family": "inherit",
        "font-size": "13px",
        "font-weight": 600,
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
  return (
    <>
      <div style={{ display: "flex", gap: "8px", "margin-bottom": "16px" }}>
        {buton(
          "active",
          props.nrActive ? `Active (${props.nrActive})` : "Active",
        )}
        {buton("istoric", "Istoric")}
      </div>
      <Show when={fila() === "active"} fallback={props.istoric()}>
        {props.active()}
      </Show>
    </>
  );
}

export function StareGoala(props: {
  simbol: string;
  titlu: string;
  text: string;
  link?: { href: string; text: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "8px",
        padding: "40px 24px",
        "border-radius": "16px",
        border: `2px dashed ${C.linie}`,
        "text-align": "center",
      }}
    >
      <span style={{ color: C.slab, display: "flex" }}>
        <Symbol size={26}>{props.simbol}</Symbol>
      </span>
      <p
        style={{
          margin: 0,
          color: C.text,
          "font-weight": 600,
          "font-size": "14px",
        }}
      >
        {props.titlu}
      </p>
      <p style={{ margin: 0, color: C.stins, "font-size": "13px" }}>
        {props.text}
      </p>
      <Show when={props.link}>
        <a
          href={props.link!.href}
          target="_blank"
          rel="noopener"
          style={{
            "margin-top": "6px",
            color: C.text,
            "font-size": "13px",
            "font-weight": 600,
          }}
        >
          {props.link!.text}
        </a>
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
        padding: "12px 14px",
        "border-radius": "12px",
        background:
          props.fel === "eroare"
            ? "rgba(255,138,128,0.1)"
            : "rgba(224,168,84,0.1)",
        color: props.fel === "eroare" ? C.rosu : C.chihlimbar,
        "font-size": "13.5px",
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
        "font-size": "13px",
      }}
    >
      <Symbol size={14}>{props.simbol}</Symbol>
      {props.children}
    </span>
  );
}

/* ── Formulare (Setări cont) ─────────────────────────────────────────────────────────────── */

const stilCamp: JSX.CSSProperties = {
  width: "100%",
  height: "44px",
  padding: "0 12px",
  "box-sizing": "border-box",
  "border-radius": "10px",
  border: `1px solid ${C.linie}`,
  background: "#0D0D0D",
  color: C.text,
  outline: "none",
  "font-family": "inherit",
  "font-size": "14.5px",
};

export function Eticheta2(props: { children: JSX.Element }) {
  return (
    <span
      style={{
        display: "block",
        "margin-bottom": "6px",
        color: C.stins,
        "font-size": "12.5px",
        "font-weight": 600,
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
  inputmode?: "numeric" | "tel" | "text";
  inainte?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <Eticheta2>{props.eticheta}</Eticheta2>
      <Show
        when={props.inainte}
        fallback={
          <input
            type={props.tip ?? "text"}
            value={props.valoare}
            placeholder={props.placeholder}
            maxLength={props.maxim}
            autocomplete={props.autocomplete}
            inputMode={props.inputmode}
            onInput={(e) => props.laSchimbare(e.currentTarget.value)}
            style={stilCamp}
          />
        }
      >
        <div
          style={{
            ...stilCamp,
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
              "font-size": "14.5px",
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
        style={{ ...stilCamp, "color-scheme": "dark" }}
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

/** Cardul unei secțiuni din Setări: titlu mic sus, acțiune în dreapta (Editează / Anulează). */
export function Sectiune(props: {
  titlu: string;
  actiune?: { text: string; laApasare: () => void };
  pericol?: boolean;
  children: JSX.Element;
}) {
  return (
    <div
      style={{
        "border-radius": "16px",
        border: `1px solid ${props.pericol ? "rgba(229,72,77,0.35)" : C.linie}`,
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
          padding: "14px 18px",
          "border-bottom": `1px solid ${C.linie}`,
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
              color: C.stins,
              "font-family": "inherit",
              "font-size": "13px",
              "font-weight": 600,
              cursor: "pointer",
            }}
          >
            {props.actiune!.text}
          </button>
        </Show>
      </div>
      <div style={{ padding: "16px 18px" }}>{props.children}</div>
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
        padding: "9px 0",
        "border-top": `1px solid ${C.linie}`,
      }}
    >
      <span style={{ color: C.stins, "font-size": "13px", "flex-shrink": 0 }}>
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
          "font-size": "13px",
        }}
      >
        {props.stare!.text}
      </span>
    </Show>
  );
}
