/**
 * Tema BBT Community — culori FIXE, după design system-ul BBT, nu generate.
 *
 * 🔴 De ce nu tema lor („Material You"): ea CALCULEAZĂ toate cele ~45 de culori dintr-o singură
 * culoare de bază, prin algoritmul Material (HCT). Rozul BBT dat ca bază ieșea transformat — un roz
 * prăfuit, alt ton, pe care userul nu l-a recunoscut (5 oct 2026: „rozul acela nu e rozul BBT").
 * Aici fiecare rol primește valoarea exactă.
 *
 * MODELUL = adminul BBT întunecat (cererea userului, 5 oct: „inspiră-te după admin platform"),
 * adică meniul de pe negru din `admin/components/layout/Sidebar.tsx` + `admin/app/tokens.css`:
 * - fondul e NEGRU PUR (`--color-negru`, #000) — „la noi negru e negru", nu un gri închis;
 * - textul e alb, iar cernelurile secundare sunt alb cu opacitate: `--color-cerneala-2/3/4` =
 *   80% / 60% / 48%. ⚠️ 48% e PRAGUL DE JOS, calculat (4,89:1 pe negru = AA) — nu coborî sub el;
 * - activ = alb 10% (`bg-white/10`), hover = alb 5%, liniile = alb 10% (`border-white/10`);
 * - conținutul stă pe o „foaie" ridicată, ca foaia albă din admin — aici, un negru ușor mai deschis.
 * Rolurile Material cer culori opace, deci albul-cu-opacitate e scris ca rezultatul lui pe negru.
 *
 * Accentul = `--color-bbt-pink` (#FFA8CD), DOAR pentru acțiuni („roz înseamnă click" — regula de pe
 * site). ⚠️ Textul PE roz rămâne NEGRU (alb pe #FFA8CD = 1,6:1, negru = 11,7:1). Selecția (canalul
 * deschis) NU e roz: e alb 10%, ca rândul activ din meniul adminului.
 *
 * ⚠️ Cheile sunt rolurile Material pe care le citește tot UI-ul lor (`--md-sys-color-<rol>`). O
 * cheie lipsă = o bucată de interfață fără culoare. Lista completă e tipul `MaterialColours` din
 * `components/ui/themes/materialTheme.ts`.
 */

const ROZ = "#FFA8CD";
const ROZ_INTENS = "#B85C86"; // ≈ --color-bbt-pink-intens: hover și stare apăsată pe acțiuni
const ALBASTRU = "#4DA2FF"; // --color-bbt-community: linkuri, mențiuni

/** Albul cu opacitate din admin, scris opac peste negru. */
const ALB = {
  5: "#0D0D0D", // hover
  8: "#141414", // foaia de conținut (mesajele)
  10: "#1A1A1A", // activ, liniile
  15: "#262626", // activ peste foaie
  20: "#333333",
} as const;

const CERNEALA = {
  1: "#FFFFFF", // text principal
  2: "#CCCCCC", // --color-cerneala-2 (80%)
  3: "#999999", // --color-cerneala-3 (60%)
  4: "#7A7A7A", // --color-cerneala-4 (48%) — pragul AA
} as const;

export const SCHEMA_BBT: Record<string, string> = {
  primary: ROZ,
  "on-primary": "#000000",
  // Containerul „primar" = elementul SELECTAT (canalul deschis, fila activă) — alb 10%, nu roz.
  "primary-container": ALB[15],
  "on-primary-container": CERNEALA[1],

  secondary: CERNEALA[3],
  "on-secondary": "#000000",
  "secondary-container": ALB[15],
  "on-secondary-container": CERNEALA[1],

  tertiary: ALBASTRU,
  "on-tertiary": "#000000",
  "tertiary-container": "#10243A",
  "on-tertiary-container": "#D3E6FF",

  error: "#FF8A80",
  "on-error": "#000000",
  "error-container": "#3D1212",
  "on-error-container": "#FFDAD6",

  "primary-fixed": ROZ,
  "primary-fixed-dim": ROZ_INTENS,
  "on-primary-fixed": "#000000",
  "on-primary-fixed-variant": ALB[15],
  "secondary-fixed": CERNEALA[1],
  "secondary-fixed-dim": CERNEALA[3],
  "on-secondary-fixed": "#000000",
  "on-secondary-fixed-variant": ALB[15],
  "tertiary-fixed": "#D3E6FF",
  "tertiary-fixed-dim": ALBASTRU,
  "on-tertiary-fixed": "#000000",
  "on-tertiary-fixed-variant": "#10243A",

  // Suprafețele. ⚠️ NU în ordinea numelor: layout-ul lor le folosește așa (verificat în cod, 5 oct):
  //   rama aplicației, pe care stă bara de iconițe → `surface-container-high`   (src/Interface.tsx)
  //   listele laterale (canale, mesaje directe)    → `surface-container-low`    (Interface, navigation/)
  //   zona de mesaje                               → `surface-container-lowest` (ui/layout/Main.tsx)
  // Modelul adminului vrea rama + meniul pe NEGRU PUR și conținutul pe o foaie RIDICATĂ — deci
  // „lowest" e aici mai deschis decât „low". Prima variantă le pusese în ordinea numelor și ieșise
  // pe dos: bara gri, mesajele negre.
  "surface-dim": "#000000",
  surface: ALB[8],
  "surface-bright": ALB[20],
  "surface-container-lowest": ALB[8],
  "surface-container-low": "#000000",
  "surface-container": ALB[10],
  "surface-container-high": "#000000",
  "surface-container-highest": ALB[15],
  "on-surface": CERNEALA[1],
  "on-surface-variant": CERNEALA[2],
  outline: CERNEALA[4],
  "outline-variant": ALB[10],

  "inverse-surface": CERNEALA[1],
  "inverse-on-surface": "#000000",
  "inverse-primary": ROZ_INTENS,
  scrim: "#000000",
  shadow: "#000000",
};
