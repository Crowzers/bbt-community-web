/**
 * Tema BBT Community — culori FIXE, din design system-ul BBT, nu generate.
 *
 * 🔴 De ce nu tema lor („Material You"): ea CALCULEAZĂ toate cele ~45 de culori dintr-o singură
 * culoare de bază, prin algoritmul Material (HCT). Rozul BBT dat ca bază ieșea transformat — un roz
 * prăfuit, alt ton, pe care userul nu l-a recunoscut (5 oct 2026: „rozul acela nu e rozul BBT").
 * Aici fiecare rol primește valoarea exactă.
 *
 * Sursele (repo-ul BBT, privat):
 * - fundalurile, liniile și textele = paleta Community-ului de dinainte,
 *   `website/src/lib/paletaComunitate.ts` (`C.rail` … `C.text3`);
 * - accentul = `--color-bbt-pink` (#FFA8CD) din `website/src/app/tokens.css` — „roz înseamnă
 *   click"; ⚠️ textul PE roz rămâne ÎNCHIS (alb pe #FFA8CD = 1,6:1, negru = 11,7:1);
 * - albastrul Community (`--color-bbt-community`, #4DA2FF) = rolul „tertiary" (linkuri, mențiuni).
 *
 * ⚠️ Cheile sunt rolurile Material pe care le citește tot UI-ul lor (`--md-sys-color-<rol>`). O
 * cheie lipsă = o bucată de interfață fără culoare. Lista completă e tipul `MaterialColours` din
 * `components/ui/themes/materialTheme.ts`.
 */

const ROZ = "#FFA8CD";
const ROZ_INTENS = "#B85C86"; // ≈ --color-bbt-pink-intens pe fond întunecat (hover, stare apăsată)
const ALBASTRU = "#4DA2FF";

const C = {
  rail: "#121215",
  sidebar: "#1A1A1F",
  fir: "#202025",
  linie: "#2C2C33",
  hover: "#26262D",
  activ: "#32323B",
  text: "#E9E9EC",
  text2: "#9A9AA4",
  text3: "#6C6C76",
} as const;

export const SCHEMA_BBT: Record<string, string> = {
  primary: ROZ,
  "on-primary": "#000000",
  "primary-container": "#4A2C3A",
  "on-primary-container": "#FFD9EA",

  secondary: C.text2,
  "on-secondary": C.rail,
  "secondary-container": C.activ,
  "on-secondary-container": C.text,

  tertiary: ALBASTRU,
  "on-tertiary": "#000000",
  "tertiary-container": "#1C3552",
  "on-tertiary-container": "#D3E6FF",

  error: "#FF8A80",
  "on-error": "#000000",
  "error-container": "#5C1A1A",
  "on-error-container": "#FFDAD6",

  "primary-fixed": ROZ,
  "primary-fixed-dim": ROZ_INTENS,
  "on-primary-fixed": "#000000",
  "on-primary-fixed-variant": "#4A2C3A",
  "secondary-fixed": C.text,
  "secondary-fixed-dim": C.text2,
  "on-secondary-fixed": C.rail,
  "on-secondary-fixed-variant": C.activ,
  "tertiary-fixed": "#D3E6FF",
  "tertiary-fixed-dim": ALBASTRU,
  "on-tertiary-fixed": "#000000",
  "on-tertiary-fixed-variant": "#1C3552",

  // Suprafețele, de la cea mai adâncă la cea mai ridicată — aceeași ordine ca în Community-ul vechi:
  // șina (rail) → lista de canale (sidebar) → firul de mesaje → hover → element activ.
  "surface-dim": C.rail,
  surface: C.fir,
  "surface-bright": C.activ,
  "surface-container-lowest": C.rail,
  "surface-container-low": C.sidebar,
  "surface-container": C.fir,
  "surface-container-high": C.hover,
  "surface-container-highest": C.activ,
  "on-surface": C.text,
  "on-surface-variant": C.text2,
  outline: C.text3,
  "outline-variant": C.linie,

  "inverse-surface": C.text,
  "inverse-on-surface": C.rail,
  "inverse-primary": ROZ_INTENS,
  scrim: "#000000",
  shadow: "#000000",
};
