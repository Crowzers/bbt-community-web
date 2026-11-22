/**
 * BBT: rețelele din profilul public, ca pe site (`RETELE` din `website/src/app/[limba]/u/[username]/IdentitateProfil.tsx`) și
 * în aplicație (`mobil/src/app/editeaza-profil.tsx`). Le folosesc ambele formulare ale hub-ului: „Editează profilul” și
 * „Profil public” din Setări.
 *
 * Din 22 nov 2026 (userul) fără SoundCloud și Website, „că nu și le pune nimeni”, iar omul scrie doar username-ul (la Spotify,
 * linkul sau codul de artist). `prefix` e partea fixă a adresei, scrisă gri în fața câmpului. Adresa întreagă o face adminul
 * (`admin/lib/reguli/linkuriSociale.ts`), din prefixul lui: nimic din ce scrie omul nu poate trimite linkul de pe profil pe alt
 * site. Un link vechi de SoundCloud sau Website nu se mai arată nicăieri și cade la următoarea salvare.
 */
export const RETELE = [
  { cheie: "instagram", nume: "Instagram", prefix: "instagram.com/" },
  { cheie: "tiktok", nume: "TikTok", prefix: "tiktok.com/@" },
  { cheie: "youtube", nume: "YouTube", prefix: "youtube.com/@" },
  { cheie: "spotify", nume: "Spotify", prefix: "open.spotify.com/artist/" },
] as const;

/** Codul de artist Spotify (22 de litere și cifre), ca în `linkSocial` din admin: din linkul lipit, din `spotify:artist:` sau singur. */
const COD_SPOTIFY = /(?:^|artist[/:])([A-Za-z0-9]{22})(?:[/?#]|$)/;

/**
 * Ce stă în câmp dintr-un link: username-ul de după domeniu, fără @ (la Spotify, codul de după `artist/`), ca `dinLink` de pe
 * site. Cu expresii, nu cu `new URL`, ca să se comporte la fel ca aplicația, unde `URL` din React Native nu e întreg.
 */
function dinLink(link: string): string {
  const parti = link
    .trim()
    .replace(/^([a-z]+:\/\/)?[^/]*\//i, "")
    .split(/[?#]/)[0]
    .split("/")
    .filter(Boolean);
  return (parti[0] === "artist" ? parti[1] : parti[0])?.replace(/^@/, "") ?? "";
}

/** Valoarea din câmp după o salvare reușită: aceeași bucată pe care a păstrat-o adminul, deci formularul nu mai pare schimbat. */
export function caInCamp(cheie: string, text: string): string {
  const t = text.trim();
  if (!t) return "";
  return cheie === "spotify"
    ? (t.match(COD_SPOTIFY)?.[1] ?? dinLink(t))
    : dinLink(t);
}

/** Linkurile salvate, ca username-uri, pentru cele patru rețele (mereu aceleași chei, în aceeași ordine: „schimbat” compară JSON). */
export function linkuriInCampuri(
  salvate: Record<string, string> | null | undefined,
): Record<string, string> {
  return Object.fromEntries(
    RETELE.map(({ cheie }) => [
      cheie,
      salvate?.[cheie] ? dinLink(salvate[cheie]) : "",
    ]),
  );
}

/**
 * Ce pleacă la admin: toate patru, și cele goale, fiindcă ruta înlocuiește tot obiectul, iar textul gol înseamnă „șterge”.
 * Pleacă ce a scris omul, nu o variantă curățată de noi: un link lipit de pe alt site trebuie să primească „nu e bun” de la
 * admin, nu să devină un username oarecare pe rețeaua greșită.
 */
export function linkuriDeTrimis(
  campuri: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    RETELE.map(({ cheie }) => [cheie, (campuri[cheie] ?? "").trim()]),
  );
}

/** Placeholderul câmpului, ca pe site: la Spotify nu există username, ci codul de artist. */
export function exempluRetea(cheie: string) {
  return cheie === "spotify" ? "codul de artist" : "username";
}
