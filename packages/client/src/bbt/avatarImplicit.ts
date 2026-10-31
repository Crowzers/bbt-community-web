// ⚠️ Aceleași șase, în aceeași ordine, ca în `telefon.tsx` și în aplicație: un om are aceeași culoare peste tot.
const FUNDALURI = [
  "#DCEEFF",
  "#FFEFAD",
  "#99E9C4",
  "#E9CCFF",
  "#FEDCEC",
  "#FEDBCD",
];

export const BEANBAG =
  "M465.95,348.05c-1.8-14.59-5-29.03-13.44-41.59h-.03c-6.62-17.06-18.26-30.42-31.57-42.49-17.36-15.74-38.57-24.66-60.05-32.97-22.98-8.92-46.31-16.94-68.94-26.83-34.87-15.26-58.05-40.49-68.47-77.21-2.32-8.24-4.65-16.46-6.89-24.73-3.52-12.86-6.84-25.8-12.34-38.07-8.79-19.63-23.36-32.77-44.19-38.44-19.48-5.3-38.87-7.02-58.4,1-14.91,6.12-53.98,20.03-72.84,61.23-9.22,20.93-13.04,43.19-16.26,65.57-2.65,18.29-4.2,36.7-6.87,54.98-3,20.36-4.57,40.79-5.3,61.3-.72,19.86-.32,39.72,1.3,59.6,1.55,18.81,3.4,37.52,7.82,55.83,11.92,49.46,38.49,89.73,78.01,121.55,41.94,33.77,90.28,51.56,143.68,55.33,43.12,3.07,84.71-4.55,124.9-20.36,24.06-9.44,45.66-22.61,62.37-42.42,36.85-43.71,54.63-93.77,47.51-151.28";

/**
 * BBT: în locul avatarului implicit Stoat, cu forma lor de marcă, beanbag-ul din logo, ca în aplicație
 * (`mobil/src/ui/Avatar.tsx`). Culoarea vine din id, deci un om își păstrează culoarea peste tot.
 *
 * ⚠️ Stă aici, în componenta `Avatar`, nu în `stoat.js`: acela e submodul spre repo-ul lor, deci o schimbare acolo n-ar
 * ajunge în build. Se prinde după adresă (`/users/<id>/default_avatar`), ca să acopere fără schimbări fiecare loc care
 * pasează `avatarURL`.
 */
export function faraAvatarStoat(src: string | undefined) {
  const id = src?.match(/\/users\/([^/]+)\/default_avatar/)?.[1];
  if (!id) return src;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${FUNDALURI[h % FUNDALURI.length]}"/><path d="${BEANBAG}" transform="translate(6 13) rotate(-9 14 20) scale(0.066)" fill="#0A0A0B" fill-opacity="0.28"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
