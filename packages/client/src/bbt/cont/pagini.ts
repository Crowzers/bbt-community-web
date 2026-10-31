/**
 * Paginile din `/cont` care țin de tab-ul Experiențe. Restul țin de Profil, cu meniul lui. Ca în aplicație: două locuri
 * separate, nu un singur cont cu meniu (cererea userului, 31 oct 2026). My Camps, My Workshops și My Courses sunt ale
 * Profilului, ca pe site; pe telefon adresele lor duc la `experiente` (`ContulMeu.tsx`).
 */
export const PAGINI_EXPERIENTE = [
  "experiente",
  "experienta",
  "tabara",
  "notita",
  "wishlist",
];

/** `/cont/tabara/<id>` → adevărat. */
export function eInExperiente(cale: string) {
  return PAGINI_EXPERIENTE.includes(cale.split("/")[2] ?? "");
}
