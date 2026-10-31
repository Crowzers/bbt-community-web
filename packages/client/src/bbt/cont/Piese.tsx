import { For, JSX, Show, createMemo, createSignal, onCleanup } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { useDevice } from "@revolt/common";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { PlicVinyl } from "../PlicVinyl";
import { UN_RAND } from "../telefon";
import { cerereCont } from "../tokenBbt";

import { useSesiune } from "./date";
import { Buton, C, Incarcare, Mesaj, StareGoala, TitluPagina } from "./ui";

type PiesaMea = {
  id: string;
  title: string;
  url: string;
  coverUrl?: string | null;
  /** Secunde, când se știe. */
  duration?: number | null;
  ascunsa?: boolean;
  camp?: { nume: string; imgUrl?: string | null } | null;
  challenge?: { titlu: string } | null;
};

/** Volumul rămâne de la o deschidere la alta. ⚠️ `localStorage` poate lipsi sau arunca: e doar o comoditate. */
const CHEIE_VOLUM = "bbt-volum-piese";
function volumSalvat() {
  try {
    const v = Number(localStorage.getItem(CHEIE_VOLUM));
    return localStorage.getItem(CHEIE_VOLUM) !== null && v >= 0 && v <= 1 ? v : 1;
  } catch {
    return 1;
  }
}

/** Sub atâtea secunde, „înapoi" duce la piesa de dinainte; peste, la începutul piesei. Ca la Spotify. */
const PRAG_INAPOI = 3;

/** Ordine nouă, cu piesa curentă prima: amestecarea nu întrerupe ce asculți. */
function amesteca(piese: PiesaMea[], prima?: PiesaMea) {
  const rest = piese.filter((p) => p.id !== prima?.id);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return prima ? [prima, ...rest] : rest;
}

/** „3:07". */
function durata(secunde: number) {
  const s = Math.max(0, Math.round(secunde));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Toate piesele omului: urcate de el sau cu el creditat, inclusiv cele ascunse de pe profilul public. Aceeași rută ca selectorul
 * de piese de pe site.
 */
export function usePiese() {
  const sesiune = useSesiune();
  return useQuery(() => ({
    queryKey: ["bbt-piesele-mele"],
    enabled: Boolean(sesiune()),
    retry: 1,
    queryFn: async () => {
      const r = await cerereCont<{ piese?: PiesaMea[] }>(
        sesiune(),
        "/api/public/participant/piesele-mele",
      );
      return (r.piese ?? []).filter((p) => p.url);
    },
  }));
}

/**
 * BBT: „Piesele mele", ca în aplicație (`mobil/src/app/piese.tsx`, cererea userului, 1 nov 2026): rânduri cu plic de vinyl, un apăsat =
 * cântă, „Ascultă tot" și playerul de jos, cu bara de progres. Trece singur la piesa următoare. Până atunci, câte un `<audio>`
 * al browserului pe fiecare card, care puteau cânta toate odată.
 *
 * Playerul are comenzile de la Spotify (cererea userului, 1 nov 2026): amestecare, înapoi, înainte, repetare și volum. Volumul e
 * doar pe desktop și tabletă: pe telefon îl dau butoanele aparatului, iar iOS ignoră oricum `volume`.
 *
 * ⚠️ Un singur `Audio`, al paginii: la ieșirea din pagină muzica se oprește, altfel ar cânta fără niciun buton de oprit. În
 * aplicație continuă, fiindcă acolo o oprești de pe ecranul blocat.
 */
export function Piese() {
  const piese = usePiese();
  const { layout } = useDevice();

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = volumSalvat();
  const [curenta, setCurenta] = createSignal<PiesaMea>();
  const [canta, setCanta] = createSignal(false);
  const [seIncarca, setSeIncarca] = createSignal(false);
  const [pozitie, setPozitie] = createSignal(0);
  const [lungime, setLungime] = createSignal(0);
  const [aPicat, setAPicat] = createSignal(false);
  const [volum, setVolum] = createSignal(audio.volume);
  const [mut, setMut] = createSignal(false);
  const [amestecate, setAmestecate] = createSignal<PiesaMea[]>();
  const [repeta, setRepeta] = createSignal<"nu" | "tot" | "una">("nu");

  // Cu amestecarea pornită, doar ordinea de ascultare se schimbă; lista de pe ecran rămâne așa cum e.
  const ordine = createMemo(() => amestecate() ?? piese.data ?? []);
  const loc = () => ordine().findIndex((p) => p.id === curenta()?.id);

  const porneste = (p: PiesaMea) => {
    setAPicat(false);
    if (curenta()?.id !== p.id) {
      audio.src = p.url;
      setCurenta(p);
      setPozitie(0);
      setLungime(p.duration ?? 0);
    }
    setSeIncarca(true);
    audio.play().catch(() => setSeIncarca(false));
  };
  const apasa = (p: PiesaMea) =>
    curenta()?.id === p.id && canta() ? audio.pause() : porneste(p);

  audio.onplay = () => setCanta(true);
  audio.onpause = () => setCanta(false);
  audio.onplaying = () => setSeIncarca(false);
  audio.onwaiting = () => setSeIncarca(true);
  audio.ontimeupdate = () => setPozitie(audio.currentTime);
  audio.onloadedmetadata = () => {
    if (Number.isFinite(audio.duration)) setLungime(audio.duration);
  };
  audio.onerror = () => {
    if (!curenta()) return;
    setSeIncarca(false);
    setAPicat(true);
  };
  audio.onended = () => {
    if (repeta() === "una") {
      audio.currentTime = 0;
      void audio.play();
      return;
    }
    const urmatoarea = ordine()[loc() + 1];
    if (urmatoarea) return porneste(urmatoarea);
    if (repeta() === "tot" && ordine()[0]) return porneste(ordine()[0]);
    audio.currentTime = 0;
    setPozitie(0);
  };

  const inainte = () => {
    const urmatoarea = ordine()[loc() + 1] ?? ordine()[0];
    if (urmatoarea) porneste(urmatoarea);
  };
  const inapoi = () => {
    const precedenta = ordine()[loc() - 1];
    if (audio.currentTime > PRAG_INAPOI || !precedenta) {
      audio.currentTime = 0;
      setPozitie(0);
    } else porneste(precedenta);
  };
  const comutaAmestecarea = () =>
    setAmestecate(amestecate() ? undefined : amesteca(piese.data ?? [], curenta()));
  const comutaRepetarea = () =>
    setRepeta((r) => ({ nu: "tot", tot: "una", una: "nu" } as const)[r]);
  const schimbaVolumul = (v: number) => {
    audio.volume = v;
    audio.muted = false;
    setVolum(v);
    setMut(false);
    try {
      localStorage.setItem(CHEIE_VOLUM, String(v));
    } catch {
      // Doar o comoditate: volumul merge și fără să fie ținut minte.
    }
  };
  const comutaSunetul = () => {
    audio.muted = !mut();
    setMut(!mut());
  };
  const reincepe = () => {
    if (amestecate()) setAmestecate(amesteca(piese.data ?? []));
    if (ordine()[0]) porneste(ordine()[0]);
  };

  onCleanup(() => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  });

  return (
    <>
      <TitluPagina
        dreapta={
          <Show when={piese.data?.length}>
            <Buton mic onClick={reincepe}>
              <Symbol size={16}>play_arrow</Symbol> Ascultă tot
            </Buton>
          </Show>
        }
      >
        Piesele mele
      </TitluPagina>
      <Show when={piese.isError}>
        <Mesaj fel="eroare">Piesele nu se încarcă acum.</Mesaj>
      </Show>
      <Show when={aPicat()}>
        <Mesaj fel="eroare">Piesa nu pornește acum. Încearcă alta.</Mesaj>
      </Show>
      <Show when={!piese.isLoading} fallback={<Incarcare />}>
        <Show
          when={piese.data?.length || piese.isError}
          fallback={
            <StareGoala
              titlu="Încă nicio piesă"
              text="Piesele urcate la tabere sau în challenge-uri, de tine sau cu tine creditat, apar aici."
            />
          }
        >
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "4px",
              "margin-bottom": "12px",
            }}
          >
            <For each={piese.data}>
              {(p) => (
                <RandPiesa
                  piesa={p}
                  activa={curenta()?.id === p.id}
                  canta={curenta()?.id === p.id && canta()}
                  laApasare={() => apasa(p)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      <Show when={curenta()}>
        {(p) => (
          <div
            style={{
              // Jos de tot, oricât de scurtă e lista (`.bbt-pagina-piese` din `raspuns.css`), cererea userului, 1 nov 2026.
              position: "sticky",
              bottom: 0,
              display: "grid",
              "grid-template-columns":
                layout() === "phone"
                  ? "minmax(0, 1fr)"
                  : "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)",
              "flex-shrink": 0,
              "align-items": "center",
              gap: "8px 16px",
              "margin-top": "auto",
              padding: "10px 14px",
              "border-radius": "20px",
              background: C.foaie,
            }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "12px",
                "min-width": 0,
              }}
            >
              <PlicVinyl id={p().id} coperta={p().coverUrl} marime={56} />
              <div style={{ "min-width": 0 }}>
                <div style={{ ...UN_RAND, "font-size": "15px", "font-weight": 700 }}>
                  {p().title}
                </div>
                <div style={{ ...UN_RAND, color: C.stins, "font-size": "13px" }}>
                  {p().camp?.nume ?? p().challenge?.titlu ?? "BBT"}
                </div>
              </div>
            </div>

            <div style={{ "min-width": 0 }}>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  gap: "6px",
                }}
              >
                <Comanda
                  eticheta="Amestecă"
                  activa={!!amestecate()}
                  laApasare={comutaAmestecarea}
                >
                  shuffle
                </Comanda>
                <Comanda eticheta="Piesa de dinainte" laApasare={inapoi}>
                  skip_previous
                </Comanda>
                <button
                  type="button"
                  class="bbt-moale"
                  aria-label={canta() ? "Pauză" : "Ascultă"}
                  onClick={() => apasa(p())}
                  style={{
                    width: "44px",
                    height: "44px",
                    "flex-shrink": 0,
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    border: 0,
                    "border-radius": "50%",
                    background: C.negru,
                    color: C.peNegru,
                    cursor: "pointer",
                    opacity: seIncarca() ? 0.6 : 1,
                  }}
                >
                  <Symbol size={18}>{canta() ? "pause" : "play_arrow"}</Symbol>
                </button>
                <Comanda eticheta="Piesa următoare" laApasare={inainte}>
                  skip_next
                </Comanda>
                <Comanda
                  eticheta={
                    repeta() === "una"
                      ? "Repetă piesa"
                      : repeta() === "tot"
                        ? "Repetă lista"
                        : "Repetă"
                  }
                  activa={repeta() !== "nu"}
                  laApasare={comutaRepetarea}
                >
                  {repeta() === "una" ? "repeat_one" : "repeat"}
                </Comanda>
              </div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "margin-top": "2px",
                }}
              >
                <Timp>{durata(pozitie())}</Timp>
                <input
                  type="range"
                  aria-label="Sari în piesă"
                  min="0"
                  max={lungime() || 1}
                  step="1"
                  value={pozitie()}
                  onInput={(e) => {
                    audio.currentTime = Number(e.currentTarget.value);
                    setPozitie(audio.currentTime);
                  }}
                  style={GLISOR}
                />
                <Timp>{lungime() > 0 ? durata(lungime()) : "-:--"}</Timp>
              </div>
            </div>

            <Show when={layout() !== "phone"}>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "flex-end",
                  gap: "4px",
                  "min-width": 0,
                }}
              >
                <Comanda
                  eticheta={mut() ? "Pornește sunetul" : "Oprește sunetul"}
                  laApasare={comutaSunetul}
                >
                  {mut() || volum() === 0 ? "volume_off" : "volume_up"}
                </Comanda>
                <input
                  type="range"
                  aria-label="Volum"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mut() ? 0 : volum()}
                  onInput={(e) => schimbaVolumul(Number(e.currentTarget.value))}
                  style={{ ...GLISOR, flex: "0 1 120px" }}
                />
              </div>
            </Show>
          </div>
        )}
      </Show>
    </>
  );
}

const GLISOR: JSX.CSSProperties = {
  flex: 1,
  "min-width": 0,
  margin: 0,
  "accent-color": C.negru,
  cursor: "pointer",
};

function Timp(props: { children: string }) {
  return (
    <span
      style={{
        "flex-shrink": 0,
        "min-width": "36px",
        color: C.stins,
        "font-size": "14px",
        "font-variant-numeric": "tabular-nums",
        "text-align": "center",
      }}
    >
      {props.children}
    </span>
  );
}

/** O comandă din player. Pornită, e neagră cu un punct dedesubt, ca la Spotify. */
function Comanda(props: {
  eticheta: string;
  activa?: boolean;
  laApasare: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      class="bbt-moale"
      title={props.eticheta}
      aria-label={props.eticheta}
      aria-pressed={props.activa === undefined ? undefined : props.activa}
      onClick={() => props.laApasare()}
      style={{
        position: "relative",
        width: "40px",
        height: "40px",
        "flex-shrink": 0,
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        padding: 0,
        border: 0,
        background: "transparent",
        color: props.activa === false ? C.stins : C.text,
        cursor: "pointer",
      }}
    >
      <Symbol size={20}>{props.children}</Symbol>
      <Show when={props.activa}>
        <span
          style={{
            position: "absolute",
            bottom: "4px",
            width: "4px",
            height: "4px",
            "border-radius": "2px",
            background: C.negru,
          }}
        />
      </Show>
    </button>
  );
}

function RandPiesa(props: {
  piesa: PiesaMea;
  activa: boolean;
  canta: boolean;
  laApasare: () => void;
}) {
  const detalii = () =>
    [
      props.piesa.camp?.nume ?? props.piesa.challenge?.titlu,
      props.piesa.duration ? durata(props.piesa.duration) : null,
      props.piesa.ascunsa ? "doar la tine" : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <button
      type="button"
      aria-label={`${props.canta ? "Pauză" : "Ascultă"}: ${props.piesa.title}`}
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        width: "100%",
        padding: "8px 12px",
        "box-sizing": "border-box",
        border: 0,
        "border-radius": "20px",
        background: props.activa ? C.rozDeschis : "transparent",
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <PlicVinyl
        id={props.piesa.id}
        coperta={props.piesa.coverUrl}
        marime={52}
      />
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{
            ...UN_RAND,
            display: "block",
            "font-size": "16px",
            "font-weight": 700,
          }}
        >
          {props.piesa.title}
        </span>
        <Show when={detalii()}>
          <span
            style={{
              ...UN_RAND,
              display: "block",
              "margin-top": "2px",
              color: C.stins,
              "font-size": "14px",
            }}
          >
            {detalii()}
          </span>
        </Show>
      </span>
      <span
        style={{
          width: "38px",
          height: "38px",
          "flex-shrink": 0,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "50%",
          background: props.activa ? C.negru : C.foaie,
          color: props.activa ? C.peNegru : C.text,
        }}
      >
        <Symbol size={18}>{props.canta ? "pause" : "play_arrow"}</Symbol>
      </span>
    </button>
  );
}
