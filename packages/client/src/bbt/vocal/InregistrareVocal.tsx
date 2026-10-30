import { createSignal, For, onCleanup, onMount } from "solid-js";

import { styled } from "styled-system/jsx";

import { IconButton, MessageBox } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { codecM4a, refaM4a, VocalM4a } from "./m4a";
import { formateazaDurata, numeVocal } from "./nume";

/**
 * Vocal înregistrat pe hub, în același format ca în aplicația mobilă: AAC mono 64 kb/s în `.m4a`, numit
 * `vocal-<durata_ms>.m4a` (decizia #6 din designul aplicației). Telefoanele redau nativ doar AAC; un vocal
 * Opus/WebM pornit de aici ar ajunge pe iPhone un fișier mut.
 *
 * ⚠️ De aceea butonul apare DOAR unde `MediaRecorder` scrie AAC în MP4 (Safari, Chrome nou). Firefox și
 * Chrome-urile vechi nu-l văd deloc. Iar dacă un browser spune că poate și scrie altceva (verificăm codecul din
 * fișier, `codecM4a`), vocalul nu pleacă și butonul dispare până la reîncărcare.
 *
 * Ce scrie `MediaRecorder` e un MP4 fragmentat; `refaM4a` îl rescrie ca un `.m4a` obișnuit (vezi `m4a.ts`).
 */

const TIPURI = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4"];

/** 15 minute ≈ 7 MB la 64 kb/s. La limită vocalul pleacă singur. */
const DURATA_MAXIMA_MS = 15 * 60 * 1000;

/**
 * ⚠️ Cei 64 kb/s ceruți nu sunt o garanție: encoderul AAC din Windows (pe care îl folosește Chrome) știe doar
 * 96–192 kb/s, iar la 192 kb/s 15 minute ar trece de limita de 20 MB a atașamentelor de pe hub. Așa că oprim
 * și după mărime, cu loc de rezervă pentru antetul rescris de `refaM4a`.
 */
const MARIME_MAXIMA = 18 * 1024 * 1024;

/** Sub atât e un clic scăpat, nu un vocal. */
const DURATA_MINIMA_MS = 700;

const [codecGresit, setCodecGresit] = createSignal(false);

function tipInregistrare(): string | null {
  if (
    typeof MediaRecorder === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return null;
  }
  return TIPURI.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

export function poateInregistraVocal() {
  return !codecGresit() && tipInregistrare() !== null;
}

export interface SesiuneVocal {
  stream: MediaStream;
  /** Pentru nivelul microfonului din bară; poate lipsi, înregistrarea merge și fără. */
  context: AudioContext | null;
  tip: string;
}

/**
 * Cere microfonul. Se cheamă DIRECT din clicul pe buton: Safari dă `AudioContext` pornit doar dintr-un gest,
 * de aceea contextul se face înainte de primul `await`.
 */
export async function pornesteVocal(): Promise<SesiuneVocal> {
  const tip = tipInregistrare();
  if (!tip) throw new Error("fără MediaRecorder AAC");
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
  } catch {
    context = null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return { stream, context, tip };
  } catch (e) {
    void context?.close();
    throw e;
  }
}

const NIVELE = 48;

/**
 * Bara care ia locul câmpului de scris cât se înregistrează: coș (anulează), punct roșu + timp, nivelul
 * microfonului și butonul roz de trimis. Escape = anulează.
 */
export function BaraVocal(props: {
  sesiune: SesiuneVocal;
  onTrimite: (fisier: globalThis.File) => void;
  onEroare: (mesaj: string) => void;
  onInchide: () => void;
}) {
  const [scurs, setScurs] = createSignal(0);
  const [nivele, setNivele] = createSignal<number[]>(
    new Array<number>(NIVELE).fill(0),
  );

  let recorder: MediaRecorder | undefined;
  let anulat = false;
  let inchis = false;
  const bucati: Blob[] = [];
  const start = performance.now();

  function inchide() {
    if (inchis) return;
    inchis = true;
    props.sesiune.stream.getTracks().forEach((t) => t.stop());
    void props.sesiune.context?.close().catch(() => {});
    props.onInchide();
  }

  async function laOprire() {
    if (anulat) return inchide();
    const durataCronometru = performance.now() - start;
    try {
      const octeti = new Uint8Array(
        await new Blob(bucati, { type: recorder?.mimeType }).arrayBuffer(),
      );
      if (codecM4a(octeti) !== "mp4a") {
        setCodecGresit(true);
        props.onEroare(
          "Browserul ăsta nu înregistrează vocale pe care să le poată asculta telefoanele. Încearcă din Chrome sau Safari, la zi.",
        );
        return inchide();
      }
      let vocal: VocalM4a = { octeti, durataMs: durataCronometru };
      try {
        vocal = refaM4a(octeti);
      } catch {
        // Un fișier pe care nu-l putem rescrie pleacă așa cum l-a scris browserul: se aude oricum.
      }
      if (vocal.durataMs >= DURATA_MINIMA_MS) {
        props.onTrimite(
          new File(
            [vocal.octeti as Uint8Array<ArrayBuffer>],
            numeVocal(vocal.durataMs),
            {
              type: "audio/mp4",
            },
          ),
        );
      }
    } catch {
      props.onEroare("Vocalul nu s-a putut salva. Mai încearcă o dată.");
    }
    inchide();
  }

  function opreste(anuleaza: boolean) {
    anulat = anuleaza;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else if (anuleaza) inchide();
  }

  onMount(() => {
    try {
      recorder = new MediaRecorder(props.sesiune.stream, {
        mimeType: props.sesiune.tip,
        audioBitsPerSecond: 64000,
      });
    } catch {
      props.onEroare("Microfonul nu a pornit. Mai încearcă o dată.");
      return inchide();
    }
    let marime = 0;
    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      bucati.push(e.data);
      marime += e.data.size;
      if (marime >= MARIME_MAXIMA) opreste(false);
    };
    recorder.onstop = () => void laOprire();
    recorder.start(1000);

    // Nivelul microfonului: bețe care curg spre stânga, ca omul să vadă că-l aude.
    let analizor: AnalyserNode | undefined;
    const ctx = props.sesiune.context;
    if (ctx) {
      void ctx.resume().catch(() => {});
      analizor = ctx.createAnalyser();
      analizor.fftSize = 1024;
      ctx.createMediaStreamSource(props.sesiune.stream).connect(analizor);
    }
    const esantioane = new Float32Array(1024);

    const ceas = setInterval(() => {
      const acum = performance.now() - start;
      setScurs(acum);
      if (analizor) {
        analizor.getFloatTimeDomainData(esantioane);
        let s = 0;
        for (const x of esantioane) s += x * x;
        const nivel = Math.min(1, Math.sqrt(s / esantioane.length) * 4);
        setNivele((n) => [...n.slice(1), nivel]);
      }
      if (acum >= DURATA_MAXIMA_MS) opreste(false);
    }, 100);

    const laTasta = (e: KeyboardEvent) => {
      if (e.key === "Escape") opreste(true);
    };
    document.addEventListener("keydown", laTasta);

    onCleanup(() => {
      clearInterval(ceas);
      document.removeEventListener("keydown", laTasta);
      if (recorder && recorder.state !== "inactive") {
        anulat = true;
        recorder.stop();
      }
      inchide();
    });
  });

  return (
    <Parinte>
      <Caseta>
        <MessageBox.InlineIcon>
          <IconButton
            onPress={() => opreste(true)}
            aria-label="Anulează vocalul"
          >
            <Symbol>delete</Symbol>
          </IconButton>
        </MessageBox.InlineIcon>
        <Timp>
          <PunctRosu />
          {formateazaDurata(scurs())}
        </Timp>
        <Nivele>
          <For each={nivele()}>
            {(n) => (
              <div
                style={{
                  width: "3px",
                  "flex-shrink": 0,
                  "border-radius": "2px",
                  height: `${Math.round(3 + n * 21)}px`,
                  background: "rgba(255,255,255,0.45)",
                }}
              />
            )}
          </For>
        </Nivele>
        <ButonRoz
          type="button"
          aria-label="Trimite vocalul"
          onClick={() => opreste(false)}
        >
          <Symbol size={16}>send</Symbol>
        </ButonRoz>
      </Caseta>
    </Parinte>
  );
}

/** Butonul de microfon, în locul celui de trimis când n-ai scris nimic (ca la WhatsApp). */
export function ButonMicrofon(props: { onClick: () => void }) {
  return (
    <ButonRoz
      type="button"
      aria-label="Înregistrează un vocal"
      onClick={() => props.onClick()}
    >
      <Symbol size={20}>mic</Symbol>
    </ButonRoz>
  );
}

// Aceleași măsuri ca bara de scris (`MessageBox.tsx`): pastila neagră de 56, cu cercul roz de 44 (21a, 30 oct 2026).
const Parinte = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    margin: "12px 24px 20px",
    _phone: {
      margin: "0 12px 12px",
    },
  },
});

const Caseta = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: "56px",
    boxSizing: "border-box",
    padding: "6px 6px 6px 16px",
    gap: "10px",
    borderRadius: "28px",
    border: "0",
    display: "flex",
    alignItems: "center",
    background: "#0A0A0B",
    color: "#FFFFFF",
  },
});

const Timp = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  },
});

const PunctRosu = styled("span", {
  base: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ff4d4f",
    animation: "bbtVocalPuls 1.2s ease-in-out infinite",
  },
});

const Nivele = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2px",
    overflow: "hidden",
  },
});

/**
 * Cercul roz de 44 al barei de scris, același ca butonul de trimis. ROTUND, ca în aplicația de telefon și în 21a
 * (cererea userului, 30 oct 2026); până atunci pătrat de 32 cu colțuri de 8.
 */
const ButonRoz = styled("button", {
  base: {
    flexShrink: 0,
    width: "44px",
    height: "44px",
    border: 0,
    borderRadius: "50%",
    background: "#FFB3D9",
    color: "#0A0A0B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
});
