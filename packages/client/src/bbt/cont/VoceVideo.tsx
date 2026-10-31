import {
  JSX,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { useMediaDeviceSelect } from "solid-livekit-components";

import { useInstance } from "@revolt/instance";
import { stoatSinkName } from "@revolt/rtc";
import { useState } from "@revolt/state";

import notaProba from "../sunete/marimba-3-0.wav?url";

import { Buton, C, CampAlege, Mesaj, Sectiune, TitluPagina } from "./ui";

/**
 * BBT: „Voce și video", `/cont/voce` (cererea userului, 31 oct 2026): ce era esențial din setările clientului, fără panoul lor.
 * Doar pe hub: în aplicație microfonul și camera le alege telefonul. Aceleași valori (`state.voice`), deci apelurile le
 * citesc la fel ca până acum.
 *
 * Fără permisiune, browserul nu dă numele dispozitivelor, deci lista ar rămâne doar cu „Implicit": pagina cere accesul pe față.
 * Probele (1 nov 2026) folosesc dispozitivul ales, ca omul să nu afle abia la apel că e pe microfonul greșit.
 */
export function VoceVideo() {
  const { limits } = useInstance();
  const { voice } = useState();
  const [areNume, setAreNume] = createSignal(true);
  const [refuzat, setRefuzat] = createSignal(false);
  // Crește după acordul omului: listele se refac, de data asta cu numele dispozitivelor.
  const [revizie, setRevizie] = createSignal(0);
  const lipsesteAccesul = () => !areNume();

  async function cereAcces() {
    setRefuzat(false);
    try {
      opreste(await navigator.mediaDevices.getUserMedia({ audio: true }));
      setRevizie((r) => r + 1);
    } catch {
      setRefuzat(true);
    }
  }

  return (
    <>
      <TitluPagina>Voce și video</TitluPagina>
      <div style={DOUA_COLOANE}>
        <div style={COLOANA}>
          <Sectiune titlu="Dispozitive">
            <div style={{ display: "grid", gap: "14px" }}>
              <Show when={lipsesteAccesul()}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <p style={NOTA}>
                    Permite accesul ca să vezi numele dispozitivelor tale.
                  </p>
                  <div>
                    <Buton mic onClick={() => void cereAcces()}>
                      Permite accesul
                    </Buton>
                  </div>
                  <Show when={refuzat()}>
                    <Mesaj fel="eroare">
                      Browserul a blocat accesul. Îl pornești din iconița de lângă
                      adresă.
                    </Mesaj>
                  </Show>
                </div>
              </Show>
              <Show keyed when={revizie() + 1}>
                <AlegeDispozitiv
                  kind="audioinput"
                  eticheta="Microfon"
                  laNume={setAreNume}
                />
                <AlegeDispozitiv kind="audiooutput" eticheta="Difuzoare" />
                <Show when={limits().video}>
                  <AlegeDispozitiv kind="videoinput" eticheta="Cameră" />
                </Show>
              </Show>
            </div>
          </Sectiune>

          <Sectiune titlu="Volum">
            <div style={{ display: "grid", gap: "14px" }}>
              <Volum
                eticheta="Microfon"
                valoare={voice.inputVolume}
                laSchimbare={(v) => (voice.inputVolume = v)}
              />
              <Volum
                eticheta="Difuzoare"
                valoare={voice.outputVolume}
                laSchimbare={(v) => (voice.outputVolume = v)}
              />
            </div>
          </Sectiune>
        </div>

        <div style={COLOANA}>
          <Sectiune titlu="Probă">
            <div style={{ display: "grid", gap: "14px" }}>
              <ProbaMicrofon />
              <ProbaDifuzoare />
              <Show when={limits().video}>
                <ProbaCamera />
              </Show>
            </div>
          </Sectiune>

          <Sectiune titlu="Sunetul tău">
            <div style={{ display: "grid", gap: "14px" }}>
              <CampAlege
                eticheta="Reducerea zgomotului"
                valoare={voice.noiseSupression ?? "enhanced"}
                laSchimbare={(v) =>
                  (voice.noiseSupression = v as
                    | "disabled"
                    | "browser"
                    | "enhanced")
                }
                optiuni={[
                  { valoare: "disabled", text: "Oprită" },
                  { valoare: "browser", text: "Din browser" },
                  { valoare: "enhanced", text: "Îmbunătățită" },
                ]}
              />
              <RandComutator
                text="Anularea ecoului"
                pornit={!!voice.echoCancellation}
                laApasare={() =>
                  (voice.echoCancellation = !voice.echoCancellation)
                }
              />
              <RandComutator
                text="Volum automat la microfon"
                pornit={!!voice.autoGainControl}
                laApasare={() =>
                  (voice.autoGainControl = !voice.autoGainControl)
                }
              />
            </div>
          </Sectiune>
        </div>
      </div>
    </>
  );
}

const COLOANA: JSX.CSSProperties = {
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
};

const DOUA_COLOANE: JSX.CSSProperties = {
  display: "grid",
  "grid-template-columns": "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
  gap: "16px",
  "align-items": "start",
};

const NOTA: JSX.CSSProperties = {
  margin: 0,
  color: C.stins,
  "font-size": "14px",
  "line-height": "1.4",
};

const opreste = (s?: MediaStream) => s?.getTracks().forEach((p) => p.stop());

/** Un rând de probă: textul, butonul și, dedesubt, ce arată proba. */
function RandProba(props: {
  text: string;
  detaliu: string;
  buton: string;
  laApasare: () => void;
  eroare?: string;
  children?: JSX.Element;
}) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
          "flex-wrap": "wrap",
        }}
      >
        <span style={{ flex: "1 1 200px", "min-width": 0 }}>
          <span
            style={{ display: "block", "font-size": "15px", "font-weight": 600 }}
          >
            {props.text}
          </span>
          <span style={{ ...NOTA, display: "block", "margin-top": "2px" }}>
            {props.detaliu}
          </span>
        </span>
        <Buton piele="alb" mic onClick={() => props.laApasare()}>
          {props.buton}
        </Buton>
      </div>
      <Show when={props.eroare}>
        <Mesaj fel="eroare">{props.eroare!}</Mesaj>
      </Show>
      {props.children}
    </div>
  );
}

function ProbaMicrofon() {
  const { voice } = useState();
  const [nivel, setNivel] = createSignal<number>();
  const [eroare, setEroare] = createSignal("");
  let flux: MediaStream | undefined;
  let context: AudioContext | undefined;
  let cadru = 0;

  function opresteProba() {
    cancelAnimationFrame(cadru);
    opreste(flux);
    void context?.close();
    flux = undefined;
    context = undefined;
    setNivel(undefined);
  }
  onCleanup(opresteProba);

  async function porneste() {
    setEroare("");
    try {
      flux = await navigator.mediaDevices.getUserMedia({
        audio: voice.preferredAudioInputDevice
          ? { deviceId: { exact: voice.preferredAudioInputDevice } }
          : true,
      });
      context = new AudioContext();
      const analizor = context.createAnalyser();
      analizor.fftSize = 512;
      context.createMediaStreamSource(flux).connect(analizor);
      const esantioane = new Uint8Array(analizor.fftSize);
      const masoara = () => {
        analizor.getByteTimeDomainData(esantioane);
        const varf = esantioane.reduce(
          (m, v) => Math.max(m, Math.abs(v - 128)),
          0,
        );
        setNivel(Math.min(1, (varf / 128) * 2));
        cadru = requestAnimationFrame(masoara);
      };
      masoara();
    } catch {
      opresteProba();
      setEroare("Microfonul nu pornește. Verifică accesul și dispozitivul ales.");
    }
  }

  return (
    <RandProba
      text="Microfon"
      detaliu="Vorbește: bara trebuie să se miște."
      buton={nivel() === undefined ? "Testează" : "Oprește"}
      laApasare={() => (nivel() === undefined ? void porneste() : opresteProba())}
      eroare={eroare()}
    >
      <Show when={nivel() !== undefined}>
        <div
          role="meter"
          aria-label="Nivelul microfonului"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((nivel() ?? 0) * 100)}
          style={{
            height: "8px",
            overflow: "hidden",
            "border-radius": "4px",
            background: C.linie,
          }}
        >
          <div
            style={{
              width: `${(nivel() ?? 0) * 100}%`,
              height: "100%",
              background: C.verdeBara,
            }}
          />
        </div>
      </Show>
    </RandProba>
  );
}

function ProbaDifuzoare() {
  const { voice } = useState();
  const [eroare, setEroare] = createSignal("");

  async function porneste() {
    setEroare("");
    const sunet = new Audio(notaProba) as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };
    sunet.volume = Math.min(1, voice.outputVolume);
    try {
      // Safari n-are `setSinkId`: acolo proba merge pe ieșirea sistemului.
      if (voice.preferredAudioOutputDevice)
        await sunet.setSinkId?.(voice.preferredAudioOutputDevice);
      await sunet.play();
    } catch {
      setEroare("Sunetul nu pornește pe dispozitivul ales.");
    }
  }

  return (
    <RandProba
      text="Difuzoare"
      detaliu="Trebuie să auzi o notă de marimba."
      buton="Testează"
      laApasare={() => void porneste()}
      eroare={eroare()}
    />
  );
}

function ProbaCamera() {
  const { voice } = useState();
  const [pornita, setPornita] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  let flux: MediaStream | undefined;
  let video: HTMLVideoElement | undefined;

  function opresteProba() {
    opreste(flux);
    flux = undefined;
    setPornita(false);
  }
  onCleanup(opresteProba);

  async function porneste() {
    setEroare("");
    try {
      flux = await navigator.mediaDevices.getUserMedia({
        video: voice.preferredVideoDevice
          ? { deviceId: { exact: voice.preferredVideoDevice } }
          : true,
      });
      setPornita(true);
      if (video) video.srcObject = flux;
    } catch {
      opresteProba();
      setEroare("Camera nu pornește. Verifică accesul și dispozitivul ales.");
    }
  }

  return (
    <RandProba
      text="Cameră"
      detaliu="Te vezi aici, doar tu."
      buton={pornita() ? "Oprește" : "Testează"}
      laApasare={() => (pornita() ? opresteProba() : void porneste())}
      eroare={eroare()}
    >
      <video
        ref={video}
        autoplay
        muted
        playsinline
        style={{
          display: pornita() ? "block" : "none",
          width: "100%",
          "aspect-ratio": "16 / 9",
          "object-fit": "cover",
          "border-radius": "14px",
          background: C.negru,
        }}
      />
    </RandProba>
  );
}

const CHEI = {
  audioinput: "preferredAudioInputDevice",
  audiooutput: "preferredAudioOutputDevice",
  videoinput: "preferredVideoDevice",
} as const;

function AlegeDispozitiv(props: {
  kind: keyof typeof CHEI;
  eticheta: string;
  /** Spune paginii dacă browserul dă numele dispozitivelor, adică dacă are permisiune. */
  laNume?: (are: boolean) => void;
}) {
  const { voice } = useState();
  const media = createMemo(() => useMediaDeviceSelect({ kind: props.kind }));
  const cheie = () => CHEI[props.kind];

  // Fără sursa virtuală a apelurilor. „default" stă primul, ca implicitul sistemului să fie mereu de găsit.
  const optiuni = createMemo(() => {
    const lista = media()
      .devices()
      .filter((d) => d.label.split(":").pop() !== stoatSinkName);
    const implicit = lista.find((d) => d.deviceId === "default");
    return [
      { valoare: "default", text: implicit?.label || "Implicit" },
      ...lista
        .filter((d) => d.deviceId !== "default")
        .map((d) => ({ valoare: d.deviceId, text: d.label || "Fără nume" })),
    ];
  });

  onMount(() => {
    void navigator.mediaDevices
      ?.enumerateDevices()
      .then((l) =>
        props.laNume?.(l.some((d) => d.kind === props.kind && d.label)),
      );
  });

  return (
    <CampAlege
      eticheta={props.eticheta}
      valoare={voice[cheie()] ?? "default"}
      optiuni={optiuni()}
      laSchimbare={(id) => {
        // ⚠️ La video, „default" nu se poate activa pe loc: se aplică la următoarea pornire a camerei.
        if (props.kind !== "videoinput" || id !== "default")
          void media().setActiveMediaDevice(id);
        voice[cheie()] = id === "default" ? undefined : id;
      }}
    />
  );
}

function Volum(props: {
  eticheta: string;
  valoare: number;
  laSchimbare: (v: number) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "flex",
          "justify-content": "space-between",
          "font-size": "14px",
          "font-weight": 600,
        }}
      >
        {props.eticheta}
        <span style={{ color: C.stins }}>
          {Math.round(props.valoare * 100)}%
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={3}
        step={0.1}
        value={props.valoare}
        onInput={(e) => props.laSchimbare(Number(e.currentTarget.value))}
        style={{ width: "100%", "accent-color": C.negru }}
      />
    </label>
  );
}

export function RandComutator(props: {
  text: string;
  detaliu?: string;
  pornit: boolean;
  laApasare: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "12px",
        "flex-wrap": "wrap",
      }}
    >
      <span style={{ flex: "1 1 200px", "min-width": 0 }}>
        <span
          style={{ display: "block", "font-size": "15px", "font-weight": 600 }}
        >
          {props.text}
        </span>
        <Show when={props.detaliu}>
          <span
            style={{
              display: "block",
              "margin-top": "2px",
              color: C.stins,
              "font-size": "14px",
              "line-height": "1.4",
            }}
          >
            {props.detaliu}
          </span>
        </Show>
      </span>
      <Buton piele="alb" mic onClick={() => props.laApasare()}>
        {props.pornit ? "Oprește" : "Pornește"}
      </Buton>
    </div>
  );
}
