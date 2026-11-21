import {
  For,
  JSX,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";

import { C } from "../ui";

/**
 * BBT: decupajul pătrat al artwork-ului (22 nov 2026), ca pe site (`website/src/components/DecupajPatrat.tsx`): tragi ca să
 * încadrezi, ciupești, rotești rotița sau folosești bara ca să mărești. Iese un JPEG de `latura` × `latura` (1400, calitate
 * 0,9). Design: `admin/docs/plans/2026-11-22-piesa-sesiunii-artwork-design.md`, D9.
 *
 * De ce în browser și nu pe server: adminul n-are `sharp`, iar pătratul îl alege omul, nu un algoritm. Serverul doar verifică
 * că a primit un pătrat de cel puțin 600 px.
 *
 * ⚠️ Poza de telefon vine cu orientarea în EXIF. Browserele de azi o aplică singure și la `<img>`, și la `drawImage`
 * (`image-orientation: from-image` e implicit), deci nu rotim noi. Dacă o rotim și noi, poza iese culcată.
 *
 * ⚠️ Fișierul se citește o singură dată: pentru altă poză, părintele montează decupajul din nou (`<Show keyed>`).
 */
export function DecupajPatrat(props: {
  fisier: Blob;
  laGata: (rezultat: Blob) => void;
  laRenunt: () => void;
  latura?: number;
  /** „Refă poza” pe telefon, „Alege alta” pe calculator. */
  textRenunt?: string;
}) {
  let vizor: HTMLDivElement | undefined;
  let imagine: HTMLImageElement | undefined;
  const src = URL.createObjectURL(untrack(() => props.fisier));
  onCleanup(() => URL.revokeObjectURL(src));

  const [nat, setNat] = createSignal<{ l: number; i: number } | null>(null);
  const [S, setS] = createSignal(320);
  const [zoom, setZoom] = createSignal(1);
  const [poz, setPoz] = createSignal({ x: 0, y: 0 });
  const [lucreaza, setLucreaza] = createSignal(false);
  const degete = new Map<number, { x: number; y: number }>();
  let ciupit: { dist: number; zoom: number } | null = null;

  // Scara la care poza acoperă exact pătratul (latura mică = latura vizorului). Sub ea ar rămâne margini goale.
  const baza = () => {
    const n = nat();
    return n ? S() / Math.min(n.l, n.i) : 1;
  };
  const scara = () => baza() * zoom();

  const limiteaza = (p: { x: number; y: number }, sc: number) => {
    const n = nat();
    if (!n) return p;
    return {
      x: Math.min(0, Math.max(S() - n.l * sc, p.x)),
      y: Math.min(0, Math.max(S() - n.i * sc, p.y)),
    };
  };

  // La încărcare și la redimensionarea vizorului: poza centrată prima dată, apoi doar ținută în pătrat.
  createEffect(
    on([nat, S], ([n, latura]) => {
      if (!n) return;
      const sc = (latura / Math.min(n.l, n.i)) * untrack(zoom);
      setPoz((p) =>
        limiteaza(
          p.x === 0 && p.y === 0
            ? { x: (latura - n.l * sc) / 2, y: (latura - n.i * sc) / 2 }
            : p,
          sc,
        ),
      );
    }),
  );

  /** Mărește în jurul centrului vizorului, ca punctul pe care îl privești să rămână pe loc. */
  function schimbaZoom(nou: number) {
    const z = Math.min(4, Math.max(1, nou));
    const scVeche = scara();
    const scNoua = baza() * z;
    const cx = (S() / 2 - poz().x) / scVeche;
    const cy = (S() / 2 - poz().y) / scVeche;
    setZoom(z);
    setPoz(
      limiteaza({ x: S() / 2 - cx * scNoua, y: S() / 2 - cy * scNoua }, scNoua),
    );
  }

  function jos(e: PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    degete.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (degete.size === 2) {
      const [a, b] = [...degete.values()];
      ciupit = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoom() };
    }
  }

  function misca(e: PointerEvent) {
    const anterior = degete.get(e.pointerId);
    if (!anterior) return;
    degete.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (degete.size === 2 && ciupit) {
      const [a, b] = [...degete.values()];
      schimbaZoom(
        ciupit.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / ciupit.dist),
      );
      return;
    }
    setPoz((p) =>
      limiteaza(
        { x: p.x + e.clientX - anterior.x, y: p.y + e.clientY - anterior.y },
        scara(),
      ),
    );
  }

  function sus(e: PointerEvent) {
    degete.delete(e.pointerId);
    if (degete.size < 2) ciupit = null;
  }

  onMount(() => {
    if (!vizor) return;
    const el = vizor;
    const ro = new ResizeObserver(() => setS(el.clientWidth));
    ro.observe(el);
    setS(el.clientWidth);
    // Rotița mărește. ⚠️ Ascultător cu `passive: false`: altfel `preventDefault` nu oprește pagina, iar pagina se derula
    // odată cu mărirea (pe site s-a întâmplat exact asta cu `onWheel` din React).
    const rotita = (e: WheelEvent) => {
      e.preventDefault();
      schimbaZoom(zoom() * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    el.addEventListener("wheel", rotita, { passive: false });
    onCleanup(() => {
      ro.disconnect();
      el.removeEventListener("wheel", rotita);
    });
  });

  function foloseste() {
    const n = nat();
    if (!imagine || !n) return;
    const latura = props.latura ?? 1400;
    setLucreaza(true);
    const canvas = document.createElement("canvas");
    canvas.width = latura;
    canvas.height = latura;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setLucreaza(false);
      return;
    }
    // Ce se vede în vizor, în pixelii pozei originale.
    const sc = scara();
    const sx = -poz().x / sc;
    const sy = -poz().y / sc;
    const sl = S() / sc;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, latura, latura);
    ctx.drawImage(imagine, sx, sy, sl, sl, 0, 0, latura, latura);
    canvas.toBlob(
      (b) => {
        setLucreaza(false);
        if (b) props.laGata(b);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
      <div
        ref={vizor}
        onPointerDown={jos}
        onPointerMove={misca}
        onPointerUp={sus}
        onPointerCancel={sus}
        style={{
          position: "relative",
          width: "100%",
          "max-width": "420px",
          "aspect-ratio": "1 / 1",
          margin: "0 auto",
          overflow: "hidden",
          "border-radius": "16px",
          background: C.negru,
          "touch-action": "none",
          "user-select": "none",
          cursor: "grab",
        }}
      >
        <img
          ref={imagine}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) =>
            setNat({
              l: e.currentTarget.naturalWidth,
              i: e.currentTarget.naturalHeight,
            })
          }
          style={
            nat()
              ? {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  "max-width": "none",
                  "transform-origin": "top left",
                  "pointer-events": "none",
                  width: `${nat()!.l * scara()}px`,
                  height: `${nat()!.i * scara()}px`,
                  transform: `translate(${poz().x}px, ${poz().y}px)`,
                }
              : { position: "absolute", opacity: 0 }
          }
        />
        {/* Grila de treimi: ajută la încadrare, nu intră în poză. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            "grid-template-columns": "repeat(3, 1fr)",
            "grid-template-rows": "repeat(3, 1fr)",
            "pointer-events": "none",
          }}
        >
          <For each={Array.from({ length: 9 })}>
            {() => (
              <div style={{ border: "1px solid rgba(255,255,255,0.25)" }} />
            )}
          </For>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          color: C.stins,
          "font-size": "14px",
          "text-align": "center",
        }}
      >
        Trage ca să încadrezi. Ciupește sau folosește bara ca să mărești.
      </p>
      <input
        type="range"
        min={1}
        max={4}
        step={0.01}
        value={zoom()}
        onInput={(e) => schimbaZoom(Number(e.currentTarget.value))}
        aria-label="Mărește"
        style={{
          width: "100%",
          "max-width": "420px",
          margin: "0 auto",
          display: "block",
          "accent-color": C.negru,
        }}
      />
      <div style={{ display: "flex", gap: "8px", "justify-content": "center" }}>
        <button
          type="button"
          onClick={() => props.laRenunt()}
          style={butonMic("alb")}
        >
          {props.textRenunt ?? "Alege alta"}
        </button>
        <button
          type="button"
          onClick={foloseste}
          disabled={!nat() || lucreaza()}
          style={{
            ...butonMic("roz"),
            opacity: !nat() || lucreaza() ? 0.5 : 1,
          }}
        >
          Folosește
        </button>
      </div>
    </div>
  );
}

/**
 * Butonul mic din formularul piesei: 38 de înălțime, text de 14. `Buton mic` din `ui.tsx` are 13, sub pragul de 14 al
 * casei pentru UI; nu l-am schimbat acolo, ca să nu mișcăm toate paginile contului dintr-o sarcină cu piese.
 * Roz = acțiunea (apasă), alb = drumul secundar.
 */
export function butonMic(piele: "roz" | "alb" | "negru"): JSX.CSSProperties {
  const culori = {
    roz: { bg: C.roz, text: C.negru, contur: "transparent" },
    alb: { bg: C.fundal, text: C.text, contur: C.linie },
    negru: { bg: C.negru, text: C.peNegru, contur: "transparent" },
  }[piele];
  return {
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    gap: "6px",
    height: "38px",
    padding: "0 16px",
    "box-sizing": "border-box",
    "border-radius": "999px",
    border: `1px solid ${culori.contur}`,
    background: culori.bg,
    color: culori.text,
    "font-family": "inherit",
    "font-size": "14px",
    "font-weight": 700,
    "white-space": "nowrap",
    cursor: "pointer",
  };
}
