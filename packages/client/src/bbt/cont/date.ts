import { useQuery } from "@tanstack/solid-query";

import { useState } from "@revolt/state";

import { cerereCont } from "../tokenBbt";

import type { Participant } from "./tipuri";

/**
 * BBT: datele contului din hub, dintr-o singură cerere `/me`, împărțită de toate paginile.
 *
 * ⚠️ O singură cheie de query pentru TOT contul, ca pe site: My Camps, plățile și workshopurile
 * citesc același răspuns. Trei chei ar fi însemnat trei cereri identice la fiecare schimbare de
 * pagină și, mai rău, trei instantanee care pot să nu fie de acord între ele (o tranșă plătită
 * între două cereri apărea plătită pe o pagină și restantă pe alta).
 */
export const CHEIE_CONT = ["bbt-cont-me"];

export function useSesiune() {
  const state = useState();
  return () => state.auth.getSession()?.token ?? "";
}

export function useCont() {
  const sesiune = useSesiune();
  return useQuery(() => ({
    queryKey: CHEIE_CONT,
    enabled: Boolean(sesiune()),
    staleTime: 30_000,
    retry: 1,
    queryFn: () =>
      cerereCont<Participant>(sesiune(), "/api/public/participant/me"),
  }));
}

/** Ziua după ceasul României, oriunde ar fi omul (ca pe site, `timeZone: Europe/Bucharest`). */
const TZ = "Europe/Bucharest";

export const zi = (d: string) =>
  new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });

export const ziLunga = (d: string) =>
  new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });

export const ziCuSaptamana = (d: string) =>
  new Date(d).toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

export const ora = (d: string) =>
  new Date(d).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });

export const lei = (n: number) => `${n.toLocaleString("ro-RO")} RON`;

export function zilePana(d: string) {
  const azi = new Date();
  azi.setHours(0, 0, 0, 0);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - azi.getTime()) / 86_400_000);
}

export const inDesfasurare = (start: string, sfarsit: string) => {
  const acum = new Date();
  return new Date(start) <= acum && new Date(sfarsit) >= acum;
};

export const inViitor = (start: string) => new Date(start) > new Date();

/**
 * Înscrierile anulate sau abandonate nu apar în listele de tabere/cursuri: rămân doar în istoricul
 * plăților, cu refundul lor. Aceeași regulă ca `reala` din `website/src/app/dashboard/mycamps`.
 */
export const reala = (statusPlata: string) =>
  statusPlata !== "Anulat" && statusPlata !== "Abandonat";
