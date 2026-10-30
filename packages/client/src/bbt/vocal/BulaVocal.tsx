import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js";

import { File } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { formateazaDurata } from "./nume";
import { BETE, undaVocal } from "./unda";

/**
 * Bula unui vocal (`vocal-<durata_ms>.m4a`), ca la WhatsApp: Play/Pauză rotund roz, unda cu 40 de bețe,
 * durata din nume și viteza 1× / 1,5× / 2×. Înainte, vocalele din aplicația mobilă ieșeau ca un fișier
 * audio oarecare: nume, mărime și playerul nativ al browserului, o casetă cât jumătate de ecran.
 *
 * ⚠️ `<audio>`-ul se face abia la primul Play, cu `preload="none"`: un canal cu 30 de vocale nu descarcă
 * 30 de fișiere doar ca să fie afișat. Unda îl descarcă oricum (`unda.ts`), dar doar când bula ajunge pe
 * ecran, și o singură dată.
 */

const VITEZE = [1, 1.5, 2] as const;

// Viteza aleasă rămâne pentru toate vocalele, ca la WhatsApp: cine ascultă pe 2× nu vrea s-o aleagă la fiecare.
const [viteza, setViteza] = createSignal<number>(1);

// Un singur vocal cântă odată. Cel care pornește îl oprește pe cel de dinainte.
let opresteCelCareCanta: (() => void) | undefined;

export function BulaVocal(props: { file: File; durataMs: number }) {
  const [canta, setCanta] = createSignal(false);
  const [pozitie, setPozitie] = createSignal(0); // secunde
  const [unda, setUnda] = createSignal<number[] | null>(null);

  let audio: HTMLAudioElement | undefined;
  let bula: HTMLDivElement | undefined;

  const durata = () => props.durataMs / 1000;
  const progres = () => (durata() > 0 ? Math.min(1, pozitie() / durata()) : 0);
  const bete = createMemo(() => unda() ?? new Array<number>(BETE).fill(0.4));

  function opreste() {
    audio?.pause();
  }

  function audioul() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "none";
    audio.src = props.file.originalUrl;
    audio.addEventListener("play", () => {
      if (opresteCelCareCanta && opresteCelCareCanta !== opreste) {
        opresteCelCareCanta();
      }
      opresteCelCareCanta = opreste;
      setCanta(true);
    });
    audio.addEventListener("pause", () => setCanta(false));
    audio.addEventListener("timeupdate", () => setPozitie(audio!.currentTime));
    audio.addEventListener("ended", () => {
      setCanta(false);
      setPozitie(0);
    });
    return audio;
  }

  function apasaPlay() {
    const a = audioul();
    if (!a.paused) return a.pause();
    a.playbackRate = viteza();
    // Un salt cerut înainte de prima redare (tap pe undă) se aplică acum.
    if (Math.abs(a.currentTime - pozitie()) > 0.25) a.currentTime = pozitie();
    void a.play().catch(() => setCanta(false));
  }

  function schimbaViteza() {
    const urmatoarea =
      VITEZE[(VITEZE.indexOf(viteza() as never) + 1) % VITEZE.length];
    setViteza(urmatoarea);
    if (audio) audio.playbackRate = urmatoarea;
  }

  /** Tap sau tragere pe undă = salt acolo. */
  function sari(ev: PointerEvent) {
    const zona = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const raport = Math.min(
      1,
      Math.max(0, (ev.clientX - zona.left) / zona.width),
    );
    const tinta = raport * durata();
    setPozitie(tinta);
    if (audio) audio.currentTime = tinta;
  }

  onMount(() => {
    // Unda doar când bula se vede (canalele lungi au multe vocale mai sus, nederulate).
    const observator = new IntersectionObserver((intrari) => {
      if (!intrari.some((i) => i.isIntersecting)) return;
      observator.disconnect();
      void undaVocal(props.file.id, props.file.originalUrl).then(setUnda);
    });
    observator.observe(bula!);
    onCleanup(() => observator.disconnect());
  });

  onCleanup(() => {
    if (opresteCelCareCanta === opreste) opresteCelCareCanta = undefined;
    audio?.pause();
    audio?.removeAttribute("src");
  });

  return (
    <Bula ref={bula} class="bbt-vocal">
      <ButonPlay
        type="button"
        aria-label={canta() ? "Pauză" : "Ascultă vocalul"}
        onClick={apasaPlay}
      >
        <Symbol size={18}>{canta() ? "pause" : "play_arrow"}</Symbol>
      </ButonPlay>
      <Dreapta>
        <Unda
          role="slider"
          aria-label="Poziția în vocal"
          aria-valuemin={0}
          aria-valuemax={Math.round(durata())}
          aria-valuenow={Math.round(pozitie())}
          onPointerDown={(ev) => {
            (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
            sari(ev);
          }}
          onPointerMove={(ev) => {
            if (ev.buttons & 1) sari(ev);
          }}
        >
          <For each={bete()}>
            {(inaltime, i) => (
              <Bat
                style={{
                  height: `${Math.round(4 + inaltime * 24)}px`,
                  background:
                    (i() + 0.5) / BETE <= progres() ? "#FFB3D9" : "#C9C9CE",
                }}
              />
            )}
          </For>
        </Unda>
        <Jos>
          <span>
            {formateazaDurata(
              canta() || pozitie() > 0 ? pozitie() * 1000 : props.durataMs,
            )}
          </span>
          <ButonViteza
            type="button"
            aria-label="Viteza de redare"
            onClick={schimbaViteza}
          >
            {String(viteza()).replace(".", ",")}×
          </ButonViteza>
        </Jos>
      </Dreapta>
    </Bula>
  );
}

const Bula = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "fit-content",
    maxWidth: "100%",
    padding: "8px 12px 6px 8px",
    borderRadius: "18px",
    background: "#F2F2F3",
    border: "1px solid #E5E5E5",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
});

/** Roz = acțiune (`--color-bbt-pink`), ca butonul de trimis din bara de scris. */
const ButonPlay = styled("button", {
  base: {
    flexShrink: 0,
    width: "36px",
    height: "36px",
    border: 0,
    borderRadius: "50%",
    background: "#FFB3D9",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    // Lucide desenează din contur; triunghiul și barele pline se citesc mai bine pe un cerc mic.
    "& svg": { fill: "currentColor" },
  },
});

const Dreapta = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
});

const Unda = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    height: "28px",
    cursor: "pointer",
    touchAction: "none",
  },
});

const Bat = styled("div", {
  base: {
    width: "3px",
    flexShrink: 0,
    borderRadius: "2px",
    transition: "background .1s",
  },
});

const Jos = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "18px",
    fontSize: "11px",
    lineHeight: "1",
    color: "#6C6C6D",
    fontVariantNumeric: "tabular-nums",
  },
});

const ButonViteza = styled("button", {
  base: {
    border: 0,
    borderRadius: "9px",
    padding: "3px 7px",
    background: "#F2F2F3",
    color: "#0A0A0B",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
});
