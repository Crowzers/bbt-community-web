import {
  JSX,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

/**
 * BBT: fundalul rândului activ care ALUNECĂ spre rândul nou, în loc să sară (cererea userului, 30 oct 2026: „animația
 * pe care o avem pe aplicația de mobil, aș vrea să fie și la meniul din desktop"). E pastila roz din meniul de jos al
 * aplicației (`mobil/src/ui/PastilaDeJos.tsx`, „curge spre tab-ul nou"), adusă pe rail și pe meniul contului.
 *
 * Un singur strat așezat sub rânduri, mutat cu `transform` (nu cu `top`: mutarea rămâne pe placa grafică, fără
 * recalcularea paginii la fiecare cadru). Rândurile își țin culoarea textului, fără fundal propriu.
 *
 * ⚠️ Prima așezare e FĂRĂ tranziție: altfel, la deschiderea aplicației, stratul ar fi pornit din colțul de sus și ar fi
 * coborât până la rândul activ. ⚠️ Cine cere mișcare redusă din sistem (`prefers-reduced-motion`) îl vede sărind.
 */
export function useAlunecare(activ: () => number) {
  const randuri: (HTMLElement | undefined)[] = [];
  const [loc, setLoc] = createSignal<{ y: number; h: number } | null>(null);
  const [gata, setGata] = createSignal(false);

  const masoara = () => {
    const el = randuri[activ()];
    setLoc(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
  };

  createEffect(masoara);
  onMount(() => {
    // Abia după ce prima poziție s-a desenat pornim tranziția.
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => requestAnimationFrame(() => setGata(true)));
    }
    // Fontul De Fonte / Inter se poate încărca după prima măsurare și schimba înălțimea rândurilor.
    const obs = new ResizeObserver(masoara);
    randuri.forEach((r) => r && obs.observe(r));
    onCleanup(() => obs.disconnect());
  });

  /** Pune-l ca `ref` pe rândul de la poziția `i`. */
  const rand = (i: number) => (el: HTMLElement) => {
    randuri[i] = el;
  };

  /** Stratul care alunecă; containerul rândurilor trebuie să fie `position: relative`. */
  const Strat = (p: {
    culoare: string;
    raza: string;
    stil?: JSX.CSSProperties;
  }) => (
    <Show when={loc()}>
      {(l) => (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${l().h}px`,
            transform: `translateY(${l().y}px)`,
            "border-radius": p.raza,
            background: p.culoare,
            "pointer-events": "none",
            "z-index": 0,
            transition: gata()
              ? "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), height 320ms cubic-bezier(0.32, 0.72, 0, 1)"
              : "none",
            ...p.stil,
          }}
        />
      )}
    </Show>
  );

  return { rand, Strat };
}
