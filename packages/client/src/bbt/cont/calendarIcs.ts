/**
 * „Adaugă în calendar” (25 nov 2026): evenimentul taberei ca fișier `.ics`, făcut în browser din datele pe care pagina le
 * are deja (`calendar`, calculat de admin în `lib/reguli/calendarTabara.ts`). Nimic nou pe server, niciun link cu token.
 *
 * - Ora e a României: `TZID=Europe/Bucharest`, cu definiția fusului în fișier (Outlook o cere; Apple și Google o au oricum).
 * - Fără oră de sosire sau de plecare în program, evenimentul ține zilele întregi.
 * - Alarma e cu o zi înainte (`-P1D`), cerută de user; la tabăra fără ore în program, la 9:00 în ziua dinainte (`-PT15H`). ⚠️ Google Calendar ignoră alarmele din fișier la import și pune
 *   notificarea lui obișnuită; pe iPhone și Android, în calendarul telefonului, merge. Notificarea BBT de „mâine pleci”
 *   (cronul `sesiuni-care-urmeaza`) acoperă oricum pe toată lumea.
 *
 * Pe calculator (26 nov 2026) omul alege între Google Calendar (`linkGoogleCalendar`) și Apple Calendar (fișierul); pe
 * telefon merge direct fișierul. Meniul e în `AdaugaInCalendar.tsx`.
 *
 * BBT: copia lui `website/src/lib/calendarIcs.ts` (fork-ul e alt repo). Orice schimbare se face în amândouă.
 */

export type Moment = { data: string; ora: string | null };
export type CalendarTabara = {
  titlu: string;
  locatie: string;
  sosire: Moment;
  plecare: Moment;
};

const FUS = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Bucharest",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:EEST",
  "DTSTART:19970330T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:EET",
  "DTSTART:19971026T040000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** Textul din ICS: virgulele, punct-virgulele și rândurile noi se scapă (RFC 5545 §3.3.11). */
const text = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
const zi = (data: string) => data.replace(/-/g, "");
const oraIcs = (ora: string) => `${ora.replace(":", "")}00`;

/** Ziua de după, pentru capătul exclusiv al unui eveniment pe zile întregi. */
function ziuaUrmatoare(data: string): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Rândurile mai lungi de 75 de octeți se rup, cu spațiu la începutul continuării (RFC 5545 §3.1). */
function plie(rand: string): string {
  const bucati: string[] = [];
  let rest = rand;
  while (new TextEncoder().encode(rest).length > 75) {
    let n = 74;
    while (new TextEncoder().encode(rest.slice(0, n)).length > 74) n--;
    bucati.push(rest.slice(0, n));
    rest = rest.slice(n);
  }
  bucati.push(rest);
  return bucati.join("\r\n ");
}

export function fisierIcs(
  c: CalendarTabara,
  opt: { uid: string; url?: string; alarma: string },
): string {
  const peOre = !!(c.sosire.ora && c.plecare.ora);
  const capete = peOre
    ? [
        `DTSTART;TZID=Europe/Bucharest:${zi(c.sosire.data)}T${oraIcs(c.sosire.ora!)}`,
        `DTEND;TZID=Europe/Bucharest:${zi(c.plecare.data)}T${oraIcs(c.plecare.ora!)}`,
      ]
    : [
        `DTSTART;VALUE=DATE:${zi(c.sosire.data)}`,
        `DTEND;VALUE=DATE:${zi(ziuaUrmatoare(c.plecare.data))}`,
      ];
  const acum = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bean Bag Theory//Tabere//RO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(peOre ? FUS : []),
    "BEGIN:VEVENT",
    `UID:${opt.uid}`,
    `DTSTAMP:${acum}`,
    ...capete,
    `SUMMARY:${text(c.titlu)}`,
    `LOCATION:${text(c.locatie)}`,
    ...(opt.url ? [`URL:${opt.url}`, `DESCRIPTION:${text(opt.url)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${text(opt.alarma)}`,
    // La tabăra pe zile întregi, -P1D ar suna la miezul nopții: 9:00 în ziua dinainte, ca în aplicație (25 nov 2026).
    peOre ? "TRIGGER:-P1D" : "TRIGGER:-PT15H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(plie)
    .join("\r\n");
}

/**
 * Google Calendar (26 nov 2026, varianta A aleasă de user pe schițe): pe calculator, fișierul ajungea în Descărcări și
 * cine are Google Calendar în browser trebuia să-l importe de mână. Linkul deschide calendarul cu evenimentul completat;
 * omul apasă doar „Salvează”. Orele merg fără `Z`, cu `ctz`, deci rămân pe ora României oricare ar fi fusul omului.
 * Alarma nu trece prin link: Google pune notificarea lui obișnuită (la fel ca la import).
 */
export function linkGoogleCalendar(c: CalendarTabara, url?: string): string {
  const peOre = !!(c.sosire.ora && c.plecare.ora);
  const capete = peOre
    ? `${zi(c.sosire.data)}T${oraIcs(c.sosire.ora!)}/${zi(c.plecare.data)}T${oraIcs(c.plecare.ora!)}`
    : `${zi(c.sosire.data)}/${zi(ziuaUrmatoare(c.plecare.data))}`;
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: c.titlu,
    dates: capete,
    location: c.locatie,
  });
  if (peOre) q.set("ctz", "Europe/Bucharest");
  if (url) q.set("details", url);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Descarcă fișierul: pe iPhone și pe Android se deschide direct „Adaugă în calendar”, pe calculator calendarul implicit. */
export function descarcaIcs(continut: string, numeFisier: string) {
  const url = URL.createObjectURL(
    new Blob([continut], { type: "text/calendar;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = numeFisier.endsWith(".ics") ? numeFisier : `${numeFisier}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nume de fișier curat din titlu: „Autumn Sessions (demo)” → „autumn-sessions-demo.ics”. */
export function numeFisierIcs(titlu: string): string {
  const curat = titlu
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${curat || "tabara"}.ics`;
}
