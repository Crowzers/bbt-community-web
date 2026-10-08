import type { Channel } from "stoat.js";

import { BBT_ADMIN_URL } from "./config";

/**
 * Cine pornește un apel în mesaje directe îi anunță și prin BBT: adminul trimite celorlalți o
 * notificare „X te sună" — push pe telefon (aplicația BBT, FCM) și în browser, plus clopoțelul de pe
 * site.
 *
 * De ce (8 oct 2026, „când suni pe cineva nu sună la celălalt"): proba în hubsim a arătat că serverul
 * Stoat anunță apelul corect și că `ApelPrimit` apare — dar DOAR cât hub-ul e deschis. Cu telefonul
 * blocat, cu aplicația în fundal sau cu hub-ul închis, nu ajungea nimic: push-ul Stoat merge doar
 * prin service worker-ul lor, care nu există în aplicația nativă și pe care aproape nimeni nu l-a
 * activat. Notificările BBT ajung deja pe toate drumurile astea.
 *
 * Fără `await` la apelant și fără erori aruncate: un admin căzut nu are voie să strice apelul.
 */
export function anuntaApelul(canal: Channel, sesiune: string | undefined) {
  if (!sesiune) return;
  void fetch(`${BBT_ADMIN_URL}/api/public/stoat/apel`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Session-Token": sesiune },
    body: JSON.stringify({ canal: canal.id }),
  }).catch(() => {});
}
