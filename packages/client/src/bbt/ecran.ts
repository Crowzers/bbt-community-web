/**
 * BBT: aplicația ocupă EXACT ecranul vizibil și nimic nu se mai poate trage în afara ei.
 *
 * Plângerea (5 oct 2026, iPhone): „să blocăm scroll-ul comunității exact cum e pe website — să se
 * deruleze doar ce te lasă aplicația". Pe iOS, `#root` e `position: fixed`, dar DOCUMENTUL de sub
 * el tot se poate trage (elasticul de la margini), iar când urcă tastatura Safari mută toată
 * pagina în sus ca să arate câmpul — bara de sus fuge din ecran, iar `interactive-widget` din
 * `index.html` e ignorat pe iOS.
 *
 * Același tipar ca în Community-ul vechi de pe site (`website/src/app/community/mobil.ts`,
 * `useInaltimeVizuala`): înălțimea și decalajul vin din `visualViewport` — singura sursă care știe
 * cât ecran a rămas deasupra tastaturii — în variabilele `--bbt-ecran-h` / `--bbt-ecran-sus`, pe
 * care le citește `#root` din `components/ui/styles.css`, unde `html`/`body` au și `overflow:
 * hidden` + `overscroll-behavior: none` (fără elasticul paginii).
 */
export function legaEcranulVizibil() {
  const vv = window.visualViewport;
  const r = document.documentElement;

  const aplica = () => {
    if (!vv) return;
    r.style.setProperty("--bbt-ecran-h", `${Math.round(vv.height)}px`);
    r.style.setProperty("--bbt-ecran-sus", `${Math.round(vv.offsetTop)}px`);
    // Cu tastatura sus, bara de „home" a iPhone-ului e sub tastatură: marginea ei de jos
    // (`safe-area-inset-bottom`, 34px) ar lăsa o fâșie goală între câmpul de scris și tastatură.
    r.classList.toggle("bbt-tastatura", window.innerHeight - vv.height > 120);
  };

  aplica();
  vv?.addEventListener("resize", aplica);
  vv?.addEventListener("scroll", aplica);
  // ⚠️ Fără `window.scrollTo(0, 0)` la derularea ferestrei: pe iOS s-ar bate cu Safari, care
  // derulează singur spre câmpul în care scrii. Site-ul nu o face și nu are nevoie.
}
