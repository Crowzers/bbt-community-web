import { JSX, splitProps } from "solid-js";

import { SVG_LUCIDE } from "./iconite";
import HARTA from "./iconite-harta.json";

/**
 * Iconițele BBT Community = Lucide, ca pe site (lucide-react). Stoat folosește Material, din DOUĂ
 * surse, iar ambele trec pe aici fără să atingem cele ~100 de fișiere care le folosesc:
 *
 * 1. `<Symbol>nume</Symbol>` (fontul Material Symbols) — `components/ui/components/utils/Symbol.tsx`
 *    întreabă `lucidePentru(nume)` și, dacă există, desenează SVG-ul Lucide în loc de glif.
 * 2. `import X from "@material-design-icons/svg/<stil>/<nume>.svg?component-solid"` — pluginul
 *    `bbt-iconite-lucide` din `vite.config.ts` le redirecționează spre `componentaLucide(nume)`.
 *
 * Ce nu e în `iconite-harta.json` rămâne Material — o iconiță lipsă din hartă e o iconiță mai puțin
 * BBT, nu o iconiță ruptă. Harta se completează când apare una nouă la un update upstream.
 *
 * ⚠️ `iconite.ts` e GENERAT din hartă. După ce modifici harta, din `packages/client`:
 *    node scripts/bbt-genereaza-iconite.mjs   (oprește-se dacă o iconiță Lucide din hartă nu există)
 */

const HARTA_LUCIDE = HARTA as Record<string, string>;

/** Interiorul SVG-ului Lucide (fără `<svg>`-ul exterior), pentru o iconiță Material, sau `null`. */
export function lucidePentru(numeMaterial: string): string | null {
  const nume = HARTA_LUCIDE[numeMaterial];
  const brut = nume ? SVG_LUCIDE[nume] : undefined;
  if (!brut) return null;
  return brut
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
}

type PropsSvg = JSX.SvgSVGAttributes<SVGSVGElement>;

/**
 * Componenta care ia locul unui import `@material-design-icons/…svg?component-solid`.
 *
 * ⚠️ Material umple forma (`fill`), Lucide o desenează din contur (`stroke`). Un `fill` primit de la
 * apelant (o culoare) se mută pe `stroke`; altfel iconița ar ieși un bloc plin de culoare.
 *
 * ⚠️ Mărimea implicită e 24px, ca a SVG-urilor Material înlocuite (`width="24"` în fișierele lor), NU
 * 1em: cu 1em, rotița și membrii din antetul canalului ieșeau cât textul, lângă pin și căutare de 24px.
 * O mărime dată de CSS-ul apelantului câștigă oricum în fața atributelor.
 */
export function componentaLucide(numeMaterial: string) {
  const interior = lucidePentru(numeMaterial) ?? "";
  return function IconitaLucide(props: PropsSvg) {
    const [local, rest] = splitProps(props, [
      "fill",
      "viewBox",
      "width",
      "height",
    ]);
    const culoare = () =>
      local.fill && local.fill !== "none"
        ? (local.fill as string)
        : "currentColor";
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={local.width ?? 24}
        height={local.height ?? 24}
        fill="none"
        stroke={culoare()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        {...rest}
        innerHTML={interior}
      />
    );
  };
}
