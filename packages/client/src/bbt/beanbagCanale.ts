import { createSignal } from "solid-js";

/**
 * Biblioteca de beanbag-uri pentru canale. `beanbag-canale.json` e generat în repo-ul platformei, de
 * `mobil/biblioteca-beanbag/genereaza.mjs`, din aceleași date ca aplicația de telefon: nu se editează de mână.
 * Se încarcă doar când se deschide alegerea, ca să nu îngreuneze hub-ul.
 *
 * ⚠️ Iconul canalului e un fișier: Stoat îl ține pe canal, iar hub-ul și aplicația îl arată de acolo. SVG-ul din catalog
 * se transformă în PNG la alegere, pentru că serverul de fișiere nu ia SVG.
 */
export type Piesa = { d: string; f?: string; s?: string; l?: number; a?: number };
export type Accesoriu = { nume: string; cuvinte: string[]; pe?: "cap"; piese: Piesa[] };
export type Catalog = {
  beanbag: string;
  corp: string;
  volume: Record<string, [string, string, string]>;
  accesorii: Accesoriu[];
};
export type Alegere = { accesoriu: string; culoare: string };

/** Fără accesoriu: beanbag-ul simplu, în culoarea lui. */
export const SIMPLU = "simplu";

const [catalogIncarcat, setCatalogIncarcat] = createSignal<Catalog>();
let cerere: Promise<unknown> | undefined;

/**
 * Catalogul, sau nimic până ajunge. Un semnal comun și nu `createResource`: acela suspendă, iar lista de pe desktop are un
 * rând pentru fiecare canal, deci fiecare rând nou ar fi cerut și el `Suspense`-ul din jur.
 */
export function catalogCanale() {
  cerere ??= import("./beanbag-canale.json")
    .then((m) => setCatalogIncarcat(m.default as unknown as Catalog))
    .catch(() => {
      // Un fișier picat (hub republicat cât stă tab-ul deschis) se reîncearcă la următoarea citire.
      cerere = undefined;
    });
  return catalogIncarcat();
}

function cuvinteDin(nume: string) {
  return nume
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Propunerea pornind de la numele canalului, aceeași regulă ca în aplicație: câștigă primul accesoriu potrivit. */
export function propune(catalog: Catalog, nume: string, vocal: boolean): Alegere {
  const din = cuvinteDin(nume);
  const gasit = vocal
    ? catalog.accesorii.find((a) => a.nume === "casti")
    : catalog.accesorii.find((a) => a.cuvinte.some((c) => din.some((w) => w.startsWith(c))));
  const culori = Object.keys(catalog.volume);
  let h = 0;
  for (const ch of nume) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { accesoriu: gasit?.nume ?? SIMPLU, culoare: culori[h % culori.length] };
}

/**
 * Desenul unui canal fără icon, ca în aplicație: accesoriul din nume, culoarea din id, ca un canal redenumit să n-o schimbe.
 * ⚠️ Aceeași regulă ca `culoareSac` din `mobil/src/ui/AvatarCanal.tsx`, cu aceeași ordine a culorilor.
 */
export function desenCanal(
  catalog: Catalog,
  canal: { id: string; nume: string; vocal: boolean },
) {
  const { accesoriu } = propune(catalog, canal.nume, canal.vocal);
  const culori = Object.keys(catalog.volume);
  let h = 0;
  for (const ch of canal.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return svgBeanbag(catalog, { accesoriu, culoare: culori[h % culori.length] });
}

const degrade = (id: string, [a, b, c]: [string, string, string]) =>
  `<radialGradient id="${id}" cx="35%" cy="30%" r="90%"><stop offset="0" stop-color="${a}"/><stop offset=".58" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;

/** Desenul complet, ca text SVG. Fiecare miniatură e o imagine separată, deci id-urile gradientelor nu se calcă între ele. */
export function svgBeanbag(catalog: Catalog, { accesoriu, culoare }: Alegere) {
  const a = catalog.accesorii.find((x) => x.nume === accesoriu);
  const piese = (a?.piese ?? [])
    .map(
      (p) =>
        `<path d="${p.d}" fill="${p.f ? (catalog.volume[p.f] ? `url(#${p.f})` : p.f) : "none"}"${p.s ? ` stroke="${p.s}" stroke-width="${p.l}"` : ""} stroke-linecap="round" stroke-linejoin="round"${p.a ? ` opacity="${p.a}"` : ""}/>`,
    )
    .join("");
  const volume = [...new Set((a?.piese ?? []).map((p) => p.f).filter((f): f is string => !!f && !!catalog.volume[f]))];
  const colt = a && a.pe !== "cap" ? `<g transform="translate(27 3) scale(.9)">${piese}</g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 44 44"><defs>${degrade("corp", catalog.volume[culoare])}${volume.map((v) => degrade(v, catalog.volume[v])).join("")}</defs><g transform="translate(2 0)"><g transform="translate(1 4) scale(.066)"><path d="${catalog.beanbag}" fill="url(#corp)"/></g>${catalog.corp}${a?.pe === "cap" ? piese : ""}</g>${colt}</svg>`;
}

export const adresaSvg = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** PNG-ul de urcat pe canal, cu fundal transparent. */
export async function fisierBeanbag(catalog: Catalog, alegere: Alegere): Promise<File> {
  const imagine = new Image();
  imagine.src = adresaSvg(svgBeanbag(catalog, alegere));
  await imagine.decode();
  const panza = document.createElement("canvas");
  panza.width = panza.height = 512;
  panza.getContext("2d")!.drawImage(imagine, 0, 0, 512, 512);
  const date = await new Promise<Blob | null>((gata) => panza.toBlob(gata, "image/png"));
  if (!date) throw new Error("Beanbag-ul nu s-a putut pregăti.");
  return new File([date], `beanbag-${alegere.accesoriu.replace(/\s+/g, "-")}-${alegere.culoare}.png`, { type: "image/png" });
}
