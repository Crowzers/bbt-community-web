import { type JSX, Show, createEffect, on } from "solid-js";

import { type CheieInel, useInelOm } from "./nivele";

/**
 * Inelul de nivel din jurul pozei. Design: `website/docs/plans/2026-11-18-inel-nivel-design.md` (§3 geometria,
 * §4 animația). O singură componentă, folosită peste tot unde apare poza unui om: lista de membri, autorii din
 * chat, pastila de răspunsuri, mini-profilul.
 *
 * 🔴 CADRU FIX (decizia 5): cutia are latura `S = poza × 1,5` la TOATE nivelele, și la Beginner, și la omul fără
 * cont BBT. Poza rămâne cât era (2/3 din cutie), în același loc; nivelul doar umple banda din jur. Varianta
 * respinsă, inelul care crește în afara pozei, strica trei lucruri: rândurile din listă nu se mai aliniau, decorul
 * se tăia în cutiile cu `overflow:hidden` și se suprapunea în stivele de avatare.
 *
 * 🔴 INELUL SUBȚIRE, varianta B (19 nov 2026): userul a văzut pe iPhone, pe site, că inelul de dinainte era „mult
 * prea gros” și trecea peste creionul de schimbat poza și peste nume. De atunci:
 * - inelul interior are un plafon legat de poză (`P/32`, cel puțin 2,5 px): 3 px la poza de 96; în listele mici
 *   rămâne cât era, fiindcă acolo grosimea pe nivel e oricum sub plafon;
 * - linia punctată și scânteile stau DOAR în jumătatea de sus (arc de la ora 9 peste vârf la ora 3), lipite de
 *   inel (raza `R2`), nu la marginea cutiei;
 * - sub poză, nimic din decor nu coboară mai jos de `R2 + 2` față de centru (jos e numele).
 * Aceeași geometrie pe site (`website/src/components/InelNivel.tsx`) și în aplicație. Cutia și locul pozei NU s-au
 * schimbat.
 *
 * 🔴 FĂRĂ LINIA PUNCTATĂ ȘI FĂRĂ SCÂNTEI (tot 19 nov, mai târziu): userul, „scoatem efectele în exces, mai exact liniile
 * punctate și steluțele”. Rămân inelul, gradientul care se rotește, lumina, aura și orbita. Iar în mini-profil inelul
 * merge ÎN BUCLĂ („animat non stop, acum se oprește la un moment dat”). La fel pe site și în aplicație.
 *
 * Totul e calculat în px din poză și din S (SVG-urile au viewBox-ul cât cutia), deci aceeași componentă merge de la
 * 33 la 96 px.
 *
 * Două feluri de a-i face loc cutiei, ca în aplicație:
 * - ÎN layout (implicit): cutia ocupă S × S. Lista de membri și mini-profilul, unde rândul și-a putut face loc.
 * - PESTE margini (`peste`): în layout stă doar poza, exact cât și unde era; cutia se desenează deasupra, centrată pe
 *   poză, fără să împingă nimic. Chatul, conversațiile, reacțiile, căutarea, mențiunile: acolo textul de lângă poză
 *   nu trebuie să se mute deloc (cererea din 18 nov, după aplicație: prima variantă din hub lărgea coloana
 *   avatarului din chat cu 10 px și muta tot textul mesajelor).
 *
 * Tot decorul stă SUB poză (cadrul e primul în DOM, poza vine după, `position: relative`) și are
 * `pointer-events: none`: un buton pus peste poză rămâne deasupra lui, și ca desen, și ca atingere.
 */

/** Sub atât, discul de sub inel e mai subțire (vezi `razaDisc`). */
const PRAG_DECOR = 48;

const DE_LA_POZA = 0.03; // distanța poză ↔ inel interior și inel interior ↔ aură/orbită, din S
type Stil = {
  /** Grosimea inelului interior, din S (plafonată de poză, vezi `grosime`). */
  g: number;
  /** Fundalul inelului: o culoare plină sau un `conic-gradient`. */
  inel: string;
  conic?: boolean;
  /** Animația (§4): lumina, în secunde pe tură. */
  tLumina: number;
  /** Câte ture ÎNTREGI face gradientul în cele 5 s (vezi `inel.css`: totul se termină cum a pornit). */
  tureGradient?: number;
  aura?: string;
  orbita?: boolean;
};

const conic = (...culori: string[]) => `conic-gradient(${culori.join(", ")})`;

/**
 * Tabelul din §3. ⚠️ Designul dădea fiecărei trepte și un al doilea semn pe lângă culoare (grosime, linia punctată,
 * număr de scântei), pentru daltoniști (WCAG 1.4.1). Linia și scânteile au ieșit pe 19 nov, la cererea userului:
 * acum treptele se deosebesc prin culoare, gradient, aură și orbită.
 */
const STILURI: Record<Exclude<CheieInel, "beginner">, Stil> = {
  creator: { g: 0.035, inel: "#4DA2FF", tLumina: 3.6 },
  producer: { g: 0.045, inel: "#5C4ADE", tLumina: 2.8 },
  professional: {
    g: 0.05,
    inel: "#FFA8CD",
    tLumina: 2.4,
  },
  elite: {
    g: 0.055,
    inel: conic("#FB4903", "#FFB38A", "#FB4903", "#C93A02", "#FB4903"),
    conic: true,
    tLumina: 2,
    tureGradient: 1,
  },
  legend: {
    g: 0.06,
    inel: conic("#CA1A38", "#FB4903", "#CA1A38", "#8E1027", "#CA1A38"),
    conic: true,
    tLumina: 1.6,
    tureGradient: 1,
    aura: "#CA1A38",
  },
  icon: {
    g: 0.065,
    inel: conic(
      "#FFD731",
      "#FFF4B8",
      "#E5B300",
      "#FFE680",
      "#C99A00",
      "#FFD731",
    ),
    conic: true,
    tLumina: 1.2,
    tureGradient: 2,
    aura: "#FFD731",
    // Fără bila care se rotește pe lângă inel, nici la Icon (22 nov 2026, userul: „ți-am zis să ștergi bila aia”). Codul orbitei
    // rămâne pentru cine o vrea înapoi; acum niciun nivel n-o mai pornește. La fel pe site și în aplicație.
    orbita: false,
  },
  // Echipa BBT: toată paleta, în afara scării (decizia 8).
  echipa: {
    g: 0.06,
    inel: conic(
      "#4DA2FF",
      "#5C4ADE",
      "#FFA8CD",
      "#FB4903",
      "#CA1A38",
      "#FFD731",
      "#4DA2FF",
    ),
    conic: true,
    tLumina: 2,
    tureGradient: 1,
    aura: "#FFA8CD",
    // Fără bila care se rotea pe lângă inel (22 nov 2026, userul: „e frumos cercul, dar e un punct care se învârte odată cu el
    // în exterior și nu are niciun sens”). La fel pe site, în aplicație și în hub.
    orbita: false,
  },
};

/** Inelul ca mască radială, în px: plin între `r1` și `r2`, transparent în rest (jumătate de pixel moale la margini). */
function mascaInel(r1: number, r2: number) {
  const m = `radial-gradient(circle closest-side, transparent ${r1 - 0.5}px, #000 ${r1}px, #000 ${r2}px, transparent ${r2 + 0.5}px)`;
  return { "-webkit-mask-image": m, "mask-image": m };
}

const miscareRedusa = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export type PropsInel = {
  /** `undefined`/`null` = fără inel (Beginner, fără cont BBT, profil privat, bot): banda rămâne goală. */
  cheie: CheieInel | null | undefined;
  /** Diametrul pozei, în px. Cutia are `poza × 1,5`. */
  poza: number;
  /**
   * DOAR în mini-profil: animația pornește la deschidere și merge în buclă (19 nov 2026, cerut de user); atingerea
   * pozei o ia de la capăt. În liste rămâne `false`: nicio mișcare acolo (decizia 2).
   */
  animat?: boolean;
  /** Culoarea discului de sub inel (`disc`). Implicit albul foii. */
  fundal?: string;
  /**
   * Un disc în culoarea fundalului sub inelul interior. Pentru poza pusă peste o copertă (mini-profilul): fără el,
   * inelul ar sta pe fotografia altcuiva și și-ar pierde culoarea. Ia locul bordurii albe de dinainte (4 px pe
   * copertă, 2 px în stiva din pastila de răspunsuri), care acum ar fi acoperit chiar inelul.
   */
  disc?: boolean;
  /**
   * Cutia PESTE margini, nu în layout (vezi sus): rândul păstrează locul pozei, iar inelul se desenează peste aerul
   * din jur. ⚠️ Un părinte cu `overflow:hidden` prea strâns l-ar tăia: verifică locul când îl folosești.
   */
  peste?: boolean;
  /** Pentru listele din componentele web Stoat (`<ListItem>`), unde poza stă într-un `slot`. */
  slot?: string;
  class?: string;
  style?: JSX.CSSProperties;
  /** Poza (`Avatar`, `AvatarOm`), la mărimea `poza`. */
  children: JSX.Element;
};

export function InelNivel(props: PropsInel) {
  let radacina!: HTMLSpanElement;
  const S = () => Math.round(props.poza * 1.5);
  const stil = () =>
    props.cheie && props.cheie !== "beginner"
      ? STILURI[props.cheie]
      : undefined;
  const mare = () => S() >= PRAG_DECOR;
  const fundal = () => props.fundal ?? "#FFFFFF";
  const c = () => S() / 2; // centrul cutiei (și al pozei), în px

  // Geometria, în px. `gap` e și între poză și inel, și între inel și aură/orbită.
  const gap = () => S() * DE_LA_POZA;
  /**
   * Grosimea inelului interior: cea pe nivel (cel puțin 1,5 px), dar nu peste `P/32` (cel puțin 2,5 px). Plafonul
   * vine din 19 nov: la poza mare, `S × g` dădea 9 px la Icon și inelul acoperea creionul și numele.
   */
  const grosime = () => {
    const s = stil();
    if (!s) return 0;
    return Math.min(Math.max(2.5, props.poza / 32), Math.max(1.5, S() * s.g));
  };
  const r1 = () => props.poza / 2 + gap();
  const r2 = () => r1() + grosime();
  /** Raza aurei și a orbitei (≈59,6 la poza de 96): încă un `gap` dincolo de inel. */
  const R2 = () => r2() + gap();

  // Discul: puțin peste inel; fără inel, cât vechea bordură albă (4 px pe poza mare, 2 px în stivele mici).
  const razaDisc = () =>
    stil() ? r2() + (mare() ? 2 : 1) : props.poza / 2 + (mare() ? 4 : 2);

  function reda() {
    const s = stil();
    if (!props.animat || !s || miscareRedusa()) return;
    // Repornirea unei animații CSS: scoți atributul, forțezi o așezare, îl pui la loc.
    radacina.removeAttribute("data-anim");
    void radacina.offsetWidth;
    // Atributul RĂMÂNE: animațiile din `inel.css` sunt `infinite` (19 nov 2026, în buclă la cererea userului).
    radacina.setAttribute("data-anim", "");
  }

  // La deschidere (și când cheia sosește după ea). O cheie neschimbată nu repornește nimic.
  createEffect(
    on(
      () => props.cheie,
      (cheie, inainte) => {
        if (props.animat && cheie && cheie !== inainte) queueMicrotask(reda);
      },
    ),
  );

  // Câte ture întregi de lumină încap în 5 s (§4); cel puțin una.
  const tureLumina = () => Math.max(1, Math.floor(5 / (stil()?.tLumina ?? 5)));

  return (
    <span
      ref={radacina}
      slot={props.slot}
      class={`bbt-inel${props.class ? ` ${props.class}` : ""}`}
      onClick={() => props.animat && reda()}
      style={{
        width: `${props.peste ? props.poza : S()}px`,
        height: `${props.peste ? props.poza : S()}px`,
        "--t-lumina": `${stil()?.tLumina ?? 1}s`,
        "--n-lumina": String(tureLumina()),
        ...props.style,
      }}
    >
      {/* Cadrul S × S, centrat pe poză. În layout, cât rădăcina; `peste`, mai mare decât ea, deasupra marginilor. */}
      <span
        class="bbt-inel-cadru"
        style={{ width: `${S()}px`, height: `${S()}px` }}
      >
        <Show when={props.animat && stil()?.aura}>
          {(culoare) => (
            <span
              class="bbt-inel-strat bbt-inel-aura"
              style={{
                // Aura se oprește la `R2 + 2` (19 nov): umbra de dinainte (box-shadow peste toată cutia) cobora
                // peste nume. Gradientul e transparent până la 72%, culoarea la ~55% pe 88%, stins la margine.
                // Centrată din `left`/`top`, nu cu `translate`: `transform` e al animației (respirația, `inel.css`).
                inset: "auto",
                left: `${c() - R2() - 2}px`,
                top: `${c() - R2() - 2}px`,
                width: `${2 * (R2() + 2)}px`,
                height: `${2 * (R2() + 2)}px`,
                background: `radial-gradient(circle closest-side, transparent 72%, ${culoare()}8C 88%, transparent 100%)`,
              }}
            />
          )}
        </Show>

        <Show when={props.disc}>
          <span
            class="bbt-inel-strat"
            style={{
              inset: "auto",
              left: "50%",
              top: "50%",
              width: `${2 * razaDisc()}px`,
              height: `${2 * razaDisc()}px`,
              transform: "translate(-50%, -50%)",
              background: fundal(),
            }}
          />
        </Show>

        <Show when={stil()}>
          {(s) => (
            <>
              <span
                class={`bbt-inel-strat${s().conic ? " bbt-inel-gradient" : ""}`}
                style={{
                  background: s().inel,
                  ...mascaInel(r1(), r2()),
                  "--rot": `${360 * (s().tureGradient ?? 1)}deg`,
                }}
              />
              <Show when={props.animat}>
                <span
                  class="bbt-inel-strat bbt-inel-lumina"
                  style={{
                    // Un arc alb de ~50° care aleargă pe inelul interior, cu coada stinsă.
                    background:
                      "conic-gradient(rgba(255,255,255,0) 0deg 300deg, rgba(255,255,255,.95) 350deg, rgba(255,255,255,0) 360deg)",
                    ...mascaInel(r1(), r2()),
                  }}
                />
              </Show>

              <Show when={props.animat && s().orbita}>
                <span class="bbt-inel-strat bbt-inel-orbita">
                  {/* Luminița pe orbită (Icon, Echipa), pe R2, nu mai departe (19 nov): pe tura de jos ar fi
                    trecut peste nume. */}
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: `${c() - R2()}px`,
                      width: `${S() * 0.05}px`,
                      height: `${S() * 0.05}px`,
                      transform: "translate(-50%, -50%)",
                      "border-radius": "50%",
                      background: "#FFFFFF",
                      // Haloul în culoarea aurei, ca pe site (până pe 19 nov era culoarea liniei punctate, scoase).
                      "box-shadow": `0 0 ${S() * 0.03}px ${S() * 0.01}px ${s().aura ?? "#FFFFFF"}`,
                    }}
                  />
                </span>
              </Show>
            </>
          )}
        </Show>
      </span>

      {/* Poza, deasupra straturilor: în fluxul cutiei, centrată de flex. */}
      <span
        style={{
          position: "relative",
          display: "flex",
          width: `${props.poza}px`,
          height: `${props.poza}px`,
          "border-radius": "50%",
        }}
      >
        {props.children}
      </span>
    </span>
  );
}

/**
 * Inelul unui om după id-ul lui Stoat, din depozitul de liste (`nivele.ts`, cererea pe loturi spre admin).
 * Static: în liste nu se mișcă nimic.
 */
export function InelOm(
  props: Omit<PropsInel, "cheie" | "animat"> & { id: string | undefined },
) {
  const cheie = useInelOm(() => props.id);
  return (
    <InelNivel
      cheie={cheie()}
      poza={props.poza}
      fundal={props.fundal}
      disc={props.disc}
      peste={props.peste}
      slot={props.slot}
      class={props.class}
      style={props.style}
    >
      {props.children}
    </InelNivel>
  );
}
