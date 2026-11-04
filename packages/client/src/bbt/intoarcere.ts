import { createEffect, on } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

/**
 * BBT: drumul înapoi din Experiențe și Profil spre listă, pe telefon (S1, 4 nov 2026, decizia 11). Până atunci le ținea pastila
 * de jos (`PastilaDeJos`), cu un tab pentru fiecare; acum se intră din „Experiențele tale" și din cardul contului, deci ieșirea
 * trebuie să ducă exact în lista de unde ai plecat (canalele sau mesajele), nu în prima.
 *
 * ⚠️ Adresa listei se ține minte la plecare: `navigate(-1)` ar fi ieșit din hub la o intrare direct pe `/cont` (link primit).
 */
let deUnde: string | undefined;
let inchideLaSosire = false;

/** Se cheamă la plecarea din listă spre o pagină din cont. */
export function tineMinteLista(cale: string) {
  if (!cale.startsWith("/cont")) deUnde = cale;
}

export function useInapoiLaLista() {
  const client = useClient();
  const navigate = useNavigate();

  return () => {
    const s = client().servers.toList()[0];
    inchideLaSosire = true;
    navigate(deUnde ?? (s ? `/server/${s.id}` : "/friends"));
  };
}

/**
 * Închide panoul de deasupra listei când adresa a ajuns. ⚠️ În efectul pe rută, nu la apăsare și nu într-un
 * `requestAnimationFrame`: așa lista nouă și închiderea ajung în același cadru (altfel se vedea o clipă lista veche, respectiv
 * pagina goală de sub cont, cum se vedea la pastilă). Montat o singură dată, în `interface/Sidebar.tsx`.
 */
export function useInchidereLaSosire() {
  const state = useState();
  const location = useLocation();
  createEffect(
    on(
      () => location.pathname,
      () => {
        if (inchideLaSosire) state.appDrawer()?.setShown(false);
        inchideLaSosire = false;
      },
      { defer: true },
    ),
  );
}
