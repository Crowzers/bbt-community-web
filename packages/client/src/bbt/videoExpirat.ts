/**
 * BBT: video-urile din Community se șterg după un an (decizia userului, 22 oct 2026). Le șterge cronul `video-vechi` din
 * admin (`admin/lib/stoat/videoVechi.ts`): fișierul pleacă, mesajul rămâne, cu tot cu copia atașamentului, deci firul tot
 * crede că acolo e un video. Fără regula de aici, în fir rămânea o cutie neagră care nu pornește niciodată. Aceeași regulă
 * ca `mobil/src/fir/videoExpirat.ts`.
 *
 * ⚠️ Același prag ca în admin. Dacă se schimbă acolo, se schimbă și aici, altfel un video încă existent apare expirat (pragul
 * de aici mai mic) sau unul șters apare ca o cutie neagră (pragul de aici mai mare). Excepția știută: un video raportat nu
 * se șterge (moderarea îl păstrează), dar aici apare tot expirat.
 */
export const LUNI_PASTRARE_VIDEO = 12;

export function videoExpirat(trimisLa: Date, acum = new Date()) {
  const prag = new Date(acum);
  prag.setMonth(prag.getMonth() - LUNI_PASTRARE_VIDEO);
  return trimisLa < prag;
}

/**
 * A doua plasă, după ce `<video>` a dat eroare: prinde ce scapă regulii de vârstă (un video șters mai devreme, un ceas
 * greșit). O rețea picată dă și ea eroare pe `<video>`, de-asta nu ajunge eroarea singură.
 *
 * ⚠️ HEAD pe `previewUrl`, fără să urmeze redirecționarea: autumn răspunde 308 spre fișier dacă există și 404 dacă e șters, fără
 * să atingă fișierul. Un GET ar descărca tot video-ul. În browser, redirecționarea dă un răspuns opac, deci tot „există".
 */
export function verificaVideoSters(previewUrl: string) {
  return fetch(previewUrl, { method: "HEAD", redirect: "manual" })
    .then((r) => r.status === 404)
    .catch(() => false);
}
