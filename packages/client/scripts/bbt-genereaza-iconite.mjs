/* eslint-disable no-undef */
// BBT: regenerează src/bbt/iconite.ts din src/bbt/iconite-harta.json (Material → Lucide).
// Rulează din packages/client:  node scripts/bbt-genereaza-iconite.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const harta = JSON.parse(readFileSync("src/bbt/iconite-harta.json", "utf8"));
const unice = [...new Set(Object.values(harta))].sort();
const lipsa = unice.filter((n) => !existsSync(`node_modules/lucide-static/icons/${n}.svg`));
if (lipsa.length) {
  console.error("Iconițe Lucide inexistente în hartă:", lipsa.join(", "));
  process.exit(1);
}
const id = (n) => "i_" + n.replace(/-/g, "_");
let s = `/**
 * Iconițele Lucide (design system-ul BBT: site-ul folosește lucide-react) — GENERAT din
 * \`iconite-harta.json\` de \`scripts/bbt-genereaza-iconite.mjs\`. Nu edita de mână.
 */
`;
for (const n of unice) s += `import ${id(n)} from "lucide-static/icons/${n}.svg?raw";\n`;
s += `\n/** Numele Lucide → SVG-ul brut. */\nexport const SVG_LUCIDE: Record<string, string> = {\n`;
for (const n of unice) s += `  "${n}": ${id(n)},\n`;
s += `};\n`;
writeFileSync("src/bbt/iconite.ts", s);
console.log(`src/bbt/iconite.ts: ${unice.length} iconițe`);
