/**
 * Cum recunoaștem un vocal: după NUMELE fișierului, `vocal-<durata_ms>.m4a`, exact ca aplicația mobilă BBT
 * (decizia #6 din `website/docs/plans/2026-10-21-aplicatia-mobila-nativa-design.md`, în monorepo).
 *
 * Serverul Stoat rămâne neatins, deci nu există un câmp „voice" pe mesaj: numele e singurul loc în care cine
 * trimite poate lăsa ceva pentru cine primește. Durata stă în nume ca bula să o arate înainte de descărcare.
 *
 * ⚠️ Forma trebuie să rămână IDENTICĂ cu cea din aplicație (`mobil/src/vocal/nume.ts`). Altfel vocalele
 * trimise de pe hub apar pe telefon ca fișiere obișnuite, sau invers.
 */
const FORMA = /^vocal-(\d{1,8})\.m4a$/;

export function numeVocal(durataMs: number): string {
  return `vocal-${Math.max(0, Math.round(durataMs))}.m4a`;
}

/** Durata din nume, în milisecunde, sau `null` dacă fișierul nu e un vocal de-al nostru. */
export function durataVocal(numeFisier: string | undefined): number | null {
  const potrivire = numeFisier ? FORMA.exec(numeFisier) : null;
  return potrivire ? Number(potrivire[1]) : null;
}

/** 75 000 → „1:15". */
export function formateazaDurata(ms: number): string {
  const secunde = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(secunde / 60)}:${String(secunde % 60).padStart(2, "0")}`;
}
