import { createEffect, createMemo, on } from "solid-js";

import type { Server } from "stoat.js";

import { useClient } from "@revolt/client";

/**
 * Câți oameni sunt online și câți sunt în total pe server. Lista de membri se aduce o dată pe sesiune (`syncMembers` ține
 * minte), aceeași pe care o folosește și coloana de membri.
 */
export function useNumarMembri(server: () => Server | undefined) {
  const client = useClient();

  createEffect(
    on(
      () => server(),
      (s) => void s?.syncMembers().catch(() => {}),
    ),
  );

  return createMemo(() => {
    const id = server()?.id;
    let total = 0;
    let online = 0;
    for (const membru of client().serverMembers.values()) {
      if (membru.id.server !== id) continue;
      total++;
      if (membru.user?.online) online++;
    }
    return { total, online };
  });
}

/** „2 online · 140 membri" */
export function textMembri(n: { total: number; online: number }) {
  const cifra = (x: number) => x.toLocaleString("ro-RO");
  return `${cifra(n.online)} online · ${cifra(n.total)} ${n.total === 1 ? "membru" : "membri"}`;
}
