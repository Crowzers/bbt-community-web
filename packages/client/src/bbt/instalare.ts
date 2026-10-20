import { createSignal } from "solid-js";

/**
 * BBT: instalarea hub-ului ca aplicație pe calculator (20 oct 2026).
 *
 * Cererea userului: un buton mare „Instalează pe Windows" / „Instalează pe Mac", lângă cont. Aplicația
 * Electron din planul din 7 sept (`website/docs/plans/2026-09-07-aplicatii-desktop-mobile-design.md`,
 * Faza 2) NU există: n-are instalatoare și nici semnare. Întrebat, userul a ales PWA-ul hub-ului, care
 * merge de azi: manifestul și service workerul există deja (`vite.config.ts`). Instalat din Chrome sau
 * Edge, hub-ul primește fereastra lui, iconiță în taskbar sau în Dock și notificări.
 *
 * ⚠️ DE CE ASCULTĂM AICI, LA ÎNCĂRCAREA MODULULUI, ȘI NU ÎN COMPONENTĂ. Chrome trimite
 * `beforeinstallprompt` o singură dată, devreme, de obicei înainte ca bara de sus să existe (ea apare
 * abia după login și sincronizare). Un ascultător pus în `onMount` l-ar rata, iar butonul ar cădea
 * mereu pe varianta cu pași, deși browserul putea deschide fereastra de instalare direct. De-aia
 * modulul e importat din `index.tsx`, înaintea randării.
 *
 * ⚠️ `preventDefault()` e obligatoriu ca să păstrăm evenimentul pentru clic. `prompt()` merge o
 * singură dată pe eveniment; după un refuz, Chrome poate trimite altul mai târziu.
 */

type EvenimentInstalare = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type Sistem = "windows" | "mac";

const [eveniment, setEveniment] = createSignal<EvenimentInstalare | null>(null);
const [instalata, setInstalata] = createSignal(ruleazaCaAplicatie());

function ruleazaCaAplicatie() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    // Safari pe Mac, deschis din Dock.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setEveniment(e as EvenimentInstalare);
  });
  window.addEventListener("appinstalled", () => {
    setEveniment(null);
    setInstalata(true);
  });
}

/**
 * Windows sau Mac, după browser. Orice altceva (telefon, tabletă, Linux) = `null`, adică fără buton:
 * pe telefon „instalarea" e altă poveste (aplicațiile din magazine), iar pe Linux userul n-a cerut.
 *
 * ⚠️ iPad-ul se dă drept Mac. Safari pe iPad trimite din 2019 același user agent ca pe macOS, ca să
 * primească site-urile de desktop. Singurul semn e ecranul tactil: un Mac n-are `maxTouchPoints`.
 */
export function sistemDesktop(): Sistem | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return null;
  if (/Windows NT/.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/.test(ua)) {
    return navigator.maxTouchPoints > 1 ? null : "mac";
  }
  return null;
}

/** Ce browser, doar cât să alegem pașii potriviți când nu putem deschide fereastra direct. */
export function browser(): "chromium" | "safari" | "firefox" | "altul" {
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Edg\/|Chrome\//.test(ua)) return "chromium";
  if (/Safari\//.test(ua)) return "safari";
  return "altul";
}

/**
 * Aplicațiile noastre native își poartă singure rama. În ele butonul n-are ce căuta (puntea din
 * `website/src/lib/nativ.ts`: `window.Capacitor`, `window.bbtDesktop`).
 */
function inAplicatieNativa() {
  const w = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
    bbtDesktop?: unknown;
  };
  return Boolean(w.bbtDesktop || w.Capacitor?.isNativePlatform?.());
}

export const instalare = {
  /** Butonul se arată doar pe Windows/Mac, în browser, cât hub-ul nu rulează deja ca aplicație. */
  vizibil: () =>
    !instalata() && !inAplicatieNativa() && sistemDesktop() !== null,
  /** Browserul ne-a dat voie să deschidem fereastra lui de instalare. */
  directa: () => eveniment() !== null,
  /** Deschide fereastra de instalare a browserului. `false` = n-a fost posibil. */
  async porneste(): Promise<boolean> {
    const e = eveniment();
    if (!e) return false;
    await e.prompt();
    const { outcome } = await e.userChoice;
    // Evenimentul e consumat oricum. Dacă omul a refuzat, Chrome poate trimite altul mai târziu.
    setEveniment(null);
    if (outcome === "accepted") setInstalata(true);
    return true;
  },
};
