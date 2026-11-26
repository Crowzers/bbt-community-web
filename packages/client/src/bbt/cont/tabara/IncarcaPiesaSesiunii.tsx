import {
  For,
  JSX,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";

import { QRCodeSVG } from "solid-qr-code";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_ADMIN_URL, BBT_SITE_URL } from "../../config";
import { cerereCont } from "../../tokenBbt";
import { useSesiune } from "../date";
import { Buton, C, Eticheta2 } from "../ui";

import { DecupajPatrat, butonMic } from "./DecupajPatrat";
import { oSinguraPiesa } from "./redareUnica";

/**
 * BBT: „Încarcă piesa sesiunii” (22 nov 2026), deschis din cardul sesiunii, cu sesiunea fixă. Comportamentul e al site-ului
 * (`website/src/app/[limba]/my-camp/[id]/IncarcaPiesaSesiunii.tsx`) și al aplicației (`mobil/src/cont/FoaieUrcaPiesa.tsx`);
 * codul e scris aici de la zero. Design: `admin/docs/plans/2026-11-22-piesa-sesiunii-artwork-design.md`.
 *
 * - Artwork obligatoriu (D1). Pe calculator: cod QR spre pagina de pe telefon a SITE-ului (D6), iar poza apare aici live din
 *   SSE (D8); sau o imagine de pe calculator, cu decupaj pătrat. Pe telefon: direct camera sau galeria, fără QR (omul e deja
 *   pe telefon).
 * - Piesa se trage într-o zonă (userul) și se poate asculta înainte de trimitere (D11); restul pieselor din pagină tac cât
 *   asculți (`redareUnica.ts`).
 * - Autorii: cei din sesiune și producătorul executiv sunt trecuți deja (D4); ceilalți se caută după numele de scenă (D5).
 */

export interface OmTabara {
  id: string;
  numeComplet: string;
  numeAfisat?: string | null;
  avatarUrl?: string | null;
  /** Unde duce apăsarea pe om (25 nov 2026, `lib/omCard.ts` din admin): profilul scurt din Community, altfel site-ul. */
  stoatUserId?: string | null;
  username?: string | null;
}

type Artwork =
  | { tip: "fisier"; blob: Blob; previzualizare: string }
  | { tip: "ciorna"; url: string };

const MAX_MP3 = 15 * 1024 * 1024;

/** Numele de scenă, dacă omul și-a pus unul. Așa îl știu ceilalți în studio. */
export const numeScena = (o: OmTabara) => o.numeAfisat?.trim() || o.numeComplet;
const faraDiacritice = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const initiale = (s: string) => {
  const p = s.trim().split(/\s+/);
  return (p.length > 1 ? p[0][0] + p[1][0] : s.slice(0, 2)).toUpperCase();
};
// Culorile deschise ale hub-ului, alese după id: omul are aceeași bulină peste tot în formular.
const CULORI = [
  C.galben,
  C.verdeDeschis,
  C.roz,
  C.galbenDeschis,
  C.lilaDeschis,
  C.portocaliuDeschis,
];
const culoare = (id: string) =>
  CULORI[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % CULORI.length];
const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Undă din piesa reală (vârfurile pe 90 de bucăți). Dacă browserul n-o poate decoda, bare egale: ascultarea merge oricum. */
async function undaDinFisier(f: File, n = 90): Promise<number[]> {
  try {
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(await f.arrayBuffer());
    const date = buf.getChannelData(0);
    const pas = Math.floor(date.length / n);
    const varfuri = Array.from({ length: n }, (_, k) => {
      let max = 0;
      for (let j = k * pas; j < (k + 1) * pas; j += 64)
        max = Math.max(max, Math.abs(date[j]));
      return max;
    });
    void ctx.close();
    const m = Math.max(...varfuri, 0.01);
    return varfuri.map((v) => v / m);
  } catch {
    return Array.from({ length: n }, () => 0.5);
  }
}

function Bulina(props: { om: OmTabara; eu?: boolean }) {
  return (
    <Show
      when={props.om.avatarUrl}
      fallback={
        <span
          style={{
            width: "26px",
            height: "26px",
            "border-radius": "50%",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "flex-shrink": 0,
            background: culoare(props.om.id),
            color: C.negru,
            // Doar majuscule, deci 12 e voie.
            "font-size": "12px",
            "font-weight": 700,
          }}
        >
          {props.eu ? "TU" : initiale(numeScena(props.om))}
        </span>
      }
    >
      <img
        src={props.om.avatarUrl!}
        alt=""
        style={{
          width: "26px",
          height: "26px",
          "border-radius": "50%",
          "object-fit": "cover",
          "flex-shrink": 0,
        }}
      />
    </Show>
  );
}

/** Titlul unei părți a formularului, cu „OBLIGATORIU” în roșu unde e cazul. */
function TitluParte(props: { children: JSX.Element; obligatoriu?: boolean }) {
  return (
    <Eticheta2>
      {props.children}
      <Show when={props.obligatoriu}>
        <span style={{ color: C.rosu, "margin-left": "8px" }}>obligatoriu</span>
      </Show>
    </Eticheta2>
  );
}

const CUTIE: JSX.CSSProperties = {
  "border-radius": "20px",
  background: C.fundal,
  padding: "16px",
};
const CUTIE_GOALA: JSX.CSSProperties = {
  ...CUTIE,
  border: `2px dashed ${C.slab}`,
};
const CAMP: JSX.CSSProperties = {
  width: "100%",
  height: "48px",
  padding: "0 16px",
  "box-sizing": "border-box",
  "border-radius": "14px",
  border: `1px solid ${C.linie}`,
  background: C.fundal,
  color: C.text,
  outline: "none",
  "font-family": "inherit",
  // 16, nu mai puțin: sub 16 Safari pe iOS mărește pagina la fiecare câmp atins.
  "font-size": "16px",
};

export function IncarcaPiesaSesiunii(props: {
  campId: string;
  sesiune: { id: string; numar: number; studio: number };
  colegiSesiune: OmTabara[];
  producator: OmTabara | null;
  oameniTabara: OmTabara[];
  euId: string;
  laIncarcat: () => void;
  laInchide: () => void;
}) {
  const sesiune = useSesiune();

  const [titlu, setTitlu] = createSignal("");
  const [eroare, setEroare] = createSignal("");
  const [trimite, setTrimite] = createSignal(false);

  // ── Artwork
  // „Telefon” = ecran tactil fără mouse, nu lățimea ferestrei: un laptop îngust tot are nevoie de QR, o tabletă cu mouse la fel.
  const peTelefon = window.matchMedia(
    "(pointer: coarse) and (hover: none)",
  ).matches;
  const [artwork, setArtwork] = createSignal<Artwork | null>(null);
  const [deDecupat, setDeDecupat] = createSignal<File | null>(null);
  const [token, setToken] = createSignal<string | null>(null);
  const [qrExpirat, setQrExpirat] = createSignal(false);
  const [qrEsuat, setQrEsuat] = createSignal(false);
  let inputCalculator: HTMLInputElement | undefined;
  let inputCamera: HTMLInputElement | undefined;
  let inputGalerie: HTMLInputElement | undefined;

  // Ciorna + codul QR, doar pe calculator. Una nouă la fiecare deschidere a formularului: una veche poate avea deja poza
  // altei piese (ruta ciornei din admin).
  onMount(() => {
    if (peTelefon) return;
    let activ = true;
    let ceasExpirare: ReturnType<typeof setTimeout> | undefined;
    onCleanup(() => {
      activ = false;
      clearTimeout(ceasExpirare);
    });
    cerereCont<{ token: string; expiresAt: string }>(
      sesiune(),
      `/api/public/sessions/${props.sesiune.id}/artwork`,
      { method: "POST" },
    ).then(
      (d) => {
        if (!activ) return;
        setToken(d.token);
        const ramas = new Date(d.expiresAt).getTime() - Date.now();
        ceasExpirare = setTimeout(
          () => activ && setQrExpirat(true),
          Math.max(0, ramas),
        );
      },
      () => activ && setQrEsuat(true),
    );
  });

  // Pagina de pe telefon e pe SITE, nu în hub: acolo omul ajunge fără login, doar cu tokenul (D6). Fără prefix de limbă:
  // româna e implicită, iar telefonul poate fi în orice limbă.
  const linkTelefon = () =>
    token() ? `${BBT_SITE_URL}/artwork/${token()}` : null;

  // Live: când telefonul a urcat poza, codul QR e înlocuit de ea. Fluxul trimite și poza deja ajunsă, la reconectare.
  createEffect(
    on(token, (t) => {
      if (!t) return;
      const es = new EventSource(
        `${BBT_ADMIN_URL}/api/public/artwork/${t}/stream`,
      );
      es.onmessage = (e) => {
        try {
          const { url } = JSON.parse(e.data as string) as { url?: string };
          if (url) setArtwork({ tip: "ciorna", url });
        } catch {
          // ping sau mesaj stricat: ignorăm
        }
      };
      onCleanup(() => es.close());
    }),
  );

  // Previzualizarea locală se eliberează când poza se schimbă sau formularul se închide.
  createEffect(
    on(artwork, (a) => {
      if (a?.tip === "fisier")
        onCleanup(() => URL.revokeObjectURL(a.previzualizare));
    }),
  );

  function alegePoza(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setEroare("Alege o imagine.");
      return;
    }
    setEroare("");
    setDeDecupat(f);
  }

  const imagineArtwork = () => {
    const a = artwork();
    return a ? (a.tip === "fisier" ? a.previzualizare : a.url) : null;
  };

  // ── Piesa (zona de tras și ascultat e `ZonaMp3`, comună cu înlocuirea fișierului)
  const [mp3, setMp3] = createSignal<File | null>(null);
  const [durata, setDurata] = createSignal(0);

  // ── Autorii
  const toti = createMemo(() => {
    const m = new Map<string, OmTabara>();
    for (const o of [
      ...props.oameniTabara,
      ...props.colegiSesiune,
      ...(props.producator ? [props.producator] : []),
    ])
      if (!m.has(o.id)) m.set(o.id, o);
    return m;
  });
  const dinSesiune = createMemo(
    () =>
      new Set([
        ...props.colegiSesiune.map((c) => c.id),
        ...(props.producator ? [props.producator.id] : []),
      ]),
  );
  // Omul curent e mereu printre autori; colegii și producătorul se pot scoate. Citiți o dată, la deschidere: o recitire a
  // sesiunilor cât formularul e deschis n-ar trebui să pună înapoi pe cine omul a scos cu ×.
  const [alesi, setAlesi] = createSignal<string[]>(
    untrack(() =>
      [
        props.euId,
        ...props.colegiSesiune.map((c) => c.id),
        ...(props.producator ? [props.producator.id] : []),
      ].filter((v, i, a) => v && a.indexOf(v) === i),
    ),
  );
  const [cautare, setCautare] = createSignal("");
  const [lista, setLista] = createSignal(false);
  const gasiti = createMemo(() => {
    const q = faraDiacritice(cautare().trim());
    if (!q) return [];
    return [...toti().values()]
      .filter((o) => o.id !== props.euId)
      .filter(
        (o) =>
          faraDiacritice(numeScena(o)).includes(q) ||
          faraDiacritice(o.numeComplet).includes(q),
      )
      .slice(0, 8);
  });

  function comutaAutor(id: string) {
    if (id === props.euId) return;
    setAlesi((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  // ── Trimiterea
  const lipsesc = createMemo(
    () =>
      [
        !artwork() && "artwork-ul",
        !mp3() && "piesa",
        !titlu().trim() && "titlul",
      ].filter(Boolean) as string[],
  );

  async function incarca() {
    const f = mp3();
    const a = artwork();
    if (lipsesc().length || !f || !a || trimite()) return;
    setTrimite(true);
    setEroare("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("title", titlu().trim());
      fd.append("sessionId", props.sesiune.id);
      if (durata()) fd.append("duration", String(Math.round(durata())));
      fd.append("contributorIds", JSON.stringify(alesi()));
      const t = token();
      if (a.tip === "ciorna" && t) fd.append("artworkToken", t);
      else if (a.tip === "fisier")
        fd.append(
          "cover",
          new File([a.blob], "artwork.jpg", { type: "image/jpeg" }),
        );
      await cerereCont(
        sesiune(),
        `/api/public/camps/${props.campId}/playlist`,
        { method: "POST", body: fd },
      );
      props.laIncarcat();
    } catch (err) {
      // Serverul trimite motivul în română în `error` (ex. „Artwork-ul trebuie să fie pătrat”); restul e rețeaua.
      setEroare(
        err instanceof Error &&
          err.message &&
          err.message !== "Cererea n-a mers." &&
          err.name !== "TypeError"
          ? err.message
          : "Piesa n-a urcat. Încearcă din nou.",
      );
    } finally {
      setTrimite(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "18px",
        "margin-top": "6px",
        "padding-top": "16px",
        "border-top": `1px solid ${C.linie}`,
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
        <p
          style={{
            margin: 0,
            color: C.text,
            "font-size": "20px",
            "font-weight": 700,
          }}
        >
          Încarcă piesa sesiunii
        </p>
        {/* Sesiunea e fixă: piesa e a sesiunii din care s-a deschis formularul (D2). */}
        <span
          style={{
            "align-self": "flex-start",
            padding: "5px 12px",
            "border-radius": "999px",
            background: C.fundal,
            color: C.text,
            "font-size": "14px",
            "font-weight": 600,
          }}
        >
          Sesiunea {props.sesiune.numar} · Studio {props.sesiune.studio}
        </span>
      </div>

      {/* ── Artwork */}
      <div>
        <TitluParte obligatoriu>Artwork</TitluParte>
        <Switch>
          <Match when={deDecupat()} keyed>
            {(f) => (
              <div style={CUTIE}>
                <DecupajPatrat
                  fisier={f}
                  textRenunt={peTelefon ? "Refă poza" : undefined}
                  laRenunt={() => setDeDecupat(null)}
                  laGata={(blob) => {
                    setArtwork({
                      tip: "fisier",
                      blob,
                      previzualizare: URL.createObjectURL(blob),
                    });
                    setDeDecupat(null);
                  }}
                />
              </div>
            )}
          </Match>
          <Match when={imagineArtwork()}>
            {(img) => (
              <div
                style={{
                  ...CUTIE,
                  display: "flex",
                  "align-items": "center",
                  gap: "16px",
                  "flex-wrap": "wrap",
                }}
              >
                <img
                  src={img()}
                  alt=""
                  style={{
                    width: "140px",
                    height: "140px",
                    "border-radius": "14px",
                    "object-fit": "cover",
                    "flex-shrink": 0,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    "flex-direction": "column",
                    gap: "8px",
                    "align-items": "flex-start",
                  }}
                >
                  <Show when={artwork()?.tip === "ciorna"}>
                    <span
                      style={{
                        padding: "4px 12px",
                        "border-radius": "999px",
                        background: C.verdeDeschis,
                        color: C.negru,
                        "font-size": "14px",
                        "font-weight": 600,
                      }}
                    >
                      A venit de pe telefon
                    </span>
                  </Show>
                  <div
                    style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}
                  >
                    <Show
                      when={peTelefon}
                      fallback={
                        <button
                          type="button"
                          onClick={() => setArtwork(null)}
                          style={butonMic("alb")}
                        >
                          Fă alta cu telefonul
                        </button>
                      }
                    >
                      <button
                        type="button"
                        onClick={() => inputCamera?.click()}
                        style={butonMic("alb")}
                      >
                        Fă alta
                      </button>
                    </Show>
                    <button
                      type="button"
                      onClick={() =>
                        (peTelefon ? inputGalerie : inputCalculator)?.click()
                      }
                      style={butonMic("alb")}
                    >
                      {peTelefon ? "Alege din galerie" : "Din calculator"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Match>
          <Match when={peTelefon}>
            <div
              style={{ display: "flex", "align-items": "center", gap: "12px" }}
            >
              <div
                style={{
                  ...CUTIE_GOALA,
                  width: "96px",
                  height: "96px",
                  padding: 0,
                  "box-sizing": "border-box",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "flex-shrink": 0,
                  color: C.text,
                }}
              >
                <Symbol size={28}>photo_camera</Symbol>
              </div>
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "8px",
                  flex: 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => inputCamera?.click()}
                  style={{ ...butonMic("roz"), width: "100%" }}
                >
                  Fă o poză
                </button>
                <button
                  type="button"
                  onClick={() => inputGalerie?.click()}
                  style={{ ...butonMic("alb"), width: "100%" }}
                >
                  Alege din galerie
                </button>
              </div>
            </div>
          </Match>
          <Match when={!peTelefon}>
            <div
              style={{
                ...CUTIE_GOALA,
                display: "flex",
                "align-items": "center",
                gap: "20px",
                "flex-wrap": "wrap",
              }}
            >
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  padding: "8px",
                  "box-sizing": "border-box",
                  "border-radius": "14px",
                  background: "#FFFFFF",
                  border: `1px solid ${C.linie}`,
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "flex-shrink": 0,
                }}
              >
                <Switch
                  fallback={
                    <span
                      style={{
                        color: C.stins,
                        "font-size": "14px",
                        "text-align": "center",
                      }}
                    >
                      Se pregătește codul…
                    </span>
                  }
                >
                  <Match when={qrExpirat()}>
                    <span
                      style={{
                        color: C.stins,
                        "font-size": "14px",
                        "text-align": "center",
                      }}
                    >
                      Codul a expirat. Închide și deschide din nou formularul.
                    </span>
                  </Match>
                  <Match when={qrEsuat()}>
                    <span
                      style={{
                        color: C.stins,
                        "font-size": "14px",
                        "text-align": "center",
                      }}
                    >
                      Codul nu s-a putut face. Alege imaginea de pe calculator.
                    </span>
                  </Match>
                  <Match when={linkTelefon()}>
                    {(link) => (
                      <QRCodeSVG
                        value={link()}
                        level="medium"
                        width={162}
                        height={162}
                        backgroundColor="white"
                        foregroundColor="black"
                        backgroundAlpha={1}
                        foregroundAlpha={1}
                      />
                    )}
                  </Match>
                </Switch>
              </div>
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "10px",
                  "align-items": "flex-start",
                  "min-width": 0,
                  flex: "1 1 220px",
                }}
              >
                <span
                  style={{
                    color: C.text,
                    "font-size": "20px",
                    "font-weight": 700,
                  }}
                >
                  Fă artwork-ul cu telefonul
                </span>
                <span style={{ color: C.stins, "font-size": "16px" }}>
                  Deschide camera, îndreaptă-o spre cod și fă o poză. O vezi
                  aici imediat.
                </span>
                <Show when={!qrExpirat() && !qrEsuat()}>
                  <span
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      gap: "8px",
                      color: C.stins,
                      "font-size": "14px",
                      "font-weight": 600,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        "border-radius": "50%",
                        background: C.verdeBara,
                      }}
                    />
                    Așteptăm poza
                  </span>
                </Show>
                <button
                  type="button"
                  onClick={() => inputCalculator?.click()}
                  style={{
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: C.text,
                    "font-family": "inherit",
                    "font-size": "14px",
                    "font-weight": 600,
                    "text-decoration": "underline",
                    "text-underline-offset": "4px",
                    cursor: "pointer",
                  }}
                >
                  Am imaginea pe calculator
                </button>
              </div>
            </div>
          </Match>
        </Switch>
        <input
          ref={inputCalculator}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            alegePoza(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={inputCamera}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            alegePoza(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={inputGalerie}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            alegePoza(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {/* ── Titlu */}
      <label style={{ display: "block" }}>
        <TitluParte>Titlu</TitluParte>
        <input
          type="text"
          value={titlu()}
          onInput={(e) => setTitlu(e.currentTarget.value)}
          placeholder="ex. Deep House de dimineață"
          maxLength={160}
          style={CAMP}
        />
      </label>

      {/* ── Piesa */}
      <div>
        <TitluParte obligatoriu>Piesa</TitluParte>
        <ZonaMp3
          mp3={mp3()}
          laAlege={(f) => {
            setMp3(f);
            if (!titlu())
              setTitlu(
                f.name
                  .replace(/\.mp3$/i, "")
                  .replace(/[-_]+/g, " ")
                  .trim(),
              );
          }}
          laDurata={setDurata}
          laEroare={setEroare}
          peTelefon={peTelefon}
          opreste={trimite()}
        />
      </div>

      {/* ── Autorii */}
      <div>
        <TitluParte>Cine a lucrat la piesă</TitluParte>
        <div
          style={{
            display: "flex",
            "flex-wrap": "wrap",
            gap: "6px",
            "margin-bottom": "10px",
          }}
        >
          <For each={alesi()}>
            {(id) => {
              const om = () => toti().get(id);
              const eu = id === props.euId;
              return (
                <Show when={om()}>
                  {(o) => (
                    <span
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        gap: "8px",
                        padding: eu ? "4px 12px 4px 4px" : "4px 6px 4px 4px",
                        "border-radius": "999px",
                        background: eu ? C.fundal : C.lilaDeschis,
                        color: C.negru,
                        "font-size": "14px",
                        "font-weight": 600,
                      }}
                    >
                      <Bulina om={o()} eu={eu} />
                      {eu ? "Tu" : numeScena(o())}
                      <Show when={!eu && !dinSesiune().has(id)}>
                        <span style={{ color: C.stins, "font-weight": 400 }}>
                          a trecut pe acolo
                        </span>
                      </Show>
                      <Show when={!eu}>
                        <button
                          type="button"
                          onClick={() => comutaAutor(id)}
                          aria-label={`Scoate-l pe ${numeScena(o())}`}
                          style={{
                            width: "24px",
                            height: "24px",
                            "border-radius": "50%",
                            border: 0,
                            background: "rgba(10,10,11,0.1)",
                            color: C.negru,
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Symbol size={14}>close</Symbol>
                        </button>
                      </Show>
                    </span>
                  )}
                </Show>
              );
            }}
          </For>
        </div>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: C.stins,
              display: "flex",
              "pointer-events": "none",
            }}
          >
            <Symbol size={18}>search</Symbol>
          </span>
          <input
            type="text"
            value={cautare()}
            onInput={(e) => {
              setCautare(e.currentTarget.value);
              setLista(true);
            }}
            onFocus={() => setLista(true)}
            onBlur={() => setLista(false)}
            placeholder="A mai trecut cineva? Caută după numele de scenă"
            autocomplete="off"
            style={{ ...CAMP, "padding-left": "42px" }}
          />
          <Show when={lista() && cautare().trim()}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "54px",
                "z-index": 10,
                padding: "6px",
                "border-radius": "16px",
                background: C.fundal,
                "box-shadow": "0 10px 30px rgba(0,0,0,0.12)",
                "max-height": "256px",
                overflow: "auto",
              }}
            >
              <Show
                when={gasiti().length}
                fallback={
                  <p
                    style={{
                      margin: 0,
                      padding: "12px",
                      color: C.stins,
                      "font-size": "14px",
                    }}
                  >
                    Nimeni din tabără cu numele ăsta.
                  </p>
                }
              >
                <For each={gasiti()}>
                  {(o) => (
                    <button
                      type="button"
                      // `mousedown`, nu `click`: altfel `blur` de pe câmp închidea lista înainte să ajungă click-ul.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        comutaAutor(o.id);
                        setCautare("");
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        "align-items": "center",
                        gap: "10px",
                        padding: "8px 10px",
                        border: 0,
                        "border-radius": "12px",
                        background: "transparent",
                        "text-align": "left",
                        "font-family": "inherit",
                        cursor: "pointer",
                      }}
                    >
                      <Bulina om={o} />
                      <span style={{ "min-width": 0, flex: 1 }}>
                        <span
                          style={{
                            display: "block",
                            color: C.text,
                            "font-size": "16px",
                            "font-weight": 600,
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                          }}
                        >
                          {numeScena(o)}
                        </span>
                        <Show when={numeScena(o) !== o.numeComplet}>
                          <span
                            style={{
                              display: "block",
                              color: C.stins,
                              "font-size": "14px",
                              overflow: "hidden",
                              "text-overflow": "ellipsis",
                              "white-space": "nowrap",
                            }}
                          >
                            {o.numeComplet}
                          </span>
                        </Show>
                      </span>
                      <Show when={alesi().includes(o.id)}>
                        <span
                          style={{
                            color: C.stins,
                            "font-size": "14px",
                            "font-weight": 600,
                          }}
                        >
                          Adăugat
                        </span>
                      </Show>
                    </button>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </div>
        <p style={{ margin: "8px 0 0", color: C.stins, "font-size": "14px" }}>
          Colegii din sesiune și producătorul sunt trecuți deja. Scoate-l pe
          cine n-a lucrat la piesa asta.
        </p>
      </div>

      <Show when={eroare()}>
        <p style={{ margin: 0, color: C.rosu, "font-size": "14px" }}>
          {eroare()}
        </p>
      </Show>

      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <Buton
          piele="roz"
          onClick={incarca}
          dezactivat={lipsesc().length > 0 || trimite()}
        >
          {trimite() ? "Se încarcă…" : "Încarcă piesa"}
        </Buton>
        <Buton piele="alb" onClick={() => props.laInchide()}>
          Anulează
        </Buton>
        <Show when={lipsesc().length}>
          <span style={{ color: C.stins, "font-size": "14px" }}>
            Mai lipsește {lipsesc().join(" și ")}.
          </span>
        </Show>
      </div>
    </div>
  );
}

/**
 * Zona în care se trage MP3-ul și se ascultă înainte de trimitere (D11). Stă în „Încarcă piesa sesiunii” și în „Înlocuiește
 * fișierul” (26 nov 2026): scoasă de aici ca cele două să nu ajungă două zone care arată la fel și se poartă diferit.
 * `opreste` pune pauză la trimitere, ca piesa să nu cânte peste încărcare.
 */
function ZonaMp3(props: {
  mp3: File | null;
  laAlege: (f: File) => void;
  laDurata: (secunde: number) => void;
  laEroare: (mesaj: string) => void;
  peTelefon: boolean;
  opreste?: boolean;
}) {
  const [trage, setTrage] = createSignal(false);
  const [unda, setUnda] = createSignal<number[]>([]);
  const [durata, setDurata] = createSignal(0);
  const [pozitie, setPozitie] = createSignal(0);
  const [canta, setCanta] = createSignal(false);
  let audio: HTMLAudioElement | null = null;
  let inputMp3: HTMLInputElement | undefined;

  function puneMp3(f: File | undefined) {
    if (!f) return;
    if (f.type !== "audio/mpeg" && !f.name.toLowerCase().endsWith(".mp3")) {
      props.laEroare("Doar fișiere MP3.");
      return;
    }
    if (f.size > MAX_MP3) {
      props.laEroare("Fișierul e prea mare (maxim 15 MB).");
      return;
    }
    props.laEroare("");
    audio?.pause();
    setCanta(false);
    setPozitie(0);
    setDurata(0);
    setUnda([]);
    props.laAlege(f);
    // Unda vine după decodare: dacă între timp s-a ales alt fișier, nu-i punem unda celui vechi.
    void undaDinFisier(f).then(
      (u) => untrack(() => props.mp3) === f && setUnda(u),
    );
  }

  // Ascultarea din panou: fișierul din memorie, nu urcă nicăieri până la trimitere.
  createEffect(
    on(
      () => props.mp3,
      (f) => {
        if (!f) return;
        const url = URL.createObjectURL(f);
        const a = new Audio(url);
        a.onloadedmetadata = () => {
          const d = Number.isFinite(a.duration) ? a.duration : 0;
          setDurata(d);
          props.laDurata(d);
        };
        a.ontimeupdate = () => setPozitie(a.currentTime);
        a.onended = () => setCanta(false);
        a.onpause = () => setCanta(false);
        a.onplay = () => setCanta(true);
        // Două piese deodată nu se aud: pornită aici, le oprește pe celelalte din pagină; pornită alta, tace asta (D11).
        const scoate = oSinguraPiesa(a);
        audio = a;
        onCleanup(() => {
          a.pause();
          scoate();
          URL.revokeObjectURL(url);
          if (audio === a) audio = null;
        });
      },
    ),
  );

  createEffect(
    on(
      () => props.opreste,
      (o) => {
        if (o) audio?.pause();
      },
    ),
  );

  function comutaAscultarea() {
    if (!audio) return;
    if (!audio.paused) audio.pause();
    else void audio.play();
  }

  function sari(e: MouseEvent) {
    if (!audio || !durata()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * durata();
  }

  return (
    <>
      <Show
        when={props.mp3}
        fallback={
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputMp3?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputMp3?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setTrage(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setTrage(true);
            }}
            onDragLeave={() => setTrage(false)}
            onDrop={(e) => {
              e.preventDefault();
              setTrage(false);
              puneMp3(e.dataTransfer?.files?.[0]);
            }}
            style={{
              ...(trage()
                ? {
                    ...CUTIE,
                    border: `2px solid ${C.negru}`,
                    background: C.rozDeschis,
                  }
                : CUTIE_GOALA),
              "min-height": "132px",
              "box-sizing": "border-box",
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              "justify-content": "center",
              gap: "6px",
              "text-align": "center",
              cursor: "pointer",
            }}
          >
            <Show
              when={!trage()}
              fallback={
                <span style={{ "font-size": "16px", "font-weight": 700 }}>
                  Las-o aici
                </span>
              }
            >
              <Symbol size={28}>upload</Symbol>
              <span
                style={{
                  color: C.text,
                  "font-size": "16px",
                  "font-weight": 700,
                }}
              >
                {props.peTelefon ? "Alege piesa" : "Trage piesa aici"}
              </span>
              <span style={{ color: C.stins, "font-size": "14px" }}>
                {props.peTelefon
                  ? "MP3, maxim 15 MB"
                  : "sau dă click ca s-o alegi · MP3, maxim 15 MB"}
              </span>
            </Show>
          </div>
        }
      >
        {(f) => (
          <div
            style={{
              ...CUTIE,
              padding: "14px",
              display: "flex",
              "align-items": "center",
              gap: "14px",
            }}
          >
            {/* Rozul = acțiunea: butonul de ascultare e de apăsat, nu decor. */}
            <button
              type="button"
              onClick={comutaAscultarea}
              aria-label={
                canta() ? "Pauză" : "Ascultă piesa înainte s-o trimiți"
              }
              style={{
                width: "48px",
                height: "48px",
                "border-radius": "50%",
                border: 0,
                background: C.roz,
                color: C.negru,
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "flex-shrink": 0,
                cursor: "pointer",
              }}
            >
              <Symbol size={24} fill>
                {canta() ? "pause" : "play_arrow"}
              </Symbol>
            </button>
            <div style={{ flex: 1, "min-width": 0 }}>
              <div
                style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "baseline",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    color: C.text,
                    "font-size": "16px",
                    "font-weight": 600,
                    overflow: "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap",
                  }}
                >
                  {f().name}
                </span>
                <span
                  style={{
                    color: C.stins,
                    "font-size": "14px",
                    "font-variant-numeric": "tabular-nums",
                    "white-space": "nowrap",
                  }}
                >
                  {mmss(pozitie())} / {mmss(durata())} ·{" "}
                  {(f().size / 1024 / 1024).toLocaleString("ro-RO", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  MB
                </span>
              </div>
              <div
                role="slider"
                aria-label="Poziția în piesă"
                aria-valuemin={0}
                aria-valuemax={Math.round(durata())}
                aria-valuenow={Math.round(pozitie())}
                tabIndex={0}
                onClick={sari}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "2px",
                  height: "32px",
                  "margin-top": "6px",
                  cursor: "pointer",
                }}
              >
                <For
                  each={
                    unda().length
                      ? unda()
                      : Array.from({ length: 90 }, () => 0.3)
                  }
                >
                  {(v, k) => (
                    <i
                      style={{
                        flex: 1,
                        "min-width": "2px",
                        "border-radius": "2px",
                        height: `${Math.max(12, v * 100)}%`,
                        background:
                          durata() && k() / 90 < pozitie() / durata()
                            ? C.negru
                            : C.slab,
                      }}
                    />
                  )}
                </For>
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputMp3?.click()}
              style={{ ...butonMic("alb"), "flex-shrink": 0 }}
            >
              Schimbă
            </button>
          </div>
        )}
      </Show>
      <input
        ref={inputMp3}
        type="file"
        accept="audio/mpeg,.mp3"
        hidden
        onChange={(e) => {
          puneMp3(e.currentTarget.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
    </>
  );
}

/**
 * BBT: „Înlocuiește fișierul” (26 nov 2026), deschis din cardul sesiunii sub piesa cu varianta greșită. Comportamentul e al
 * site-ului (`my-camp/[id]/InlocuiesteFisierul.tsx`) și al aplicației (`FoaieInlocuiestePiesa`); codul e scris aici de la zero.
 * Alt MP3 pe ACEEAȘI piesă: titlul, artwork-ul, autorii, like-urile și voturile rămân. Regula (doar autorii, doar până se
 * termină tabăra) e pe server, iar butonul apare doar când serverul trimite `poateInlocui`.
 */
export function InlocuiesteFisierul(props: {
  piesa: { id: string; title: string };
  laInlocuit: () => void;
  laInchide: () => void;
}) {
  const sesiune = useSesiune();
  const peTelefon = window.matchMedia(
    "(pointer: coarse) and (hover: none)",
  ).matches;
  const [mp3, setMp3] = createSignal<File | null>(null);
  const [durata, setDurata] = createSignal(0);
  const [eroare, setEroare] = createSignal("");
  const [trimite, setTrimite] = createSignal(false);

  async function inlocuieste() {
    const f = mp3();
    if (!f || trimite()) return;
    setTrimite(true);
    setEroare("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      if (durata()) fd.append("duration", String(Math.round(durata())));
      await cerereCont(
        sesiune(),
        `/api/public/songs/${props.piesa.id}/fisier`,
        {
          method: "POST",
          body: fd,
        },
      );
      props.laInlocuit();
    } catch (err) {
      // Serverul trimite motivul în română în `error` (ex. „Tabăra s-a terminat…”); restul e rețeaua.
      setEroare(
        err instanceof Error &&
          err.message &&
          err.message !== "Cererea n-a mers." &&
          err.name !== "TypeError"
          ? err.message
          : "Fișierul n-a urcat. Încearcă din nou.",
      );
    } finally {
      setTrimite(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "14px",
        "margin-top": "6px",
        "padding-top": "16px",
        "border-top": `1px solid ${C.linie}`,
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
        <p
          style={{
            margin: 0,
            color: C.text,
            "font-size": "20px",
            "font-weight": 700,
          }}
        >
          Înlocuiește fișierul
        </p>
        {/* Titlul piesei ca text, nu pastilă: lângă „Schimbă” ar fi arătat ca încă un buton (regula pastilelor, ca pe site). */}
        <span style={{ color: C.stins, "font-size": "14px" }}>
          {props.piesa.title}
        </span>
      </div>
      <p style={{ margin: 0, color: C.text, "font-size": "16px" }}>
        Ai urcat altă variantă? Pune aici MP3-ul bun. Titlul, artwork-ul,
        autorii și voturile rămân.
      </p>

      <ZonaMp3
        mp3={mp3()}
        laAlege={setMp3}
        laDurata={setDurata}
        laEroare={setEroare}
        peTelefon={peTelefon}
        opreste={trimite()}
      />

      <Show when={eroare()}>
        <p style={{ margin: 0, color: C.rosu, "font-size": "14px" }}>
          {eroare()}
        </p>
      </Show>

      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <Buton
          piele="roz"
          onClick={inlocuieste}
          dezactivat={!mp3() || trimite()}
        >
          {trimite() ? "Se încarcă…" : "Înlocuiește piesa"}
        </Buton>
        <Buton piele="alb" onClick={() => props.laInchide()}>
          Anulează
        </Buton>
      </div>
    </div>
  );
}
