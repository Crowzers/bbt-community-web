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
 *
 * 30 oct 2026, iPhone (captura userului): cu tastatura sus, o tragere pe un fir scurt a lăsat o fâșie albă
 * între bara de scris și tastatură, iar tastatura nu se închidea trăgând în jos, ca în aplicație
 * (`keyboardDismissMode="interactive"`). Doar cât e tastatura sus: `overflow: hidden` nu oprește Safari să mute pagina
 * atunci, deci tragerile care nu derulează o listă se opresc aici, iar o tragere în jos închide tastatura.
 */

/** Cât se trage în jos până se închide tastatura: destul cât o atingere tremurată pe un mesaj să n-o închidă. */
const TRAGERE_INCHIDE = 30;

/**
 * Cât se remăsoară după un gest. ⚠️ Safari nu anunță mereu ultima poziție a ecranului vizibil la capătul unei
 * tragerii, iar o valoare rămasă în urmă înseamnă exact fâșia albă. Acoperă și animația tastaturii.
 */
const MS_REMASURARE = 800;

/** Pe iPhone, scrollTo imediat după `blur` se pierde: pagina se pune la loc abia după ce coboară tastatura. */
const MS_DUPA_TASTATURA = 350;

/** Dacă sub deget e ceva care chiar are ce derula. Lista scurtă are `overflow` dar nu are ce: acolo se mișca pagina. */
function areCeDerula(tinta: EventTarget | null) {
  if (!(tinta instanceof Element)) return false;
  for (let e: Element | null = tinta; e; e = e.parentElement) {
    const y = getComputedStyle(e).overflowY;
    if ((y === "auto" || y === "scroll") && e.scrollHeight > e.clientHeight + 1)
      return true;
  }
  return false;
}

export function legaEcranulVizibil() {
  const vv = window.visualViewport;
  const r = document.documentElement;
  let inaltime = "";
  let sus = "";
  let atingere: {
    x: number;
    y: number;
    vertical?: boolean;
    blocata?: boolean;
  } | null = null;

  const laInceput = (e: TouchEvent) => {
    const t = e.touches[0];
    atingere = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };

  const laMiscare = (e: TouchEvent) => {
    const a = atingere;
    if (!a) return;
    const t = e.touches[0];
    const dx = t.clientX - a.x;
    const dy = t.clientY - a.y;

    // ⚠️ Se hotărăște la PRIMA mișcare: iOS ține cont de `preventDefault` doar până pornește derularea.
    if (a.vertical === undefined) {
      a.vertical = Math.abs(dy) >= Math.abs(dx);
      a.blocata = a.vertical && !areCeDerula(e.target);
    }
    if (a.blocata && e.cancelable) e.preventDefault();

    const camp = document.activeElement;
    if (
      a.vertical &&
      dy > TRAGERE_INCHIDE &&
      camp instanceof HTMLElement &&
      !(e.target instanceof Node && camp.contains(e.target))
    ) {
      camp.blur();
    }
  };

  // Ascultătorii de atingere stau doar cât e tastatura sus: un `touchmove` care poate opri derularea ține orice listă
  // în așteptarea JavaScript-ului, iar fără tastatură n-au ce face.
  const urmaresteAtingerile = (da: boolean) => {
    const pune = da ? document.addEventListener : document.removeEventListener;
    pune.call(document, "touchstart", laInceput as EventListener, {
      passive: true,
    });
    pune.call(document, "touchmove", laMiscare as EventListener, {
      passive: false,
    });
    if (!da) atingere = null;
  };

  const aplica = () => {
    if (!vv) return;
    const h = `${Math.round(vv.height)}px`;
    const s = `${Math.round(vv.offsetTop)}px`;
    if (h !== inaltime) r.style.setProperty("--bbt-ecran-h", (inaltime = h));
    if (s !== sus) r.style.setProperty("--bbt-ecran-sus", (sus = s));
    // Cu tastatura sus, bara de „home" a iPhone-ului e sub tastatură: marginea ei de jos
    // (`safe-area-inset-bottom`, 34px) ar lăsa o fâșie goală între câmpul de scris și tastatură.
    const tastatura = window.innerHeight - vv.height > 120;
    if (tastatura !== r.classList.contains("bbt-tastatura")) {
      r.classList.toggle("bbt-tastatura", tastatura);
      urmaresteAtingerile(tastatura);
    }
  };

  let panaLa = 0;
  const remasoara = () => {
    const pornita = panaLa !== 0;
    panaLa = performance.now() + MS_REMASURARE;
    if (pornita) return;
    const pas = () => {
      aplica();
      if (performance.now() < panaLa) requestAnimationFrame(pas);
      else panaLa = 0;
    };
    requestAnimationFrame(pas);
  };

  aplica();
  vv?.addEventListener("resize", aplica);
  vv?.addEventListener("scroll", aplica);
  // ⚠️ Fără `window.scrollTo(0, 0)` la derularea ferestrei: pe iOS s-ar bate cu Safari, care
  // derulează singur spre câmpul în care scrii. Site-ul nu o face și nu are nevoie.
  window.addEventListener("scroll", remasoara, { passive: true });
  document.addEventListener("focusin", remasoara);
  document.addEventListener("touchend", remasoara, { passive: true });
  document.addEventListener("focusout", () => {
    remasoara();
    // Cu tastatura jos nu mai e cu cine să se bată: pagina mutată de Safari s-ar vedea ca o fâșie albă sus.
    setTimeout(() => {
      if (!r.classList.contains("bbt-tastatura") && vv?.scale === 1)
        window.scrollTo(0, 0);
    }, MS_DUPA_TASTATURA);
  });
}
