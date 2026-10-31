import { BBT_ADMIN_URL } from "./config";

/**
 * BBT: raportul din hub pleacă la admin, iar moderatorii îl citesc în Administrare din aplicația
 * mobilă.
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

/**
 * Aruncă `Error` cu textul de arătat omului: câmpul `error` din răspuns, gata scris în română.
 */
export async function trimiteRaportul(
  sesiune: string,
  cerere: CerereRaport & { motiv: MotivRaport; detalii: string },
) {
  const raspuns = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/rapoarte`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Session-Token": sesiune },
    body: JSON.stringify(cerere),
  }).catch(() => null);
  if (raspuns?.ok) return;

  const corp = (await raspuns?.json().catch(() => null)) as
    | { error?: string }
    | null
    | undefined;
  throw new Error(corp?.error ?? "Raportul n-a plecat. Încearcă din nou.");
}
