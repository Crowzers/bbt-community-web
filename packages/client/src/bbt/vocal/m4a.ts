/**
 * Din ce scrie `MediaRecorder` facem un `.m4a` obișnuit, la fel ca cel înregistrat pe iPhone.
 *
 * ⚠️ Chrome (și Safari) scriu AAC într-un MP4 FRAGMENTAT: `ftyp isom`, un `moov` cu tabelele goale (`stsz` fără
 * nicio intrare, durata 0) și eșantioanele în cutii `moof/trun`, bucată cu bucată. Se aude, dar:
 * - aplicația mobilă desenează unda din `moov/…/stbl/stsz` (`mobil/src/vocal/unda.ts`) și n-ar găsi nimic;
 * - durata din antet e 0, deci playerele care se bazează pe ea (și saltul în fișier) se poartă ciudat;
 * - autumn ghicește tipul din `ftyp`; `M4A ` e sigur sunet, ca la fișierele de pe telefon.
 *
 * Așa că mutăm eșantioanele într-un singur `mdat` și scriem tabelele complete (`stts`, `stsc`, `stsz`, `stco`),
 * cu `moov` ÎNAINTEA sunetului (se poate reda cât se descarcă). Sunetul nu se re-encodează: octeții AAC rămân
 * cei din înregistrare.
 *
 * Un fișier deja nefragmentat (fără `moof`) se întoarce neschimbat.
 */

export interface VocalM4a {
  octeti: Uint8Array;
  /** Durata exactă, din tabelele de timp ale pistei (nu din cronometru). */
  durataMs: number;
}

interface Cutie {
  nume: string;
  /** Începutul cutiei (antetul inclus). */
  de: number;
  /** Începutul conținutului (după antet). */
  continut: number;
  pana: number;
}

function cutii(b: Uint8Array, de: number, pana: number): Cutie[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const lista: Cutie[] = [];
  let p = de;
  while (p + 8 <= pana) {
    let marime = v.getUint32(p);
    let antet = 8;
    if (marime === 1) {
      marime = Number(v.getBigUint64(p + 8));
      antet = 16;
    } else if (marime === 0) {
      marime = pana - p;
    }
    if (marime < antet || p + marime > pana) break;
    lista.push({
      nume: String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]),
      de: p,
      continut: p + antet,
      pana: p + marime,
    });
    p += marime;
  }
  return lista;
}

function gaseste(
  b: Uint8Array,
  parinte: Cutie | null,
  cale: string[],
): Cutie | null {
  let zona: Cutie | null = parinte;
  for (const nume of cale) {
    const copii = cutii(
      b,
      zona ? zona.continut : 0,
      zona ? zona.pana : b.byteLength,
    );
    zona = copii.find((c) => c.nume === nume) ?? null;
    if (!zona) return null;
  }
  return zona;
}

/** Codecul din `stsd` (ex. `mp4a`), sau `null`. */
export function codecM4a(b: Uint8Array): string | null {
  const stsd = gaseste(b, null, [
    "moov",
    "trak",
    "mdia",
    "minf",
    "stbl",
    "stsd",
  ]);
  if (!stsd || stsd.pana - stsd.continut < 16) return null;
  const p = stsd.continut + 8 + 4; // versiune+fanioane, număr de intrări, mărimea primei intrări
  return String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
}

/** Câmpurile unui `full box` care contează aici: timescale și unde stă durata. */
function citesteTimp(b: Uint8Array, c: Cutie) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const versiune = b[c.continut];
  return versiune === 1
    ? {
        timescale: v.getUint32(c.continut + 20),
        durataLa: c.continut + 24,
        lunga: true,
      }
    : {
        timescale: v.getUint32(c.continut + 12),
        durataLa: c.continut + 16,
        lunga: false,
      };
}

export function refaM4a(b: Uint8Array): VocalM4a {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const sus = cutii(b, 0, b.byteLength);
  const moov = sus.find((c) => c.nume === "moov");
  if (!moov) throw new Error("fără moov");
  const trak = gaseste(b, moov, ["trak"])!;
  const mdhd = gaseste(b, trak, ["mdia", "mdhd"]);
  const stbl = gaseste(b, trak, ["mdia", "minf", "stbl"]);
  if (!trak || !mdhd || !stbl) throw new Error("pistă incompletă");
  const timpPista = citesteTimp(b, mdhd);

  const fragmente = sus.filter((c) => c.nume === "moof");
  if (!fragmente.length) {
    // Deja un MP4 obișnuit: durata din `mdhd`.
    const durata = timpPista.lunga
      ? Number(v.getBigUint64(timpPista.durataLa))
      : v.getUint32(timpPista.durataLa);
    return {
      octeti: b,
      durataMs: Math.round((durata * 1000) / timpPista.timescale),
    };
  }

  // Valorile implicite din `mvex/trex`, folosite când `tfhd`/`trun` nu le dau.
  const trex = gaseste(b, moov, ["mvex", "trex"]);
  const implicitTrex = {
    durata: trex ? v.getUint32(trex.continut + 12) : 0,
    marime: trex ? v.getUint32(trex.continut + 16) : 0,
  };

  const marimi: number[] = [];
  const durate: number[] = [];
  const bucati: Uint8Array[] = [];

  for (const moof of fragmente) {
    for (const traf of cutii(b, moof.continut, moof.pana).filter(
      (c) => c.nume === "traf",
    )) {
      const copii = cutii(b, traf.continut, traf.pana);
      const tfhd = copii.find((c) => c.nume === "tfhd");
      if (!tfhd) continue;
      const fanTf = v.getUint32(tfhd.continut) & 0xffffff;
      let p = tfhd.continut + 8; // versiune+fanioane, track_ID
      let baza = moof.de; // fără base-data-offset, baza e începutul `moof`-ului (default-base-is-moof)
      if (fanTf & 0x1) {
        baza = Number(v.getBigUint64(p));
        p += 8;
      }
      if (fanTf & 0x2) p += 4;
      let durataImplicita = implicitTrex.durata;
      let marimeImplicita = implicitTrex.marime;
      if (fanTf & 0x8) {
        durataImplicita = v.getUint32(p);
        p += 4;
      }
      if (fanTf & 0x10) marimeImplicita = v.getUint32(p);

      let cursor = baza;
      for (const trun of copii.filter((c) => c.nume === "trun")) {
        const fan = v.getUint32(trun.continut) & 0xffffff;
        const numar = v.getUint32(trun.continut + 4);
        let q = trun.continut + 8;
        if (fan & 0x1) {
          cursor = baza + v.getInt32(q);
          q += 4;
        }
        if (fan & 0x4) q += 4;
        for (let i = 0; i < numar; i++) {
          let durata = durataImplicita;
          let marime = marimeImplicita;
          if (fan & 0x100) {
            durata = v.getUint32(q);
            q += 4;
          }
          if (fan & 0x200) {
            marime = v.getUint32(q);
            q += 4;
          }
          if (fan & 0x400) q += 4;
          if (fan & 0x800) q += 4;
          if (cursor + marime > b.byteLength)
            throw new Error("eșantion în afara fișierului");
          bucati.push(b.subarray(cursor, cursor + marime));
          marimi.push(marime);
          durate.push(durata);
          cursor += marime;
        }
      }
    }
  }
  if (!marimi.length) throw new Error("fără eșantioane");

  const durataPista = durate.reduce((s, d) => s + d, 0);
  const mvhd = gaseste(b, moov, ["mvhd"]);
  const tkhd = gaseste(b, trak, ["tkhd"]);
  const hdlr = gaseste(b, trak, ["mdia", "hdlr"]);
  const smhd = gaseste(b, trak, ["mdia", "minf", "smhd"]);
  const dinf = gaseste(b, trak, ["mdia", "minf", "dinf"]);
  const stsd = gaseste(b, stbl, ["stsd"]);
  if (!mvhd || !tkhd || !hdlr || !dinf || !stsd)
    throw new Error("antet incomplet");
  const timpFilm = citesteTimp(b, mvhd);
  const durataFilm = Math.round(
    (durataPista * timpFilm.timescale) / timpPista.timescale,
  );

  const copie = (c: Cutie) => b.slice(c.de, c.pana);
  const cuDurata = (
    c: Cutie,
    durataLa: number,
    lunga: boolean,
    valoare: number,
  ) => {
    const o = copie(c);
    const w = new DataView(o.buffer);
    if (lunga) w.setBigUint64(durataLa - c.de, BigInt(valoare));
    else w.setUint32(durataLa - c.de, valoare);
    return o;
  };
  // În `tkhd` durata stă după track_ID și un câmp rezervat.
  const versiuneTk = b[tkhd.continut];
  const durataTk =
    tkhd.continut + (versiuneTk === 1 ? 4 + 8 + 8 + 4 + 4 : 4 + 4 + 4 + 4 + 4);

  // stts: duratele, comprimate în șiruri egale (AAC = aproape toate 1024).
  const siruri: [number, number][] = [];
  for (const d of durate) {
    const ultimul = siruri[siruri.length - 1];
    if (ultimul && ultimul[1] === d) ultimul[0]++;
    else siruri.push([1, d]);
  }

  const stts = fullBox("stts", [siruri.length, ...siruri.flat()]);
  const stsc = fullBox("stsc", [1, 1, marimi.length, 1]); // o singură bucată cu toate eșantioanele
  const stsz = fullBox("stsz", [0, marimi.length, ...marimi]);
  const stco = fullBox("stco", [1, 0]); // offset-ul se scrie după ce știm mărimea lui `moov`

  const stblNou = cutie("stbl", [copie(stsd), stts, stsc, stsz, stco]);
  const minfNou = cutie("minf", [
    ...(smhd ? [copie(smhd)] : []),
    copie(dinf),
    stblNou,
  ]);
  const mdiaNou = cutie("mdia", [
    cuDurata(mdhd, timpPista.durataLa, timpPista.lunga, durataPista),
    copie(hdlr),
    minfNou,
  ]);
  const trakNou = cutie("trak", [
    cuDurata(tkhd, durataTk, versiuneTk === 1, durataFilm),
    mdiaNou,
  ]);
  const moovNou = cutie("moov", [
    cuDurata(mvhd, timpFilm.durataLa, timpFilm.lunga, durataFilm),
    trakNou,
  ]);
  const ftyp = cutieOcteti(
    "ftyp",
    ascii("M4A "),
    u32(0),
    ascii("M4A "),
    ascii("mp42"),
    ascii("isom"),
  );
  const sunet = bucati.reduce((s, x) => s + x.length, 0);
  const mdatAntet = new Uint8Array(8);
  new DataView(mdatAntet.buffer).setUint32(0, 8 + sunet);
  mdatAntet.set(ascii("mdat"), 4);

  const iesire = new Uint8Array(ftyp.length + moovNou.length + 8 + sunet);
  iesire.set(ftyp, 0);
  iesire.set(moovNou, ftyp.length);
  iesire.set(mdatAntet, ftyp.length + moovNou.length);
  let p = ftyp.length + moovNou.length + 8;
  for (const x of bucati) {
    iesire.set(x, p);
    p += x.length;
  }
  // Ultimul câmp din `stco` (singura bucată) = unde începe sunetul.
  const stcoNou = gaseste(iesire, null, [
    "moov",
    "trak",
    "mdia",
    "minf",
    "stbl",
    "stco",
  ])!;
  new DataView(iesire.buffer).setUint32(
    stcoNou.continut + 8,
    ftyp.length + moovNou.length + 8,
  );

  return {
    octeti: iesire,
    durataMs: Math.round((durataPista * 1000) / timpPista.timescale),
  };
}

function ascii(s: string) {
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

function u32(n: number) {
  const o = new Uint8Array(4);
  new DataView(o.buffer).setUint32(0, n);
  return o;
}

function cutieOcteti(nume: string, ...parti: Uint8Array[]) {
  const marime = 8 + parti.reduce((s, x) => s + x.length, 0);
  const o = new Uint8Array(marime);
  new DataView(o.buffer).setUint32(0, marime);
  o.set(ascii(nume), 4);
  let p = 8;
  for (const x of parti) {
    o.set(x, p);
    p += x.length;
  }
  return o;
}

function cutie(nume: string, copii: Uint8Array[]) {
  return cutieOcteti(nume, ...copii);
}

/** Cutie „full" (versiune 0, fără fanioane) cu câmpuri de 32 de biți. */
function fullBox(nume: string, campuri: number[]) {
  return cutieOcteti(nume, u32(0), ...campuri.map(u32));
}
