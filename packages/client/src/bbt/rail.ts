import { createSignal } from "solid-js";

/**
 * BBT: pastila din stânga se deschide la 200, cu numele lângă iconițe (25f): din logo, din tastatură (⌘. sau Ctrl+.), iar starea
 * se ține minte. Implicit e închisă (25e), ca ecranul să rămână al chat-ului.
 *
 * Pe tabletă și pe ferestre scunde rămâne închisă: la 200, chat-ul ar rămâne sub 300 de lățime. Prag ales de noi, macheta nu
 * desenează cazul.
 */

const CHEIE = "bbt.rail-deschis";

function citeste() {
  try {
    return localStorage.getItem(CHEIE) === "da";
  } catch {
    return false;
  }
}

const [dorit, setDorit] = createSignal(citeste());

const loc = window.matchMedia("(min-width: 1100px) and (min-height: 601px)");
const [incape, setIncape] = createSignal(loc.matches);
loc.addEventListener("change", () => setIncape(loc.matches));

export const railDeschis = () => dorit() && incape();
export const poateDeschide = incape;
export const latimeRail = () => (railDeschis() ? "200px" : "52px");

export function comutaRail() {
  const urmator = !dorit();
  setDorit(urmator);
  try {
    localStorage.setItem(CHEIE, urmator ? "da" : "nu");
  } catch {
    // Doar o comoditate: fără stocare, pastila revine închisă la următoarea pornire.
  }
}

/** ⌘. pe Mac, Ctrl+. pe Windows. */
export function tastaRail(e: KeyboardEvent) {
  if (e.key === "." && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    comutaRail();
  }
}
