import { BBT_ADMIN_URL } from "../../config";
import { cerereCont } from "../../tokenBbt";

/**
 * BBT: un flux SSE de la adminul BBT (playlistul unei tabere), din hub. Versiunea scurtă a lui
 * `website/src/lib/streamCuToken.ts`, fără reluare pe `seq`: playlistul refetch-uiește lista
 * întreagă la fiecare eveniment, deci un eveniment pierdut nu lasă nimic în urmă.
 *
 * ⚠️ În URL pleacă un BILET de 30 de secunde (`participant/bilet-stream`), NICIODATĂ access
 * token-ul: query string-ul ajunge în logurile de acces și e citibil de orice script de pe pagină.
 * Motivul complet e la `iaBiletStream` pe site.
 *
 * ⚠️ Reconectarea o facem NOI, cu bilet nou. `EventSource` s-ar reconecta singur cu URL-ul vechi,
 * adică exact cu biletul expirat, și ar primi 401 la nesfârșit fără niciun semn (bug-ul vechi al
 * playlistului de pe site, „nu mai e live după ~15 minute").
 */
const TACERE_MAXIMA_MS = 50_000; // serverul dă puls la 20s

export function deschideStreamCont(
  sesiune: () => string,
  cale: (bilet: string) => string,
  laMesaj: () => void,
): { inchide: () => void } {
  let es: EventSource | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tacere: ReturnType<typeof setTimeout> | undefined;
  let esuari = 0;
  let inchis = false;

  const programeaza = () => {
    if (inchis || timer) return;
    clearTimeout(tacere);
    esuari++;
    const ms = Math.min(30_000, 1000 * 2 ** Math.min(esuari, 5));
    timer = setTimeout(() => {
      timer = undefined;
      void conecteaza();
    }, ms);
  };

  /** Conexiunea moartă care pare vie (proxy care ține socketul) se vede doar prin tăcere. */
  const atinge = () => {
    clearTimeout(tacere);
    tacere = setTimeout(() => {
      es?.close();
      es = null;
      programeaza();
    }, TACERE_MAXIMA_MS);
  };

  async function conecteaza() {
    if (inchis) return;
    let bilet: string | null = null;
    try {
      const r = await cerereCont<{ bilet?: string }>(
        sesiune(),
        "/api/public/participant/bilet-stream",
        {
          method: "POST",
        },
      );
      bilet = r.bilet ?? null;
    } catch {
      bilet = null;
    }
    if (inchis) return;
    if (!bilet) return programeaza();

    es?.close();
    es = new EventSource(`${BBT_ADMIN_URL}${cale(bilet)}`);
    es.onopen = () => {
      esuari = 0;
      atinge();
    };
    es.onmessage = (e) => {
      esuari = 0;
      atinge();
      // Cadrele de transport (puls, gata) nu sunt schimbări în playlist.
      try {
        const cadru = JSON.parse(e.data) as { tip?: string };
        if (
          cadru &&
          typeof cadru.tip === "string" &&
          ["gata", "reluat", "resync", "puls"].includes(cadru.tip)
        ) {
          return;
        }
      } catch {
        // playlistul trimite text, nu JSON: e un eveniment real
      }
      laMesaj();
    };
    es.onerror = () => {
      es?.close();
      es = null;
      programeaza();
    };
  }

  // Taburile de fundal își pierd conexiunea; la revenire o refacem imediat.
  const laVizibilitate = () => {
    if (document.visibilityState === "visible" && !es && !timer)
      void conecteaza();
  };
  document.addEventListener("visibilitychange", laVizibilitate);
  void conecteaza();

  return {
    inchide() {
      inchis = true;
      clearTimeout(timer);
      clearTimeout(tacere);
      es?.close();
      es = null;
      document.removeEventListener("visibilitychange", laVizibilitate);
    },
  };
}
