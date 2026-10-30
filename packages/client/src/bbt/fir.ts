import { createSignal } from "solid-js";

import type { Message } from "stoat.js";

/**
 * BBT: răspunsurile strânse într-un fir, pe telefon (macheta 24a/24b, cererea userului, 31 oct 2026): în canal rămâne
 * mesajul, cu o pastilă „4 răspunsuri", iar răspunsurile se văd doar după ce o apeși, pe ecranul lor.
 *
 * ⚠️ Stoat n-are fire: un răspuns e un mesaj obișnuit din canal, cu `replyIds`. Gruparea e doar aici, în interfață, peste
 * mesajele încărcate. Un răspuns al cărui mesaj original nu e încărcat rămâne în canal, cu citatul lui deasupra, și intră
 * în fir când derulezi până la original. Răspunsul la un răspuns merge în același fir, la mesajul de la care a pornit.
 */

export type Grupare = {
  /** Răspunsurile fiecărui mesaj original, de la cel mai vechi la cel mai nou. */
  firuri: ReadonlyMap<string, Message[]>;
  /** Pentru fiecare răspuns, mesajul de la care a pornit firul. */
  radacini: ReadonlyMap<string, string>;
};

const GOL: Grupare = { firuri: new Map(), radacini: new Map() };

const [grupare, setGrupare] = createSignal<Grupare>(GOL);
const [firDeschis, setFirDeschis] = createSignal<string>();

export { firDeschis, grupare, setGrupare };

/** @param mesaje Mesajele canalului, de la cel mai nou la cel mai vechi, ca în `Messages.tsx`. */
export function grupeazaRaspunsuri(mesaje: Message[]): Grupare {
  const incarcate = new Set(mesaje.map((m) => m.id));
  const firuri = new Map<string, Message[]>();
  const radacini = new Map<string, string>();

  for (let i = mesaje.length - 1; i >= 0; i--) {
    const mesaj = mesaje[i];
    const parinte = mesaj.replyIds?.[0];
    if (!parinte || !incarcate.has(parinte)) continue;

    const radacina = radacini.get(parinte) ?? parinte;
    radacini.set(mesaj.id, radacina);
    if (mesaj.author?.relationship === "Blocked") continue;

    const fir = firuri.get(radacina);
    if (fir) fir.push(mesaj);
    else firuri.set(radacina, [mesaj]);
  }

  return { firuri, radacini };
}

export const faraGrupare = () => setGrupare(GOL);

export const deschideFir = (id: string) =>
  setFirDeschis(grupare().radacini.get(id) ?? id);

export const inchideFir = () => setFirDeschis(undefined);

/** „acum 2 min", ca în 24a. Scris aici, nu din dayjs: pe pastilă încape doar forma scurtă. */
export function cuCatTimpInUrma(data: Date) {
  const minute = Math.floor((Date.now() - +data) / 60000);
  if (minute < 1) return "acum";
  if (minute < 60) return `acum ${minute} min`;
  const ore = Math.floor(minute / 60);
  if (ore < 24) return `acum ${ore} h`;
  const zile = Math.floor(ore / 24);
  if (zile === 1) return "ieri";
  if (zile < 7) return `acum ${zile} zile`;
  return data.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export const numarRaspunsuri = (n: number) =>
  n === 1 ? "1 răspuns" : `${n} răspunsuri`;
