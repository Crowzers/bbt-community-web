import { BBT_ADMIN_URL } from "./config";

/**
 * BBT: raportul din hub pleacă la admin, iar moderatorii îl citesc în Administrare din aplicația
 * mobilă și în hub, la `/cont/rapoarte` (`cont/Rapoarte.tsx`).
 *
 * ⚠️ Nu la Stoat (`POST /safety/report`), ca până pe 31 oct: `stoat-api` n-are rută de citire, deci
 * omul raporta și nu vedea nimeni raportul.
 *
 * Motivele sunt `MOTIVE_RAPORT` din `admin/lib/stoat/rapoarte.ts`. Adminul respinge orice altă cheie:
 * un motiv nou intră întâi acolo.
 */
export type MotivRaport =
  | "Harassment"
  | "UnsolicitedSpam"
  | "ScamsFraud"
  | "PromotesHarm"
  | "Illegal"
  | "SpamAbuse"
  | "InappropriateProfile"
  | "Impersonation"
  | "Underage"
  | "NoneSpecified";

type CerereRaport =
  | { tip: "User"; id: string }
  | { tip: "Message"; id: string; canalId: string };

/** Câmpul `error` din răspuns, gata scris în română. */
async function textEroare(raspuns: Response | null, implicit: string) {
  const corp = (await raspuns?.json().catch(() => null)) as
    | { error?: string }
    | null
    | undefined;
  return corp?.error ?? implicit;
}

const antete = (sesiune: string) => ({ "X-Session-Token": sesiune });

/**
 * Aruncă `Error` cu textul de arătat omului.
 */
export async function trimiteRaportul(
  sesiune: string,
  cerere: CerereRaport & { motiv: MotivRaport; detalii: string },
) {
  const raspuns = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/rapoarte`, {
    method: "POST",
    headers: { "content-type": "application/json", ...antete(sesiune) },
    body: JSON.stringify(cerere),
  }).catch(() => null);
  if (raspuns?.ok) return;
  throw new Error(
    await textEroare(raspuns, "Raportul n-a plecat. Încearcă din nou."),
  );
}

export type Raport = {
  id: string;
  tip: "Message" | "User";
  motiv: string;
  detalii: string | null;
  autorNume: string;
  tintaStoatId: string;
  tintaNume: string;
  canalNume: string | null;
  continut: string | null;
  createdAt: string;
};

/**
 * Rapoartele deschise. `null` = omul n-are voie la ele: dreptul îl decide adminul (`moderatorRapoarte`), din contul BBT,
 * nu din permisiunile Stoat, deci pagina apare doar după răspunsul lui.
 */
export async function incarcaRapoarte(
  sesiune: string,
): Promise<Raport[] | null> {
  const raspuns = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/rapoarte`, {
    headers: antete(sesiune),
  }).catch(() => null);
  if (raspuns?.status === 403) return null;

  const corp = (await raspuns?.json().catch(() => null)) as
    | { rapoarte?: Raport[] }
    | null
    | undefined;
  if (!raspuns?.ok || !Array.isArray(corp?.rapoarte)) {
    throw new Error("Rapoartele nu se încarcă acum.");
  }
  return corp.rapoarte;
}

/** Aruncă `Error` cu textul de arătat omului („Raportul nu mai e deschis", dacă l-a închis alt moderator). */
export async function rezolvaRaportul(sesiune: string, id: string) {
  const raspuns = await fetch(
    `${BBT_ADMIN_URL}/api/public/stoat/rapoarte/${id}`,
    { method: "PATCH", headers: antete(sesiune) },
  ).catch(() => null);
  if (raspuns?.ok) return;
  throw new Error(
    await textEroare(raspuns, "Raportul nu s-a închis. Încearcă din nou."),
  );
}

/** Textele din `mobil/src/fir/Raportare.tsx`, ca moderatorul să citească același motiv în aplicație și în hub. */
const TEXTE_MOTIV: Record<MotivRaport, string> = {
  Harassment: "Hărțuire sau jigniri",
  UnsolicitedSpam: "Spam sau reclame",
  ScamsFraud: "Înșelătorie",
  PromotesHarm: "Violență sau încurajează rănirea",
  Illegal: "Conținut ilegal",
  SpamAbuse: "Trimite spam sau hărțuiește",
  InappropriateProfile: "Profil nepotrivit",
  Impersonation: "Se dă drept altcineva",
  Underage: "Pare să aibă sub vârsta minimă",
  NoneSpecified: "Alt motiv",
};

export const textMotiv = (cheie: string) =>
  TEXTE_MOTIV[cheie as MotivRaport] ?? cheie;
