import { For, Show, createSignal, createEffect, on } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../../tokenBbt";
import { C } from "../ui";

const MARIME_MAXIMA = 30 * 1024 * 1024;

type Instrumental = {
  id: string;
  nume: string;
  urlR2: string;
  urcatDeId: string | null;
};

/**
 * BBT: instrumentalele din capul notiței, ca în aplicație și pe site: cine pleacă din cameră scrie mai departe pe același
 * beat. Fiecare ascultă la el, nu sincronizat, în buclă. `semnal` crește când cineva a urcat sau a șters un fișier.
 */
export function InstrumentaleNotita(props: {
  sesiune: () => string;
  sesiuneId: string;
  euId: string;
  semnal: number;
}) {
  const [lista, setLista] = createSignal<Instrumental[]>([]);
  const [urca, setUrca] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  const cale = () => `/api/public/sessions/${props.sesiuneId}/instrumentale`;
  let camp: HTMLInputElement | undefined;

  const incarca = () =>
    cerereCont<Instrumental[]>(props.sesiune(), cale()).then(setLista, () => {});

  createEffect(on(() => props.semnal, () => void incarca()));

  async function urcaFisier(f: File | undefined) {
    if (!f) return;
    setEroare("");
    if (!/\.(mp3|m4a|wav)$/i.test(f.name))
      return setEroare("Doar fișiere MP3, M4A sau WAV.");
    if (f.size > MARIME_MAXIMA)
      return setEroare("Fișierul e prea mare (maxim 30 MB).");
    setUrca(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      await cerereCont(props.sesiune(), cale(), { method: "POST", body: fd });
      await incarca();
    } catch (e) {
      setEroare(
        e instanceof Error && e.message !== "Cererea n-a mers."
          ? e.message
          : "Fișierul n-a urcat. Încearcă din nou.",
      );
    } finally {
      setUrca(false);
      if (camp) camp.value = "";
    }
  }

  async function sterge(i: Instrumental) {
    if (!window.confirm(`Ștergi „${i.nume}" pentru toți din sesiune?`)) return;
    try {
      await cerereCont(props.sesiune(), `${cale()}/${i.id}`, {
        method: "DELETE",
      });
      await incarca();
    } catch {
      setEroare("Nu s-a șters. Încearcă din nou.");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
        padding: "12px 14px",
        "border-radius": "20px",
        background: C.foaie,
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
        }}
      >
        <span style={{ color: C.stins, "font-size": "14px", "font-weight": 700 }}>
          Instrumentale
        </span>
        <button
          type="button"
          disabled={urca()}
          onClick={() => camp?.click()}
          style={{
            border: 0,
            background: "transparent",
            color: C.text,
            "font-family": "inherit",
            "font-size": "14px",
            "font-weight": 700,
            cursor: "pointer",
          }}
        >
          {urca() ? "Se urcă…" : "Adaugă"}
        </button>
        <input
          ref={camp}
          type="file"
          accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav"
          style={{ display: "none" }}
          onChange={(e) => void urcaFisier(e.currentTarget.files?.[0])}
        />
      </div>
      <Show when={eroare()}>
        <span style={{ color: C.rosu, "font-size": "14px" }}>{eroare()}</span>
      </Show>
      <For each={lista()}>
        {(i) => (
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "4px" }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                gap: "10px",
                "font-size": "14px",
                "font-weight": 600,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  "text-overflow": "ellipsis",
                  "white-space": "nowrap",
                }}
              >
                {i.nume}
              </span>
              <Show when={i.urcatDeId === props.euId}>
                <button
                  type="button"
                  aria-label={`Șterge ${i.nume}`}
                  onClick={() => void sterge(i)}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: C.stins,
                    cursor: "pointer",
                  }}
                >
                  <Symbol size={16}>delete</Symbol>
                </button>
              </Show>
            </div>
            {/* `preload="none"`: o sesiune cu multe beat-uri n-are voie să tragă toate fișierele la deschidere. */}
            <audio
              controls
              loop
              preload="none"
              src={i.urlR2}
              style={{ width: "100%", height: "36px", "color-scheme": "light" }}
            />
          </div>
        )}
      </For>
    </div>
  );
}
