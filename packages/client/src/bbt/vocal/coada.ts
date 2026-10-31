import type { Message } from "stoat.js";

import { durataVocal } from "./nume";

/**
 * BBT: după un vocal pornește singur doar următorul din aceeași serie (`mobil/src/fir/coadaVocale.ts`). Seria ține cât timp
 * vorbește același om: un text al lui nu o rupe, dar primul mesaj al altcuiva, fie și doar text, o închide. Mesajele de
 * sistem și cele ale oamenilor blocați nu rup seria: nu le-a spus nimeni din fir, respectiv nu se văd.
 *
 * @param mesaje mesajele canalului, de la cel mai vechi la cel mai nou
 */
export function urmatorulVocal(mesaje: Message[], fisierId: string) {
  let serie = 0;
  let autor: string | undefined;
  let serieCurenta: number | undefined;
  for (const m of mesaje) {
    if (m.systemMessage || m.author?.relationship === "Blocked") continue;
    if (m.authorId !== autor) {
      serie++;
      autor = m.authorId;
    }
    for (const f of m.attachments ?? []) {
      if (durataVocal(f.filename) === null) continue;
      if (serieCurenta !== undefined)
        return serie === serieCurenta ? f.id : undefined;
      if (f.id === fisierId) serieCurenta = serie;
    }
  }
  return undefined;
}
