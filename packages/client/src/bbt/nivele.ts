import { type Accessor, type Setter, createSignal } from "solid-js";

import { useState } from "@revolt/state";

import { BBT_ADMIN_URL } from "./config";

/**
 * Nivelele Power Score și inelul din jurul pozei. Design: `website/docs/plans/2026-11-18-inel-nivel-design.md`
 * (în monorepo-ul BBT). Aici stau datele (pragurile, culorile) și depozitul care află, pentru o listă întreagă
 * de oameni, ce inel poartă fiecare.
 */

export type CheieNivel =
  | "beginner"
  | "creator"
  | "producer"
  | "professional"
  | "elite"
  | "legend"
  | "icon";

/**
 * `'echipa'` e în AFARA scării, deliberat: echipa nu participă la experiențe, deci scorul ei n-ar spune nimic
 * (decizia userului, 18 nov 2026). Inelul ei e unic, iar mini-profilul arată „∞" în loc de scor.
 */
export type CheieInel = CheieNivel | "echipa";

/**
 * ⚠️ SINCRONIZARE: pragurile sunt o COPIE a lui `admin/lib/powerScore/barem.ts` (`NIVELE`), ca și cele din
 * `website/src/lib/powerScore.ts` și din aplicație. Schimbi un prag acolo, îl schimbi și aici: altfel harta din
 * mini-profil îi spune omului alt „Mai ai X XP" decât site-ul. Inelele din liste NU depind de copia asta (cheia
 * vine gata calculată de la admin); doar mini-profilul și harta o folosesc.
 *
 * Culoarea = culoarea principală a nivelului (§3), din paleta Slush (`CULORI_NIVEL` de pe site). Beginner n-are
 * inel; griul lui e doar pentru bulina din hartă.
 */
export const NIVELE: {
  cheie: CheieNivel;
  nume: string;
  prag: number;
  culoare: string;
}[] = [
  { cheie: "beginner", nume: "Beginner", prag: 0, culoare: "#8D8D9A" },
  { cheie: "creator", nume: "Creator", prag: 400, culoare: "#4DA2FF" },
  { cheie: "producer", nume: "Producer", prag: 2_000, culoare: "#5C4ADE" },
  {
    cheie: "professional",
    nume: "Professional",
    prag: 6_000,
    culoare: "#FFA8CD",
  },
  { cheie: "elite", nume: "Elite", prag: 15_000, culoare: "#FB4903" },
  { cheie: "legend", nume: "Legend", prag: 40_000, culoare: "#CA1A38" },
  { cheie: "icon", nume: "Icon", prag: 100_000, culoare: "#E5B300" },
];

/** Poziția omului pe scară: nivelul, următorul și cât mai are până la el (ca `nivelPentruScor` din admin). */
export function nivelPentruScor(scor: number) {
  const s = Math.max(0, Math.floor(scor || 0));
  let i = 0;
  for (let j = NIVELE.length - 1; j >= 0; j--) {
    if (s >= NIVELE[j].prag) {
      i = j;
      break;
    }
  }
  const curent = NIVELE[i];
  const urmator = NIVELE[i + 1] ?? null;
  return {
    index: i,
    curent,
    urmator,
    progres: urmator
      ? Math.min(
          1,
          Math.max(0, (s - curent.prag) / (urmator.prag - curent.prag)),
        )
      : 1,
    panaLaUrmator: urmator ? urmator.prag - s : 0,
  };
}

/** „2.000", ca pe site: `ro-RO` pune punctul la mii. */
export const formatXp = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

// ---------------------------------------------------------------------------------------------------------------------
// Depozitul: `stoatId → cheia inelului`, pentru listele de oameni.
// ---------------------------------------------------------------------------------------------------------------------

/**
 * O cerere poartă cel mult atâția oameni (`LA_CERERE` din `admin/lib/stoat/nivele.ts`; adminul refuză peste).
 */
const LA_CERERE = 200;

/**
 * Cât adunăm id-uri înainte de cerere. O listă de membri își desenează rândurile în același cadru, iar fiecare
 * rând cere omul lui: fără fereastra asta, 40 de rânduri ar fi făcut 40 de cereri.
 */
const ADUNARE_MS = 50;

/**
 * Cât ține un răspuns. Cât `max-age` de la admin: un nivel nou se vede în câteva minute, nu imediat (scorul din
 * listă e oricum cel din coloană, de la ultimul recalcul, §7). După atât, următoarea citire mai întreabă o dată,
 * dar inelul vechi rămâne pe poză până vine răspunsul, ca lista să nu clipească.
 */
const VALABIL_MS = 5 * 60_000;

type Intrare = {
  /** `null` = știm sigur că n-are inel (lipsea din răspuns); `undefined` = încă nu știm. */
  citeste: Accessor<CheieInel | null | undefined>;
  scrie: Setter<CheieInel | null | undefined>;
  aflatLa: number;
  inZbor: boolean;
};

const intrari = new Map<string, Intrare>();
const deCerut = new Set<string>();
let ceas: ReturnType<typeof setTimeout> | undefined;
let tokenCurent: () => string = () => "";

function intrare(id: string): Intrare {
  let e = intrari.get(id);
  if (!e) {
    const [citeste, scrie] = createSignal<CheieInel | null | undefined>(
      undefined,
    );
    e = { citeste, scrie, aflatLa: 0, inZbor: false };
    intrari.set(id, e);
  }
  return e;
}

function cere(id: string) {
  const e = intrare(id);
  // ⚠️ Nici de două ori același om, nici cât cererea lui e în zbor: o listă care se redesenează (derularea
  // listei virtuale montează rândurile din nou) altfel ar fi trimis aceleași id-uri în buclă.
  if (e.inZbor || deCerut.has(id) || Date.now() - e.aflatLa < VALABIL_MS)
    return;
  deCerut.add(id);
  ceas ??= setTimeout(trimite, ADUNARE_MS);
}

async function trimite() {
  ceas = undefined;
  const ids = [...deCerut];
  deCerut.clear();
  for (const id of ids) intrare(id).inZbor = true;

  for (let i = 0; i < ids.length; i += LA_CERERE) {
    const lot = ids.slice(i, i + LA_CERERE);
    // Loturile pleacă împreună: o listă de 500 de membri nu așteaptă trei drumuri unul după altul.
    void trimiteLot(lot);
  }
}

async function trimiteLot(lot: string[]) {
  try {
    const r = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/nivele`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Token": tokenCurent(),
      },
      body: JSON.stringify({ ids: lot }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const { inele } = (await r.json()) as { inele?: Record<string, CheieInel> };
    const acum = Date.now();
    for (const id of lot) {
      const e = intrare(id);
      e.scrie(inele?.[id] ?? null);
      e.aflatLa = acum;
    }
  } catch (e) {
    // La eroare (admin căzut, sesiune expirată): fără inel, fără să blocăm ceva. Nu marcăm omul ca aflat, deci
    // următoarea citire (alt rând montat, lista redeschisă) mai încearcă o dată.
    console.warn("[bbt] inelele de nivel n-au venit", e);
  } finally {
    for (const id of lot) intrare(id).inZbor = false;
  }
}

/**
 * Inelul unui om, reactiv: întâi `undefined`, apoi cheia (sau `null` = fără inel). Se cheamă dintr-o componentă
 * (are nevoie de sesiunea Stoat, ca cererea spre `/stoat/profil` din `MiniProfil.tsx`).
 */
export function useInelOm(
  id: () => string | undefined,
): () => CheieInel | null | undefined {
  const state = useState();
  tokenCurent = () => state.auth.getSession()?.token ?? "";
  return () => {
    const i = id();
    if (!i) return undefined;
    cere(i);
    return intrare(i).citeste();
  };
}
