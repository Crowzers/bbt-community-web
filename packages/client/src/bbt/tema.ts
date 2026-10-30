/**
 * Tema BBT Community — culori FIXE, după design system-ul BBT, nu generate.
 *
 * 🔴 De ce nu tema lor („Material You"): ea CALCULEAZĂ toate cele ~45 de culori dintr-o singură
 * culoare de bază, prin algoritmul Material (HCT). Rozul BBT dat ca bază ieșea transformat — un roz
 * prăfuit, alt ton, pe care userul nu l-a recunoscut (5 oct 2026: „rozul acela nu e rozul BBT").
 * Aici fiecare rol primește valoarea exactă.
 *
 * 🔥 **ALB din 30 oct 2026**, după machetele 21 și 23 (desktop) și aplicația de telefon (19-22): fundal alb, carduri
 * și pill-uri gri #F2F2F3, linii #E5E5E5, text #0A0A0B, roz doar pe ce contează. Userul a cerut „tot hub-ul pe alb".
 * Până atunci tema era NEAGRĂ, după adminul întunecat (cererea din 5 oct: „inspiră-te după admin platform"; negru pur,
 * alb cu opacitate pentru cernelurile secundare). Aceleași valori ca contul din hub (`cont/ui.tsx`) și ca aplicația
 * (`mobil/src/ui/culori.ts`).
 *
 * Accentul = rozul BBT, pentru acțiuni și pentru ce e al tău (mesajele tale, cifra de necitite). ⚠️ Textul PE roz
 * rămâne NEGRU (alb pe roz = 1,6:1). Selecția (canalul deschis) NU e roz: e gri #F2F2F3, ca rândul activ din 21a.
 *
 * ⚠️ Cheile sunt rolurile Material pe care le citește tot UI-ul lor (`--md-sys-color-<rol>`). O
 * cheie lipsă = o bucată de interfață fără culoare. Lista completă e tipul `MaterialColours` din
 * `components/ui/themes/materialTheme.ts`.
 */

const ROZ = "#FFB3D9";
const ROZ_DESCHIS = "#FFE4F1";
const ROZ_INTENS = "#B85C86"; // hover și stare apăsată pe acțiuni
/** Linkuri și mențiuni. Albastrul Slush (#4DA2FF) dă 2,65:1 pe alb; ca text se folosește varianta închisă a site-ului. */
const ALBASTRU_TEXT = "#2C639E";
const ALBASTRU_DESCHIS = "#DCEEFF";

const NEGRU = "#0A0A0B";
const ALB = "#FFFFFF";

/** Griurile din machetă. */
const GRI = {
  card: "#F2F2F3", // cardurile, pill-urile, rândul activ
  camp: "#F3F3F6", // câmpurile
  linie: "#E5E5E5",
  apasat: "#E9E9EC",
} as const;

const CERNEALA = {
  1: NEGRU, // text principal
  2: "#6C6C6D", // #0A0A0B la 60%, textul secundar din machetă
  3: "#8D8D9A", // placeholder și metadate
} as const;

export const SCHEMA_BBT: Record<string, string> = {
  primary: ROZ,
  "on-primary": NEGRU,
  // Containerul „primar" = elementul SELECTAT (canalul deschis, fila activă) — gri, nu roz (21a).
  "primary-container": GRI.card,
  "on-primary-container": CERNEALA[1],

  secondary: CERNEALA[2],
  "on-secondary": ALB,
  "secondary-container": GRI.card,
  "on-secondary-container": CERNEALA[1],

  tertiary: ALBASTRU_TEXT,
  "on-tertiary": ALB,
  "tertiary-container": ALBASTRU_DESCHIS,
  "on-tertiary-container": "#10243A",

  error: "#CA1A38",
  "on-error": ALB,
  "error-container": "#FBE3E7",
  "on-error-container": "#5C0A18",

  "primary-fixed": ROZ,
  "primary-fixed-dim": ROZ_INTENS,
  "on-primary-fixed": NEGRU,
  "on-primary-fixed-variant": ROZ_DESCHIS,
  "secondary-fixed": GRI.card,
  "secondary-fixed-dim": GRI.linie,
  "on-secondary-fixed": NEGRU,
  "on-secondary-fixed-variant": CERNEALA[2],
  "tertiary-fixed": ALBASTRU_DESCHIS,
  "tertiary-fixed-dim": "#4DA2FF",
  "on-tertiary-fixed": "#10243A",
  "on-tertiary-fixed-variant": ALBASTRU_TEXT,

  // Suprafețele. ⚠️ NU în ordinea numelor: layout-ul lor le folosește așa (verificat în cod, 5 oct):
  //   rama aplicației, pe care stă bara de iconițe → `surface-container-high`   (src/Interface.tsx)
  //   listele laterale (canale, mesaje directe)    → `surface-container-low`    (Interface, navigation/)
  //   zona de mesaje                               → `surface-container-lowest` (ui/layout/Main.tsx)
  // În 21 toate trei sunt albe, despărțite de linii #E5E5E5, nu de tonuri; gri sunt doar cardurile și pill-urile.
  "surface-dim": GRI.card,
  surface: ALB,
  "surface-bright": ALB,
  "surface-container-lowest": ALB,
  "surface-container-low": ALB,
  "surface-container": GRI.card,
  "surface-container-high": ALB,
  "surface-container-highest": GRI.apasat,
  "on-surface": CERNEALA[1],
  "on-surface-variant": CERNEALA[2],
  outline: CERNEALA[3],
  "outline-variant": GRI.linie,

  "inverse-surface": NEGRU,
  "inverse-on-surface": ALB,
  "inverse-primary": ROZ,
  scrim: "#000000",
  shadow: "#000000",
};
