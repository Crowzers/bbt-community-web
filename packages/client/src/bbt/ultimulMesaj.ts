import { createSignal } from "solid-js";

import type { Channel, Message } from "stoat.js";

const [aduse, setAduse] = createSignal<ReadonlyMap<string, Message>>(new Map());
const cerute = new Set<string>();

/**
 * BBT: ultimul mesaj al unei conversații, pentru rândul din listă. Copia lui `mobil/src/fir/ultimulMesaj.ts`.
 *
 * ⚠️ Serverul nu mută `last_message_id` la un mesaj de sistem, deci nici la un apel: o conversație în care s-a sunat doar
 * n-are deloc id-ul, iar una cu mesaje mai vechi îl are pe al ultimului text. `canal.lastMessage` singur nu vede apelul.
 */
export function ultimulMesaj(canal: Channel): Message | undefined {
  const dinCanal = canal.lastMessage;
  const adus = aduse().get(canal.id);
  if (!dinCanal || !adus) return dinCanal ?? adus;
  return adus.id > dinCanal.id ? adus : dinCanal;
}

/** Un mesaj pe conversație, o singură dată. */
export function aduUltimul(canal: Channel) {
  if (cerute.has(canal.id)) return;
  cerute.add(canal.id);
  void canal
    .fetchMessages({ limit: 1 })
    .then(([m]) => {
      if (m) setAduse((v) => new Map(v).set(canal.id, m));
    })
    .catch(() => cerute.delete(canal.id));
}
