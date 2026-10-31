import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as Y from "yjs";

import { BBT_ADMIN_URL } from "../../config";
import { cerereCont } from "../../tokenBbt";

import type { Editare } from "./diferentaNotita";

export type StareNotita = "conectare" | "live" | "reconectare" | "interzis";

type Ascultatori = {
  laText: () => void;
  laStare: (s: StareNotita) => void;
  laPrezenti: (nume: string[]) => void;
  /** Cineva a urcat sau a șters un instrumental. */
  laInstrumentale: () => void;
};

const LOCAL = Symbol("local");
const STRANGERE_MS = 200;
/** Serverul trimite `ping` la 20 de secunde. Două lipsă = conexiunea e moartă. */
const TACERE_MS = 45_000;
const PREZENTA_MS = 15_000;

const laBase64 = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
};
const dinBase64 = (b: string) => {
  const s = atob(b);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
};

/**
 * BBT: legătura notiței de sesiune cu adminul, în hub. Copia lui `mobil/src/notita/legatura.ts`, același protocol ca
 * site-ul (`NotiteProvider.ts`): SSE în jos, POST în sus, update-uri Yjs strânse la 200 ms.
 *
 * ⚠️ Document NOU la fiecare conexiune: serverul își uită documentul la 30 de secunde după ultimul om și îl reface din
 * text, cu altă istorie Yjs, iar un document vechi îmbinat cu cel refăcut ar DUBLA notița. Ce e nesalvat pleacă întâi, pe
 * documentul vechi, iar cât nu e conexiune nu se poate scrie.
 */
export class LegaturaNotita {
  private doc: Y.Doc | null = null;
  private text: Y.Text | null = null;
  private prezenta: Awareness | null = null;
  private deTrimis: Uint8Array[] = [];
  private trimitere: Promise<void> = Promise.resolve();
  private ceasStrangere: ReturnType<typeof setTimeout> | null = null;
  private ceasPrezenta: ReturnType<typeof setInterval> | null = null;
  private conexiune: AbortController | null = null;
  private oprita = true;

  constructor(
    private sesiune: () => string,
    private sesiuneId: string,
    private eu: { nume: string; culoare: string },
    private asc: Ascultatori,
  ) {}

  continut(): string {
    return this.text?.toString() ?? "";
  }

  scrie(operatii: Editare[]) {
    const { doc, text } = this;
    if (!doc || !text) return;
    doc.transact(() => {
      for (const o of operatii) {
        if (o.sterse) text.delete(o.index, o.sterse);
        if (o.adaugate) text.insert(o.index, o.adaugate);
      }
    }, LOCAL);
  }

  porneste() {
    if (!this.oprita) return;
    this.oprita = false;
    void this.bucla();
  }

  opreste() {
    this.oprita = true;
    this.ieiDinPrezenta();
    void this.trimite();
    this.conexiune?.abort();
    this.conexiune = null;
    if (this.ceasPrezenta) clearInterval(this.ceasPrezenta);
    this.ceasPrezenta = null;
  }

  private posteaza(corp: { t: "sync" | "awareness"; d: string }) {
    return cerereCont(
      this.sesiune(),
      `/api/public/sessions/${this.sesiuneId}/notite/update`,
      { method: "POST", body: JSON.stringify(corp) },
    ).then(
      () => true,
      () => false,
    );
  }

  private async bucla() {
    let incercari = 0;
    this.asc.laStare("conectare");
    while (!this.oprita) {
      await this.trimite();
      if (this.deTrimis.length === 0) {
        const conexiune = new AbortController();
        this.conexiune = conexiune;
        let tacere: ReturnType<typeof setTimeout> | null = null;
        const traieste = () => {
          if (tacere) clearTimeout(tacere);
          tacere = setTimeout(() => conexiune.abort(), TACERE_MS);
        };
        try {
          const { bilet } = await cerereCont<{ bilet?: string }>(
            this.sesiune(),
            "/api/public/participant/bilet-stream",
            { method: "POST" },
          );
          if (this.oprita) return;
          const r = await fetch(
            `${BBT_ADMIN_URL}/api/public/sessions/${this.sesiuneId}/notite/stream?token=${encodeURIComponent(bilet ?? "")}`,
            { signal: conexiune.signal },
          );
          if (r.status === 403) {
            this.oprita = true;
            this.asc.laStare("interzis");
            return;
          }
          if (!r.ok || !r.body) throw new Error(`flux ${r.status}`);
          this.documentNou();
          traieste();
          await this.citeste(r.body, () => {
            traieste();
            incercari = 0;
          });
        } catch {
          // Se reîncearcă mai jos.
        } finally {
          if (tacere) clearTimeout(tacere);
        }
      }
      if (this.oprita) return;
      this.asc.laStare("reconectare");
      await new Promise((gata) =>
        setTimeout(gata, Math.min(30_000, 1000 * 2 ** incercari++)),
      );
    }
  }

  private documentNou() {
    this.prezenta?.destroy();
    this.doc?.destroy();
    const doc = new Y.Doc();
    const text = doc.getText("content");
    const prezenta = new Awareness(doc);
    prezenta.setLocalStateField("user", {
      name: this.eu.nume,
      color: this.eu.culoare,
      colorLight: `${this.eu.culoare}33`,
    });
    doc.on("update", (update: Uint8Array, origine: unknown) => {
      if (origine === this) return;
      this.deTrimis.push(update);
      this.ceasStrangere ??= setTimeout(() => {
        this.ceasStrangere = null;
        void this.trimite();
      }, STRANGERE_MS);
    });
    text.observe((e) => {
      if (e.transaction.origin !== LOCAL) this.asc.laText();
    });
    prezenta.on("change", () => {
      const nume = new Set<string>();
      prezenta.getStates().forEach((stare, client) => {
        const n = (stare as { user?: { name?: string } }).user?.name;
        if (client !== doc.clientID && n) nume.add(n);
      });
      this.asc.laPrezenti([...nume]);
    });
    this.doc = doc;
    this.text = text;
    this.prezenta = prezenta;
    this.ceasPrezenta ??= setInterval(() => this.anuntaPrezenta(), PREZENTA_MS);
  }

  private async citeste(corp: ReadableStream<Uint8Array>, laDate: () => void) {
    const cititor = corp.getReader();
    let rest = "";
    for (;;) {
      const { done, value } = await cititor.read();
      if (done) return;
      laDate();
      for (let i = 0; i < value.length; i++)
        rest += String.fromCharCode(value[i]);
      let capat = rest.indexOf("\n\n");
      while (capat >= 0) {
        const bucata = rest.slice(0, capat);
        rest = rest.slice(capat + 2);
        if (bucata.startsWith("data: ")) this.primeste(bucata.slice(6));
        capat = rest.indexOf("\n\n");
      }
    }
  }

  private primeste(json: string) {
    const { doc, prezenta } = this;
    if (!doc || !prezenta) return;
    let m: { t?: string; d?: string };
    try {
      m = JSON.parse(json) as { t?: string; d?: string };
    } catch {
      return;
    }
    if (m.t === "sync" && m.d) {
      Y.applyUpdate(doc, dinBase64(m.d), this);
      this.asc.laStare("live");
      this.asc.laText();
      this.anuntaPrezenta();
    } else if (m.t === "awareness" && m.d) {
      applyAwarenessUpdate(prezenta, dinBase64(m.d), this);
    } else if (m.t === "instrumental") {
      this.asc.laInstrumentale();
    }
  }

  private trimite(): Promise<void> {
    this.trimitere = this.trimitere.then(async () => {
      if (this.deTrimis.length === 0) return;
      const update = Y.mergeUpdates(this.deTrimis);
      this.deTrimis = [];
      if (await this.posteaza({ t: "sync", d: laBase64(update) })) return;
      this.deTrimis.unshift(update);
      if (!this.oprita)
        this.ceasStrangere ??= setTimeout(() => {
          this.ceasStrangere = null;
          void this.trimite();
        }, 2000);
    });
    return this.trimitere;
  }

  private anuntaPrezenta() {
    const { doc, prezenta } = this;
    if (!doc || !prezenta) return;
    void this.posteaza({
      t: "awareness",
      d: laBase64(encodeAwarenessUpdate(prezenta, [doc.clientID])),
    });
  }

  private ieiDinPrezenta() {
    const { doc, prezenta } = this;
    if (!doc || !prezenta) return;
    removeAwarenessStates(prezenta, [doc.clientID], "plecat");
    this.anuntaPrezenta();
  }
}
