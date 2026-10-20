/**
 * BBT: forma răspunsului `/api/public/participant/me`, cât folosește contul din hub.
 * Design: `website/docs/plans/2026-10-20-hub-standalone-cont-design.md`.
 *
 * ⚠️ COPIA lui `website/src/types/participant.ts` (+ `BiletWorkshop` din
 * `website/src/lib/starePersonala.ts`). Fork-ul e alt repo, nu poate importa de acolo. Dacă ruta
 * `/me` își schimbă forma, se schimbă în AMBELE locuri. Aici stau doar câmpurile citite de hub:
 * un câmp declarat și necitit ar fi o promisiune pe care n-o verifică nimeni.
 */

export interface Plata {
  id: string;
  numarTransa: number;
  suma: number;
  /** Asteptata | Platita | Rambursata | RambursataPartial */
  status: string;
  scadentaLa: string | null;
  sumaRambursata: number | null;
  fgoFacturaNumar: string | null;
  fgoFacturaSerie: string | null;
  fgoFacturaLink: string | null;
}

export interface Camp {
  id: string;
  slug?: string;
  nume: string;
  dataStart: string;
  dataEnd: string;
  locatie: string;
  durataText: string;
  imgUrl?: string;
}

export interface Inscriere {
  id: string;
  numarComanda: string | null;
  nrTranse: number;
  /** Platit | Partial | Anulat | Abandonat | … */
  statusPlata: string;
  penalizareTransa2?: number;
  zileIntarziereTransa2?: number;
  /** Prelungirea vorbită la telefon. ⚠️ Fără motiv și fără seller: alea rămân în admin. */
  prelungireTransa2?: { zile: number; scadentaNoua: string } | null;
  cerereAnulare?: { id: string; status: string } | null;
  plati: Plata[];
  camp: Camp;
}

export interface Curs {
  id: string;
  slug: string;
  titlu: string;
  formator: string;
  dataStart: string;
  dataEnd: string | null;
  locatie: string;
  imgUrl?: string | null;
}

export interface InscriereCurs {
  id: string;
  numarComanda: string | null;
  nrTranse: number;
  statusPlata: string;
  curs: Curs;
  plati: Plata[];
  penalizareTransa2?: number;
  zileIntarziereTransa2?: number;
  prelungireTransa2?: { zile: number; scadentaNoua: string } | null;
}

export interface BiletWorkshop {
  id: string;
  cod: string;
  suma: number;
  workshop: {
    id: string;
    slug: string;
    titlu: string;
    dataStart: string;
    locatie: string;
  };
}

export interface Participant {
  id: string;
  numeComplet: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  phoneVerified: boolean;
  inscrieri?: Inscriere[];
  inscrieriCurs?: InscriereCurs[];
  bileteWorkshop?: BiletWorkshop[];
}
