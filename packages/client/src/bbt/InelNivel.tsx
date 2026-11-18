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
 * Totul e desenat relativ la S (în SVG, viewBox 100 = S), deci aceeași componentă merge de la 33 la 96 px.
 *
 * Două feluri de a-i face loc cutiei, ca în aplicație:
 * - ÎN layout (implicit): cutia ocupă S × S. Lista de membri și mini-profilul, unde rândul și-a putut face loc.
 * - PESTE margini (`peste`): în layout stă doar poza, exact cât și unde era; cutia se desenează deasupra, centrată pe
 *   poză, fără să împingă nimic. Chatul, conversațiile, reacțiile, căutarea, mențiunile: acolo textul de lângă poză
 *   nu trebuie să se mute deloc (cererea din 18 nov, după aplicație: prima variantă din hub lărgea coloana
 *   avatarului din chat cu 10 px și muta tot textul mesajelor).
 */

/** Sub atât, doar inelul interior: punctatul și scânteile ar fi fost un pixel de zgomot (§3). */
const PRAG_DECOR = 48;

const DE_LA_POZA = 0.03; // distanța inel interior ↔ poză, din S
const RAZA_EXTERIOR = 50 - 3.5; // în viewBox 100
const GROSIME_EXTERIOR = 2.5;
const SCANTEIE = 19; // latura stelei, din 100
const CIRCUMFERINTA_EXTERIOR = 2 * Math.PI * RAZA_EXTERIOR;
// Liniuță 14°, pauză 8°, ca în schița aprobată. Pasul tiparului (22°) e și pasul rotirii punctatului (`unghiExterior`).
const PAS_PUNCTAT = 22;
const PUNCTAT = `${(CIRCUMFERINTA_EXTERIOR * 14) / 360} ${(CIRCUMFERINTA_EXTERIOR * 8) / 360}`;

type Stil = {
  /** Grosimea inelului interior, din S. */
  g: number;
  /** Fundalul inelului: o culoare plină sau un `conic-gradient`. */
  inel: string;
  conic?: boolean;
  /** Culoarea inelului exterior punctat (Professional+). */
  exterior?: string;
  /** Culoarea fiecărei scântei, în ordine. */
  scantei?: string[];
  /** Pasul dintre scântei, în grade (de la −50°, în sensul acelor, de la ora 3). */
  pas?: number;
  /** Animația (§4): lumina, în secunde pe tură. */
  tLumina: number;
  /** Câte ture ÎNTREGI face gradientul în cele 5 s (vezi `inel.css`: totul se termină cum a pornit). */
  tureGradient?: number;
  /** Punctatul: secunde pe tură (§4), rotunjit la un multiplu de 22° în `unghiExterior`. */
  tExterior?: number;
  aura?: string;
  orbita?: boolean;
};

const conic = (...culori: string[]) => `conic-gradient(${culori.join(", ")})`;

/**
 * Tabelul din §3. ⚠️ Pe lângă culoare, fiecare treaptă are și un al doilea semn (grosime, inel dublu, număr de
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
    tExterior: 10,
  },
  elite: {
    g: 0.055,
    inel: conic("#FB4903", "#FFB38A", "#FB4903", "#C93A02", "#FB4903"),
    conic: true,
    exterior: "#FB4903",
    scantei: ["#FB4903", "#FB4903"],
    pas: 85,
    tLumina: 2,
    tureGradient: 1,
    tExterior: 8,
  },
  legend: {
    g: 0.06,
    inel: conic("#CA1A38", "#FB4903", "#CA1A38", "#8E1027", "#CA1A38"),
    conic: true,
    exterior: "#CA1A38",
    scantei: ["#CA1A38", "#CA1A38", "#CA1A38"],
    pas: 85,
    tLumina: 1.6,
    tureGradient: 1,
    tExterior: 6,
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
    scantei: ["#E5B300", "#E5B300", "#E5B300", "#E5B300"],
    pas: 70,
    tLumina: 1.2,
    tureGradient: 2,
    tExterior: 4,
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
    scantei: ["#5C4ADE", "#FFA8CD", "#FB4903", "#CA1A38"],
    pas: 70,
    tLumina: 2,
    tureGradient: 1,
    tExterior: 8,
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
 * Cât se rotește punctatul (invers, §4) în cele 5 s: ritmul din §4 (o tură în `t` secunde), rotunjit la un multiplu
 * de 22°, pasul liniuței. Așa tiparul se termină suprapus peste cel de la pornire și nu rămâne rotit în repaus,
 * deci listele (statice) și mini-profilul (după animație) arată la fel. La fel pe site și în aplicație.
 */
const unghiExterior = (t: number) =>
  -Math.max(1, Math.round((360 * 5) / t / PAS_PUNCTAT)) * PAS_PUNCTAT;

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

  // Razele inelului interior, în px.
  const r1 = () => props.poza / 2 + S() * DE_LA_POZA;
  const r2 = () => r1() + S() * (stil()?.g ?? 0);
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
                "box-shadow": `0 0 ${S() * 0.14}px ${S() * 0.05}px ${culoare()}`,
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
                  class="bbt-inel-strat bbt-inel-exterior"
                  viewBox="0 0 100 100"
                  width={S()}
                  height={S()}
                  style={{
                    "--rot": `${unghiExterior(s().tExterior ?? 8)}deg`,
                  }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={RAZA_EXTERIOR}
                    fill="none"
                    stroke={s().exterior}
                    stroke-width={GROSIME_EXTERIOR}
                    stroke-dasharray={PUNCTAT}
                    opacity="0.6"
                  />
                </svg>
              </Show>

              <Show when={decor() && s().scantei}>
                {(culori) => (
                  <svg
                    class="bbt-inel-strat"
                    viewBox="0 0 100 100"
                    width={S()}
                    height={S()}
                    style={{ overflow: "visible" }}
                  >
                    <For each={culori()}>
                      {(culoare, j) => {
                        const a =
                          ((-50 + j() * (s().pas ?? 85)) * Math.PI) / 180;
                        const x =
                          50 + RAZA_EXTERIOR * Math.cos(a) - SCANTEIE / 2;
                        const y =
                          50 + RAZA_EXTERIOR * Math.sin(a) - SCANTEIE / 2;
                        return (
                          <g
                            transform={`translate(${x} ${y}) scale(${SCANTEIE / 20})`}
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
                  {/* Luminița pe orbită (Icon, Echipa): între inelul interior și cel punctat. */}
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: `${S() / 2 - (r2() + S() * 0.06)}px`,
                      width: `${S() * 0.05}px`,
                      height: `${S() * 0.05}px`,
                      transform: "translate(-50%, -50%)",
                      "border-radius": "50%",
                      background: "#FFFFFF",
                      "box-shadow": `0 0 ${S() * 0.05}px ${S() * 0.02}px ${s().exterior}`,
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
