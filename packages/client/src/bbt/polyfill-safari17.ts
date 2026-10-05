/**
 * BBT: API-urile pe care clientul Stoat le folosește și pe care iOS 17 (Safari 17.x) nu le are:
 * - „iterator helpers" (`map.values().toArray()`, `.map()`, `.filter()`…) — Safari 18.4;
 * - `Uint8Array.prototype.toBase64` (abonarea la notificări push) — Safari 18.2.
 * Lista e din căutarea în bundle-ul construit (5 oct 2026); la un update upstream se caută din nou.
 *
 * 🔴 Clientul Stoat le folosește direct (și la PORNIRE), iar build-ul nu adaugă polyfill-uri — Vite
 * convertește doar sintaxa, nu API-urile. Pe iPhone cu iOS 17.6 (5 oct 2026, telefonul Carlei)
 * aplicația arunca `….values().toArray is not a function` înainte să deseneze ceva ⇒ ecran gri
 * pentru totdeauna. Pe iOS 18.4+ mergea, de-aia „la mine merge". Reprodus în WebKit, cu API-urile
 * de după Safari 17.6 scoase.
 *
 * ⚠️ Trebuie să fie PRIMUL import din `src/index.tsx`: modulele se evaluează în ordinea importurilor,
 * iar unele apelează helper-ele chiar la încărcare. Definește doar ce LIPSEȘTE — pe un browser nou
 * nu atinge nimic.
 */

type Iter = Iterator<unknown> & { [Symbol.iterator](): Iter };
type Fn<R> = (valoare: unknown, index: number) => R;

const PROTO = Object.getPrototypeOf(
  Object.getPrototypeOf([][Symbol.iterator]()),
) as Record<string, unknown>;

function defineste(nume: string, fn: (this: Iter, ...a: never[]) => unknown) {
  if (typeof PROTO[nume] === "function") return;
  Object.defineProperty(PROTO, nume, {
    value: fn,
    writable: true,
    configurable: true,
  });
}

function* parcurge(it: Iter) {
  let i = 0;
  for (let pas = it.next(); !pas.done; pas = it.next())
    yield [pas.value, i++] as const;
}

defineste("toArray", function () {
  const rezultat: unknown[] = [];
  for (const [v] of parcurge(this)) rezultat.push(v);
  return rezultat;
});

defineste("forEach", function (fn: Fn<void>) {
  for (const [v, i] of parcurge(this)) fn(v, i);
});

defineste("some", function (fn: Fn<unknown>) {
  for (const [v, i] of parcurge(this)) if (fn(v, i)) return true;
  return false;
});

defineste("every", function (fn: Fn<unknown>) {
  for (const [v, i] of parcurge(this)) if (!fn(v, i)) return false;
  return true;
});

defineste("find", function (fn: Fn<unknown>) {
  for (const [v, i] of parcurge(this)) if (fn(v, i)) return v;
  return undefined;
});

defineste("reduce", function (
  this: Iter,
  fn: (acc: unknown, v: unknown, i: number) => unknown,
  ...initial: unknown[]
) {
  let acc: unknown;
  let primul = initial.length === 0;
  if (!primul) acc = initial[0];
  for (const [v, i] of parcurge(this)) {
    if (primul) {
      acc = v;
      primul = false;
    } else acc = fn(acc, v, i);
  }
  if (primul)
    throw new TypeError("Reduce of empty iterator with no initial value");
  return acc;
} as never);

// Cele „leneșe" întorc generatoare: moștenesc același prototip, deci se pot înlănțui.
defineste("map", function* (fn: Fn<unknown>) {
  for (const [v, i] of parcurge(this)) yield fn(v, i);
});

defineste("filter", function* (fn: Fn<unknown>) {
  for (const [v, i] of parcurge(this)) if (fn(v, i)) yield v;
});

defineste("flatMap", function* (fn: Fn<Iterable<unknown>>) {
  for (const [v, i] of parcurge(this)) yield* fn(v, i);
});

defineste("take", function* (limita: number) {
  if (limita <= 0) return;
  let luate = 0;
  for (const [v] of parcurge(this)) {
    yield v;
    if (++luate >= limita) return;
  }
});

defineste("drop", function* (cate: number) {
  let sarite = 0;
  for (const [v] of parcurge(this)) {
    if (sarite++ < cate) continue;
    yield v;
  }
});

// `toBase64` (doar cât folosește clientul: `alphabet` și `omitPadding`).
const U8 = Uint8Array.prototype as unknown as Record<string, unknown>;
if (typeof U8.toBase64 !== "function") {
  Object.defineProperty(U8, "toBase64", {
    value: function (
      this: Uint8Array,
      optiuni?: { alphabet?: "base64" | "base64url"; omitPadding?: boolean },
    ) {
      let binar = "";
      for (let i = 0; i < this.length; i++)
        binar += String.fromCharCode(this[i]);
      let rezultat = btoa(binar);
      if (optiuni?.alphabet === "base64url")
        rezultat = rezultat.replace(/[+]/g, "-").replace(/[/]/g, "_");
      if (optiuni?.omitPadding) rezultat = rezultat.replace(/=+$/, "");
      return rezultat;
    },
    writable: true,
    configurable: true,
  });
}

export {};
