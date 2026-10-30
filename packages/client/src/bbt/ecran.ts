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
 * atunci, deci tragerile care ar ajunge la pagină se opresc aici, iar o tragere în jos închide tastatura.
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

/**
 * Dacă tragerea ar ajunge la pagină: sub deget nu e nicio listă cu ce derula, sau lista e deja la capăt în sensul
 * tragerii. ⚠️ Capătul contează: firul stă la ultimul mesaj, iar pe iPhone, trăgând conținutul în sus de acolo, Safari
 * muta tot pagina (userul, 30 oct: „când ridic de conținut"), oricât `overscroll-behavior` ar avea lista.
 */
function ajungeLaPagina(tinta: EventTarget | null, dy: number) {
  if (!(tinta instanceof Element)) return true;
  for (let e: Element | null = tinta; e; e = e.parentElement) {
    const stil = getComputedStyle(e);
    const max = e.scrollHeight - e.clientHeight;
    if ((stil.overflowY !== "auto" && stil.overflowY !== "scroll") || max <= 1)
      continue;
    // Firul e `column-reverse`: `scrollTop` e 0 la ultimul mesaj și negativ în sus.
    const invers = stil.flexDirection === "column-reverse";
    const pozitie = invers ? max + e.scrollTop : e.scrollTop;
    return dy > 0 ? pozitie <= 0 : pozitie >= max - 1;
  }
  return true;
}

/**
 * Măsurătorile de pe telefon, la vedere: `hub.beanbagtheory.ro/?ecran`. Pe iPhone nu există consolă fără Mac, iar
 * fâșia albă de deasupra tastaturii nu se reproduce în browserul de pe calculator. Se scoate după ce e găsită cauza.
 */
function arataMasuratorile(vv: VisualViewport) {
  try {
    if (location.search.includes("ecran"))
      localStorage.setItem("bbt-ecran", "1");
    if (!localStorage.getItem("bbt-ecran")) return;
  } catch {
    return;
  }
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:50%;transform:translateX(-50%);z-index:99999;padding:4px 8px;border-radius:8px;" +
    "background:#0A0A0B;color:#fff;font:12px/1.3 monospace;white-space:pre;pointer-events:none";
  document.body.append(el);
  const root = document.getElementById("root")!;
  setInterval(() => {
    const b = root.getBoundingClientRect();
    // ⚠️ Lipită de ecranul vizibil: cu pagina mutată de Safari, un `top` fix iese din ecran (capturile din 31 oct).
    el.style.top = `${Math.round(vv.offsetTop) + 4}px`;
    el.textContent =
      `vv h ${Math.round(vv.height)} sus ${Math.round(vv.offsetTop)} zoom ${vv.scale}\n` +
      `fereastra h ${innerHeight} scroll ${Math.round(scrollY)}\n` +
      `root sus ${Math.round(b.top)} h ${Math.round(b.height)}\n` +
      `tastatura ${document.documentElement.classList.contains("bbt-tastatura")} camp ${campActiv()}`;
  }, 200);
}

/** Dacă e activ un câmp care scoate tastatura. */
function campActiv() {
  return !!document.activeElement?.matches(
    "textarea,[contenteditable='true'],mdui-text-field,input:not([type='checkbox'],[type='radio'],[type='file'],[type='button'])",
  );
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
      a.blocata = a.vertical && ajungeLaPagina(e.target, dy);
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
    // ⚠️ Câmpul activ contează cât diferența: dacă iOS micșorează și `innerHeight`, diferența rămâne mică și tastatura
    // n-ar fi văzută deloc, deci nici tragerile n-ar fi oprite. `coarse`: pe calculator nu e nicio tastatură pe ecran.
    const tastatura =
      window.innerHeight - vv.height > 120 ||
      (window.matchMedia("(pointer: coarse)").matches && campActiv());
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
  if (vv) arataMasuratorile(vv);
  vv?.addEventListener("resize", aplica);
  vv?.addEventListener("scroll", aplica);
  // ⚠️ Fără `window.scrollTo(0, 0)` la derularea ferestrei: pe iOS s-ar bate cu Safari, care
  // derulează singur spre câmpul în care scrii. Site-ul nu o face și nu are nevoie.
  window.addEventListener("scroll", remasoara, { passive: true });
  // Pe loc, nu la cadrul următor: prima tragere de după apăsarea pe câmp trebuie să găsească ascultătorii puși.
  document.addEventListener("focusin", () => {
    aplica();
    remasoara();
  });
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
