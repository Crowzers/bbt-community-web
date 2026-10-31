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
  /** Când s-a plătit. Lipsește la un admin mai vechi decât 30 oct 2026 (ruta `/me` l-a primit atunci). */
  platitaLa?: string | null;
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
  contract?: {
    stare: "Trimis" | "Semnat" | "Expirat" | "Reziliat";
    numar: number;
    /** Calea de pe site a contractului (semnare sau PDF-ul semnat). `null` = îl semnează părintele sau firma. */
    link: string | null;
  } | null;
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
  // Profilul public (23f). `numeAfisat` = numele de scenă; `null` = se arată numele real.
  numeAfisat: string | null;
  bio: string | null;
  mainRole: string | null;
  mainGenre?: string | null;
  musicGenres: string[];
  /** Rețea → adresă (`instagram`, `spotify`, `soundcloud`…), curățate de admin la salvare. */
  socialLinks: Record<string, string> | null;
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
  diplome?: Diploma[];
}

/**
 * „Experiențele mele" (23b), din `GET /api/public/participant/experiente`.
 *
 * ⚠️ COPIA tipurilor `Experienta` / `PlataExperienta` din `admin/lib/reguli/experiente.ts` (la fel ca
 * `mobil/src/bbt/cont.ts`). Datele vin ca text ISO, nu `Date`. Dacă regula își schimbă forma, se schimbă în toate trei.
 */
export interface PlataExperienta {
  fel: "camp" | "curs";
  comandaId: string;
  titlu: string;
  /** Cu penalizarea inclusă: cifra din buton și suma din Stripe sunt aceeași. */
  suma: number;
  /** 1 sau 2; la plata integrală, 1. */
  numarTransa: number;
  scadentaLa: string | null;
  intarziat: boolean;
  /** `contract` = întâi semnătura, plata vine după. */
  actiune: "transa1" | "integral" | "transa2" | "contract";
  /** Doar la `contract`: calea de pe site unde semnezi. `null` = semnează părintele sau firma, de pe emailul lor. */
  linkContract: string | null;
  semnatar: "tu" | "parinte" | "firma" | null;
}

export interface Experienta {
  fel: "camp" | "curs" | "workshop";
  /** Id-ul evenimentului (camp, curs, workshop). */
  id: string;
  comandaId: string | null;
  titlu: string;
  locatie: string | null;
  afisUrl: string | null;
  dataStart: string;
  dataEnd: string | null;
  /** Evenimentul ține azi (ziua românească). */
  azi: boolean;
  /** Zile până la start; 0 sau negativ când a început. */
  zilePanaLa: number;
  plata: PlataExperienta | null;
  progres: { platit: number; total: number; nrTranse: number } | null;
  /** Codul biletului de workshop; taberele n-au bilet. */
  qr: string | null;
  areDiploma: boolean;
}

export interface Experiente {
  active: Experienta[];
  trecute: Experienta[];
}

/** O notificare din cont (`/api/public/participant/notificari`), ca în aplicație. */
export interface Notificare {
  id: string;
  titlu: string;
  mesaj: string;
  linkHref: string | null;
  citita: boolean;
  createdAt: string;
}
