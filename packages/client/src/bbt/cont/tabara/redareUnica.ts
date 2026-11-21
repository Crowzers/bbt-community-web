/**
 * BBT: în pagina taberei se aude o singură piesă odată (22 nov 2026). Piesele din playlist, cele de pe cardul sesiunii și
 * ascultarea din formularul de încărcare au fiecare elementul lor audio; cine pornește îi oprește pe ceilalți. E regula D11
 * din `admin/docs/plans/2026-11-22-piesa-sesiunii-artwork-design.md`: pe site, panoul de încărcare oprește playerul mare de
 * jos, iar playerul mare pornit înapoi oprește panoul. Hub-ul n-are un player mare comun, deci regula se ține aici.
 *
 * ⚠️ Doar elementele înscrise aici, nu toate `<audio>` din document: sunetul apelurilor vocale (LiveKit) trece tot prin
 * elemente audio, iar o oprire „a tot ce cântă” ar fi tăiat apelul.
 */
const piese = new Set<HTMLMediaElement>();

function laPornire(e: Event) {
  const el = e.currentTarget as HTMLMediaElement;
  for (const a of piese) if (a !== el && !a.paused) a.pause();
}

/** Înscrie elementul; întoarce funcția care îl scoate (de chemat la `onCleanup`). */
export function oSinguraPiesa(el: HTMLMediaElement): () => void {
  piese.add(el);
  el.addEventListener("play", laPornire);
  return () => {
    piese.delete(el);
    el.removeEventListener("play", laPornire);
  };
}
