/**
 * Paginile din `/cont` care țin de tab-ul Experiențe. Restul țin de Profil. Ca în aplicație: două locuri separate, nu un singur
 * cont cu meniu (cererea userului, 31 oct 2026). Adresele vechi (`mycamps`…) duc la `experiente` (`ContulMeu.tsx`), deci
 * și ele aprind tab-ul potrivit în bara din stânga.
 */
export const PAGINI_EXPERIENTE = [
  "experiente",
  "experienta",
  "tabara",
  "notita",
  "mycamps",
  "workshops",
  "cursuri",
  "wishlist",
];

/** `/cont/tabara/<id>` → adevărat. */
export function eInExperiente(cale: string) {
  return PAGINI_EXPERIENTE.includes(cale.split("/")[2] ?? "");
}
