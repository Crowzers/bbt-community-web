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
 * Windows sau Mac, după browser. Telefoanele și tabletele au `sistemTelefon`. Linux = `null`, fără
 * buton: userul n-a cerut.
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

export type Telefon = "iphone" | "ipad" | "android";

/**
 * Telefonul sau tableta, pentru butonul cu tutorial (cererea userului, 20 oct 2026: „butonul de
 * instalare să arate un popup tutorial"). Aplicația din magazine nu există încă; până atunci, hub-ul
 * se pune pe ecranul principal din browser. Pe iPhone e și singurul drum spre notificări.
 *
 * ⚠️ iPad-ul care se dă drept Mac (vezi `sistemDesktop`) e prins aici după ecranul tactil.
 */
export function sistemTelefon(): Telefon | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return "iphone";
  if (/iPad/.test(ua)) return "ipad";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ipad";
  if (/Android/.test(ua)) return "android";
  return null;
}

/** Samsung Internet are meniul jos și alt drum spre ecranul principal decât Chrome. */
export function esteSamsung(): boolean {
  return /SamsungBrowser\//.test(navigator.userAgent);
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

/**
 * Legătura spre site, după cum rulează hub-ul (cererea userului, 20 oct 2026). În browser, „Site"
 * duce pe site în același tab, ca până acum. În aplicația instalată, se deschide în browser: altfel
 * site-ul s-ar fi încărcat ÎN fereastra aplicației, iar omul ar fi rămas pe marketing, fără drum
 * înapoi în Community.
 */
export function tintaSite(): "_blank" | undefined {
  return instalata() ? "_blank" : undefined;
}

/**
 * Iconița de lângă „Site", pe aceeași regulă ca `tintaSite`. În browser săgeata „înapoi" spune
 * adevărul: te întorci pe site, în același tab. În aplicația instalată nu te întorci nicăieri, ți se
 * deschide site-ul în browser, deci globul web (cererea userului, 20 oct 2026).
 *
 * ⚠️ `public`, nu `language`: în `iconite-harta.json` `language` e iconița de traduceri din Lucide,
 * iar globul e `public` → `globe`.
 */
export function simbolSite(): "public" | "arrow_back" {
  return instalata() ? "public" : "arrow_back";
}

export const instalare = {
  /** Butonul se arată pe Windows/Mac și pe telefon, în browser, cât hub-ul nu e deja aplicație. */
  vizibil: () =>
    !instalata() &&
    !inAplicatieNativa() &&
    (sistemDesktop() !== null || sistemTelefon() !== null),
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
