import { useQuery } from "@tanstack/solid-query";

import { useState } from "@revolt/state";

import { cerereCont } from "../tokenBbt";

import type { Experiente, Participant } from "./tipuri";

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

/**
 * „Experiențele mele" (23b): taberele, cursurile și biletele la workshop, gata ordonate și cu plata de făcut.
 *
 * ⚠️ Aceeași rută ca tab-ul Experiențe din aplicația de telefon (`participant/experiente`). Ce apare și ce se poate
 * plăti decide adminul (`admin/lib/reguli/experiente.ts`), nu hub-ul: regulile despre bani nu se scriu a treia oară.
 * Cheia începe cu `CHEIE_CONT`, ca orice `invalidateQueries` pe cont (după o plată, după o anulare) s-o reîncarce.
 */
export function useExperiente() {
  const sesiune = useSesiune();
  return useQuery(() => ({
    queryKey: [...CHEIE_CONT, "experiente"],
    enabled: Boolean(sesiune()),
    staleTime: 30_000,
    retry: 1,
    queryFn: () =>
      cerereCont<Experiente>(sesiune(), "/api/public/participant/experiente"),
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

/** „15 nov. 2026", pentru listele care trec dintr-un an în altul (tranzacțiile din 23d). */
export const ziCuAn = (d: string) =>
  new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

// „950 lei", ca în 23 și în aplicația de telefon (până pe 30 oct, „950 RON", ca pe site).
export const lei = (n: number) => `${n.toLocaleString("ro-RO")} lei`;

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
