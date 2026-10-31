import { JSX, Show, createMemo } from "solid-js";
import { useMediaDeviceSelect } from "solid-livekit-components";

import { useInstance } from "@revolt/instance";
import { stoatSinkName } from "@revolt/rtc";
import { useState } from "@revolt/state";

import { Buton, C, CampAlege, Sectiune, TitluPagina } from "./ui";

/**
 * BBT: „Voce și video", `/cont/voce` (cererea userului, 31 oct 2026): ce era esențial din setările clientului, fără panoul lor.
 * Doar pe hub: în aplicație microfonul și camera le alege telefonul. Aceleași valori (`state.voice`), deci apelurile le
 * citesc la fel ca până acum.
 */
export function VoceVideo() {
  const { limits } = useInstance();
  const { voice } = useState();

  return (
    <>
      <TitluPagina>Voce și video</TitluPagina>
      <div style={COLOANA}>
        <Sectiune titlu="Dispozitive">
          <div style={{ display: "grid", gap: "14px" }}>
            <AlegeDispozitiv kind="audioinput" eticheta="Microfon" />
            <AlegeDispozitiv kind="audiooutput" eticheta="Difuzoare" />
            <Show when={limits().video}>
              <AlegeDispozitiv kind="videoinput" eticheta="Cameră" />
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

        <Sectiune titlu="Sunetul tău">
          <div style={{ display: "grid", gap: "14px" }}>
            <CampAlege
              eticheta="Reducerea zgomotului"
              valoare={voice.noiseSupression ?? "enhanced"}
              laSchimbare={(v) =>
                (voice.noiseSupression = v as "disabled" | "browser" | "enhanced")
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
              laApasare={() => (voice.autoGainControl = !voice.autoGainControl)}
            />
          </div>
        </Sectiune>
      </div>
    </>
  );
}

const COLOANA: JSX.CSSProperties = {
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
  "max-width": "640px",
};

const CHEI = {
  audioinput: "preferredAudioInputDevice",
  audiooutput: "preferredAudioOutputDevice",
  videoinput: "preferredVideoDevice",
} as const;

function AlegeDispozitiv(props: {
  kind: keyof typeof CHEI;
  eticheta: string;
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
