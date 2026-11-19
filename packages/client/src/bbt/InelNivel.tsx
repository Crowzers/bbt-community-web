import { type JSX, For, Show, createEffect, on, onCleanup } from "solid-js";

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

/** Sub atât, doar inelul interior: punctatul și scânteile ar fi fost un pixel de zgomot (§3). */
const PRAG_DECOR = 48;

const DE_LA_POZA = 0.03; // distanța poză ↔ inel interior și inel interior ↔ punctat, din S
/** Latura scânteii, din S (≈14 px la poza de 96). Din 19 nov, cam la jumătate: cele mari acopereau numele. */
const SCANTEIE = 0.097;
/** Liniuța și pauza punctatului, din R2 (≈5 și 3 px la poza de 96). */
const LINIUTA = 0.084;
const PAUZA = 0.05;
/**
 * Unde stau scânteile, în grade: 0 = ora 3, negativ = în sus. Doar pe arcul de sus, ca punctatul: jos ar fi stat
 * peste nume (motivul variantei B, 19 nov).
 */
const UNGHIURI_SCANTEI: Record<number, number[]> = {
  2: [-140, -40],
  3: [-150, -90, -30],
};

type Stil = {
  /** Grosimea inelului interior, din S (plafonată de poză, vezi `grosime`). */
  g: number;
  /** Fundalul inelului: o culoare plină sau un `conic-gradient`. */
  inel: string;
  conic?: boolean;
  /** Culoarea liniei punctate de sus (Professional+). */
  exterior?: string;
  /** Culoarea fiecărei scântei, în ordine; câte sunt alege și unghiurile (`UNGHIURI_SCANTEI`). */
  scantei?: string[];
  /** Animația (§4): lumina, în secunde pe tură. */
  tLumina: number;
  /** Câte ture ÎNTREGI face gradientul în cele 5 s (vezi `inel.css`: totul se termină cum a pornit). */
  tureGradient?: number;
  aura?: string;
  orbita?: boolean;
};

const conic = (...culori: string[]) => `conic-gradient(${culori.join(", ")})`;

/**
 * Tabelul din §3. ⚠️ Pe lângă culoare, fiecare treaptă are și un al doilea semn (grosime, linia punctată, număr de
 * scântei), pentru daltoniști (WCAG 1.4.1): albastru/mov și portocaliu/roșu se confundă. Nu scoate semnele
 * „ca să fie mai curat".
 */
const STILURI: Record<Exclude<CheieInel, "beginner">, Stil> = {
  creator: { g: 0.035, inel: "#4DA2FF", tLumina: 3.6 },
  producer: { g: 0.045, inel: "#5C4ADE", tLumina: 2.8 },
  professional: {
    g: 0.05,
    inel: "#FFA8CD",
    exterior: "#FFA8CD",
    tLumina: 2.4,
  },
  elite: {
    g: 0.055,
    inel: conic("#FB4903", "#FFB38A", "#FB4903", "#C93A02", "#FB4903"),
    conic: true,
    exterior: "#FB4903",
    scantei: ["#FB4903", "#FB4903"],
    tLumina: 2,
    tureGradient: 1,
  },
  legend: {
    g: 0.06,
    inel: conic("#CA1A38", "#FB4903", "#CA1A38", "#8E1027", "#CA1A38"),
    conic: true,
    exterior: "#CA1A38",
    scantei: ["#CA1A38", "#CA1A38", "#CA1A38"],
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
    exterior: "#E5B300",
    scantei: ["#E5B300", "#E5B300", "#E5B300"],
    tLumina: 1.2,
    tureGradient: 2,
    aura: "#FFD731",
    orbita: true,
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
    exterior: "#FFA8CD",
    scantei: ["#5C4ADE", "#FB4903"],
    tLumina: 2,
    tureGradient: 1,
    aura: "#FFA8CD",
    orbita: true,
  },
};

/** Steaua cu 4 colțuri, în viewBox 20. */
const STEA =
  "M10 0C10.9 6.6 13.4 9.1 20 10C13.4 10.9 10.9 13.4 10 20C9.1 13.4 6.6 10.9 0 10C6.6 9.1 9.1 6.6 10 0Z";

/** Inelul ca mască radială, în px: plin între `r1` și `r2`, transparent în rest (jumătate de pixel moale la margini). */
function mascaInel(r1: number, r2: number) {
  const m = `radial-gradient(circle closest-side, transparent ${r1 - 0.5}px, #000 ${r1}px, #000 ${r2}px, transparent ${r2 + 0.5}px)`;
  return { "-webkit-mask-image": m, "mask-image": m };
}

/**
 * Câți pași ÎNTREGI (liniuță + pauză) alunecă liniuțele pe arc în cele 5 s: tiparul se termină exact cum a pornit,
 * deci listele (statice) și mini-profilul (după animație) arată la fel. Până pe 19 nov se rotea tot cercul; cu linia
 * doar sus, rotirea ar fi dus-o pe jos, peste nume, de-aia acum alunecă liniuțele (`stroke-dashoffset`) și arcul stă
 * pe loc. 10 pași la toate nivelele, ca pe site și în aplicație (nivelul se vede din culoare și scântei, nu din viteză).
 */
const PASI_PUNCTAT = 10;

const miscareRedusa = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export type PropsInel = {
  /** `undefined`/`null` = fără inel (Beginner, fără cont BBT, profil privat, bot): banda rămâne goală. */
  cheie: CheieInel | null | undefined;
  /** Diametrul pozei, în px. Cutia are `poza × 1,5`. */
  poza: number;
  /**
   * DOAR în mini-profil: animația pornește o dată la deschidere și încă o dată la atingerea pozei (§4). În liste
   * rămâne `false`: nicio mișcare acolo (decizia 2).
   */
  animat?: boolean;
  /** Culoarea de sub inel: conturul scânteilor, ca steaua să se desprindă de inel. Implicit albul foii. */
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
  const decor = () => S() >= PRAG_DECOR;
  const fundal = () => props.fundal ?? "#FFFFFF";
  const c = () => S() / 2; // centrul cutiei (și al pozei), în px

  // Geometria, în px. `gap` e și între poză și inel, și între inel și linia punctată.
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
  /** Raza liniei punctate, pe mijlocul ei (≈59,6 la poza de 96). Scânteile și orbita stau tot pe ea. */
  const R2 = () => r2() + gap();
  const grosimePunctat = () => Math.min(2, Math.max(1, S() * 0.0105));
  const pasPunctat = () => R2() * (LINIUTA + PAUZA);
  /** Arcul de sus: de la ora 9, în sensul acelor (sweep 1), peste vârf, la ora 3. */
  const arcSus = () =>
    `M ${c() - R2()} ${c()} A ${R2()} ${R2()} 0 0 1 ${c() + R2()} ${c()}`;

  // Discul: puțin peste inel; fără inel, cât vechea bordură albă (4 px pe poza mare, 2 px în stivele mici).
  const razaDisc = () =>
    stil() ? r2() + (decor() ? 2 : 1) : props.poza / 2 + (decor() ? 4 : 2);

  let opreste: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(opreste));

  function reda() {
    const s = stil();
    if (!props.animat || !s || miscareRedusa()) return;
    // Repornirea unei animații CSS: scoți atributul, forțezi o așezare, îl pui la loc.
    radacina.removeAttribute("data-anim");
    void radacina.offsetWidth;
    radacina.setAttribute("data-anim", "");
    clearTimeout(opreste);
    // Ultima mișcare (scânteile decalate) se termină pe la 4,75 s; după, atributul pleacă și totul e repaus.
    opreste = setTimeout(() => radacina.removeAttribute("data-anim"), 6000);
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

              <Show when={decor() && s().exterior}>
                <svg
                  class="bbt-inel-strat"
                  viewBox={`0 0 ${S()} ${S()}`}
                  width={S()}
                  height={S()}
                  style={{ overflow: "visible" }}
                >
                  {/* Doar arcul de sus (varianta B, 19 nov): cercul întreg trecea pe sub poză, peste nume. */}
                  <path
                    class="bbt-inel-exterior"
                    d={arcSus()}
                    fill="none"
                    stroke={s().exterior}
                    stroke-width={grosimePunctat()}
                    stroke-dasharray={`${R2() * LINIUTA} ${R2() * PAUZA}`}
                    style={{
                      "--deplasare": `${PASI_PUNCTAT * pasPunctat()}px`,
                    }}
                  />
                </svg>
              </Show>

              <Show when={decor() && s().scantei}>
                {(culori) => (
                  <svg
                    class="bbt-inel-strat"
                    viewBox={`0 0 ${S()} ${S()}`}
                    width={S()}
                    height={S()}
                    style={{ overflow: "visible" }}
                  >
                    <For each={culori()}>
                      {(culoare, j) => {
                        const latura = () => S() * SCANTEIE;
                        const a = () =>
                          ((UNGHIURI_SCANTEI[culori().length]?.[j()] ?? -90) *
                            Math.PI) /
                          180;
                        const x = () =>
                          c() + R2() * Math.cos(a()) - latura() / 2;
                        const y = () =>
                          c() + R2() * Math.sin(a()) - latura() / 2;
                        return (
                          <g
                            transform={`translate(${x()} ${y()}) scale(${latura() / 20})`}
                          >
                            <g
                              class="bbt-inel-scanteie"
                              style={{ "animation-delay": `${j() * 0.25}s` }}
                            >
                              {/* Conturul în culoarea fundalului, desenat SUB umplere (`paint-order`): steaua
                                se desprinde de inel fără să-și piardă din mărime. */}
                              <path
                                d={STEA}
                                fill={culoare}
                                stroke={fundal()}
                                stroke-width="1.2"
                                stroke-linejoin="round"
                                paint-order="stroke"
                              />
                            </g>
                          </g>
                        );
                      }}
                    </For>
                  </svg>
                )}
              </Show>

              <Show when={props.animat && s().orbita}>
                <span class="bbt-inel-strat bbt-inel-orbita">
                  {/* Luminița pe orbită (Icon, Echipa), pe raza liniei punctate, nu mai departe (19 nov): pe tura
                    de jos ar fi trecut peste nume. */}
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
                      "box-shadow": `0 0 ${S() * 0.03}px ${S() * 0.01}px ${s().exterior}`,
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
