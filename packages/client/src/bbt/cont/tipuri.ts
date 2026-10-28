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
  /**
   * Contractul de prestări (doar vânzările prin seller). Aici contează doar `stare`: cât e „Trimis",
   * serverul refuză plata cu „Semnează întâi contractul", deci butonul de tranșa 1 nu apare.
   * Forma întreagă e în `website/src/types/participant.ts` (`ContractCont`).
   */
  contract?: { stare: "Trimis" | "Semnat" | "Expirat" | "Reziliat" } | null;
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

export interface WishlistItem {
  campId: string;
  camp: {
    id: string;
    slug?: string;
    nume: string;
    dataStart: string;
    locatie: string;
    pretTransa1: number;
    statusPublic?: string;
  };
}

/**
 * ⚠️ Câmpurile sunt INSTANTANEUL de pe act (`titluCurs`, `formator`), nu date citite din curs:
 * dacă un curs se redenumește, diploma emisă spune tot ce scrie pe PDF.
 */
export interface Diploma {
  cod: string;
  titluCurs: string;
  formator: string;
  dataEmitere: string;
  prezente: number;
  intalniriLuate: number;
  urlPdf: string | null;
}

export interface Participant {
  id: string;
  numeComplet: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  // Setări cont (Faza 6). Numele real e despărțit în prenume + nume; `numeComplet` se recompune din ele.
  prenume: string | null;
  numeFamilie: string | null;
  telefon: string | null;
  dataNasterii: string | null;
  tara: string | null;
  oras: string | null;
  judet: string | null;
  adresa: string | null;
  gen: string | null;
  // Facturarea: la persoană fizică factura merge pe numele și adresa de mai sus
  // (`admin/lib/fgo.ts:clientFGODinParticipant`); câmpurile de mai jos contează doar la firmă.
  tipPersoana: string | null;
  denumireFacturare: string | null;
  cuiFacturare: string | null;
  nrRegCom: string | null;
  adresaFacturare: string | null;
  judetFacturare: string | null;
  localitateFacturare: string | null;
  inscrieri?: Inscriere[];
  inscrieriCurs?: InscriereCurs[];
  bileteWorkshop?: BiletWorkshop[];
  wishlistItems?: WishlistItem[];
  diplome?: Diploma[];
}
