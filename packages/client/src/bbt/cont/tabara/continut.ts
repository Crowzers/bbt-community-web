/**
 * BBT: programul și meniul unei tabere, plus treptele de Banger. Copii, nu importuri: fork-ul e alt
 * repo. ⚠️ `parseProgram`/`parseMeniu`/`etichetaZi` = `website/src/lib/campContent.ts` (care are
 * deja un geamăn în `admin/lib/campContent.ts`); `tierPentruNumar` = `website/src/lib/bangers.ts`.
 * Orice schimbare de contract acolo se face și aici.
 *
 * Cheia e INDEXUL zilei (1-based), nu data: dacă tabăra se mută, programul vine după ea singur.
 */

export interface ProgramZi {
  ziua: number;
  intrari: { ora: string; titlu: string }[];
}

export interface MeniuZi {
  ziua: number;
  micDejun: string;
  pranz: string;
  cina: string;
  vegetarian: string;
}

/** `null` = text liber dintr-o tabără veche: se afișează ca atare. */
export function parseProgram(
  raw: string | null | undefined,
): ProgramZi[] | null {
  const data = parseJsonArray(raw);
  if (!data) return null;
  const zile: ProgramZi[] = [];
  for (const item of data) {
    if (
      !isRecord(item) ||
      !isZiValid(item.ziua) ||
      !Array.isArray(item.intrari)
    )
      return null;
    const intrari: ProgramZi["intrari"] = [];
    for (const i of item.intrari) {
      if (
        !isRecord(i) ||
        typeof i.ora !== "string" ||
        typeof i.titlu !== "string"
      )
        return null;
      intrari.push({ ora: i.ora, titlu: i.titlu });
    }
    zile.push({ ziua: item.ziua as number, intrari });
  }
  return zile.sort((a, b) => a.ziua - b.ziua);
}

export function parseMeniu(raw: string | null | undefined): MeniuZi[] | null {
  const data = parseJsonArray(raw);
  if (!data) return null;
  const zile: MeniuZi[] = [];
  for (const item of data) {
    if (!isRecord(item) || !isZiValid(item.ziua)) return null;
    zile.push({
      ziua: item.ziua as number,
      micDejun: asText(item.micDejun),
      pranz: asText(item.pranz),
      cina: asText(item.cina),
      vegetarian: asText(item.vegetarian),
    });
  }
  return zile.sort((a, b) => a.ziua - b.ziua);
}

/** „Ziua 1 - Marți, 1 sept." Se recalculează din dataStart + n. */
export function etichetaZi(dataStart: string, ziua: number): string {
  const d = new Date(dataStart);
  d.setDate(d.getDate() + ziua - 1);
  const zi = d.toLocaleDateString("ro-RO", { weekday: "long" });
  const scurt = d.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
  return `Ziua ${ziua} - ${zi.charAt(0).toUpperCase()}${zi.slice(1)}, ${scurt}`;
}

export type TreaptaBanger =
  | "none"
  | "first"
  | "double"
  | "triple"
  | "bronze"
  | "silver"
  | "gold"
  | "diamond";

export function tierPentruNumar(n: number): {
  nume: string;
  tier: TreaptaBanger;
  cuContor: boolean;
} {
  if (n <= 0) return { nume: "No Bangers Yet", tier: "none", cuContor: false };
  if (n === 1) return { nume: "First Banger", tier: "first", cuContor: false };
  if (n === 2)
    return { nume: "Double Banger", tier: "double", cuContor: false };
  if (n === 3)
    return { nume: "Triple Banger", tier: "triple", cuContor: false };
  if (n <= 5) return { nume: "Bronze Banger", tier: "bronze", cuContor: true };
  if (n <= 8) return { nume: "Silver Banger", tier: "silver", cuContor: true };
  if (n <= 11) return { nume: "Gold Banger", tier: "gold", cuContor: true };
  return { nume: "Diamond Banger", tier: "diamond", cuContor: true };
}

function parseJsonArray(raw: string | null | undefined): unknown[] | null {
  if (!raw || !raw.trim()) return null;
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isZiValid = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 1;
const asText = (v: unknown) => (typeof v === "string" ? v : "");
