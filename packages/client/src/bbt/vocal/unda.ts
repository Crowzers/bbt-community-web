/**
 * Forma de undă a unui vocal, calculată în browserul care îl arată: serverul Stoat nu poate ține date în plus,
 * deci unda nu vine cu mesajul.
 *
 * Aici, spre deosebire de aplicația mobilă (care citește doar mărimea cadrelor AAC), avem decodor: browserul
 * decodează AAC-ul cu `decodeAudioData` și luăm volumul adevărat. Fișierul e mic (64 kb/s, ~0,5 MB pe minut)
 * și se descarcă o singură dată pe pagină.
 *
 * Pentru orice nu putem citi (descărcare picată, format pe care browserul nu-l decodează) întoarcem `null`,
 * iar bula arată bețe egale.
 */

export const BETE = 40;

const cache = new Map<string, Promise<number[] | null>>();

export function undaVocal(id: string, url: string): Promise<number[] | null> {
  let rezultat = cache.get(id);
  if (!rezultat) {
    rezultat = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? decodeaza(b) : null))
      .then((s) => (s ? undaDinSunet(s) : null))
      .catch(() => null);
    cache.set(id, rezultat);
    // O descărcare picată nu rămâne în cache: data viitoare când apare bula se încearcă din nou.
    void rezultat.then((u) => u === null && cache.delete(id));
  }
  return rezultat;
}

/** Decodare fără difuzoare: `OfflineAudioContext` nu cere un gest al omului, ca `AudioContext`. */
async function decodeaza(octeti: ArrayBuffer): Promise<Float32Array | null> {
  const context = new OfflineAudioContext(1, 1, 44100);
  const sunet = await context.decodeAudioData(octeti);
  return sunet.length ? sunet.getChannelData(0) : null;
}

/** Bețele, între 0 și 1: volumul mediu (RMS) pe fiecare bucată, față de bucata cea mai tare. */
export function undaDinSunet(
  esantioane: Float32Array,
  bete = BETE,
): number[] | null {
  if (esantioane.length < bete) return null;
  const rms: number[] = [];
  for (let i = 0; i < bete; i++) {
    const de = Math.floor((i * esantioane.length) / bete);
    const pana = Math.floor(((i + 1) * esantioane.length) / bete);
    let s = 0;
    for (let j = de; j < pana; j++) s += esantioane[j] * esantioane[j];
    rms.push(Math.sqrt(s / Math.max(1, pana - de)));
  }
  // Marginea de sus din percentilă, nu max: un singur pocnet n-ar trebui să turtească toată unda.
  const sus = [...rms].sort((a, b) => a - b)[Math.ceil(bete * 0.95) - 1];
  if (sus <= 0) return rms.map(() => 0.4);
  return rms.map((v) => Math.sqrt(Math.min(1, v / sus)));
}
