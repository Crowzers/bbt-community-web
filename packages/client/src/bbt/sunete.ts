import { createSignal } from "solid-js";

import marimba00 from "./sunete/marimba-0-0.wav?url";
import marimba01 from "./sunete/marimba-0-1.wav?url";
import marimba10 from "./sunete/marimba-1-0.wav?url";
import marimba11 from "./sunete/marimba-1-1.wav?url";
import marimba20 from "./sunete/marimba-2-0.wav?url";
import marimba21 from "./sunete/marimba-2-1.wav?url";
import marimba30 from "./sunete/marimba-3-0.wav?url";
import marimba31 from "./sunete/marimba-3-1.wav?url";
import marimba40 from "./sunete/marimba-4-0.wav?url";
import marimba41 from "./sunete/marimba-4-1.wav?url";
import marimba50 from "./sunete/marimba-5-0.wav?url";
import marimba51 from "./sunete/marimba-5-1.wav?url";
import trimis0 from "./sunete/trimis-0.wav?url";
import trimis1 from "./sunete/trimis-1.wav?url";
import trimis2 from "./sunete/trimis-2.wav?url";

/**
 * BBT: sunetele din `mobil/src/ui/sunete.ts`, aceleași fișiere de marimba. Două variante pe fiecare treaptă, alese la
 * întâmplare: aceeași lovitură repetată identic face sunetele de interfață să pară de jucărie.
 *
 * Pornite implicit pe telefon, oprite implicit pe desktop: pe calculator omul stă des în difuzoare, în birou sau în apel.
 * Se schimbă din Profil (telefon) și din Notificări (desktop).
 */
const NOTE = [
  [marimba00, marimba01],
  [marimba10, marimba11],
  [marimba20, marimba21],
  [marimba30, marimba31],
  [marimba40, marimba41],
  [marimba50, marimba51],
];
const TRIMIS = [trimis0, trimis1, trimis2];

const CHEIE = "bbt.sunete";

function citeste() {
  try {
    const v = localStorage.getItem(CHEIE);
    if (v) return v === "da";
  } catch {
    // Stocare blocată: rămâne regula implicită.
  }
  return window.matchMedia("(max-width: 599px)").matches;
}

const [sunetePornite, setSunetePornite] = createSignal(citeste());

export { sunetePornite };

export function comutaSunetele() {
  const urmator = !sunetePornite();
  setSunetePornite(urmator);
  try {
    localStorage.setItem(CHEIE, urmator ? "da" : "nu");
  } catch {
    // Rămâne pornit sau oprit doar până la reîncărcare.
  }
}

function canta(sursa: string) {
  if (!sunetePornite()) return;
  const a = new Audio(sursa);
  a.volume = 0.7;
  // Browserul refuză sunetul înainte de primul gest; acțiunea merge oricum.
  void a.play().catch(() => {});
}

// Reacțiile puse repede urcă pe scală, iar după o pauză se întorc la prima notă: cântă, nu doar repetă.
const PAUZA_MS = 1400;
let treapta = 0;
let ultima = 0;

export function sunetReactie() {
  const acum = Date.now();
  if (acum - ultima > PAUZA_MS) treapta = 0;
  ultima = acum;
  const variante = NOTE[Math.min(treapta, NOTE.length - 1)];
  canta(variante[Math.floor(Math.random() * variante.length)]);
  treapta++;
}

export function sunetTrimis() {
  canta(TRIMIS[Math.floor(Math.random() * TRIMIS.length)]);
}
