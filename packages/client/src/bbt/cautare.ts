import { createSignal } from "solid-js";

/**
 * Căutarea din bara de sus (`BaraSus.tsx`) → panoul de căutare al canalului deschis
 * (`src/interface/channels/text/TextChannel.tsx`).
 *
 * ⚠️ Stoat caută doar ÎNTR-UN canal (`POST /channels/{id}/search`) — nu peste tot serverul, nici prin
 * oameni sau lecții. De-aia câmpul spune „Caută mesaje în #canal", nu „Caută mesaje, oameni,
 * lecții" ca în pânza TRW: ar fi promis ceva ce nu face.
 *
 * `n` crește la fiecare căutare, ca aceeași frază căutată de două ori să redeschidă panoul.
 */
const [cautareCeruta, setCautareCeruta] = createSignal<{
  q: string;
  n: number;
} | null>(null);

/** Ecranul de căutare de pe telefon (`CautareTelefon.tsx`): acolo panoul din dreapta n-are loc. */
const [cautareTelefon, setCautareTelefon] = createSignal(false);

export { cautareCeruta, cautareTelefon, setCautareTelefon };

export function cereCautare(q: string) {
  const text = q.trim();
  if (!text) return;
  setCautareCeruta((c) => ({ q: text, n: (c?.n ?? 0) + 1 }));
}
