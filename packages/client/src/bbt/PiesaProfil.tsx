import { Show, createSignal, onCleanup } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { C } from "./cont/ui";
import { formateazaDurata } from "./vocal/nume";

export type UltimaPiesa = {
  id: string;
  titlu: string;
  url: string;
  copertaUrl: string | null;
  durata: number | null;
  sursa: string | null;
};

/**
 * Ultima piesă a omului din mini-profil, ca `mobil/src/fir/PiesaProfil.tsx`: playerul dedesubt și „+n" spre profilul
 * complet, unde stă restul.
 *
 * ⚠️ Muzica se oprește când se închide cardul: playerul e doar aici, deci altfel ar cânta mai departe fără niciun buton de
 * pauză pe ecran.
 */
export function PiesaProfil(props: {
  piesa: UltimaPiesa;
  total: number;
  profilUrl: string;
}) {
  const [canta, setCanta] = createSignal(false);
  const [pozitie, setPozitie] = createSignal(0);
  const [durata, setDurata] = createSignal(0);
  let audio!: HTMLAudioElement;

  onCleanup(() => audio.pause());

  const total = () => durata() || props.piesa.durata || 0;
  const rest = () => props.total - 1;
  const detalii = () =>
    [
      props.piesa.sursa,
      props.piesa.durata ? formateazaDurata(props.piesa.durata * 1000) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  function muta(e: MouseEvent & { currentTarget: HTMLDivElement }) {
    const cutie = e.currentTarget.getBoundingClientRect();
    if (total() > 0)
      audio.currentTime = ((e.clientX - cutie.left) / cutie.width) * total();
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
        "margin-top": "10px",
        padding: "10px",
        "border-radius": "14px",
        background: C.foaie,
      }}
    >
      {/* `preload="none"`: cardul se deschide la fiecare click pe un om, iar piesa nu trebuie trasă dacă nu pornește. */}
      <audio
        ref={audio}
        src={props.piesa.url}
        preload="none"
        onPlay={() => setCanta(true)}
        onPause={() => setCanta(false)}
        onEnded={() => setCanta(false)}
        onTimeUpdate={() => setPozitie(audio.currentTime)}
        onLoadedMetadata={() =>
          setDurata(Number.isFinite(audio.duration) ? audio.duration : 0)
        }
      />
      <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
        <Show
          when={props.piesa.copertaUrl}
          fallback={
            <span
              style={{
                width: "42px",
                height: "42px",
                "flex-shrink": 0,
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "border-radius": "10px",
                background: C.roz,
                color: C.negru,
              }}
            >
              <Symbol size={18}>music_note</Symbol>
            </span>
          }
        >
          {(coperta) => (
            <img
              src={coperta()}
              alt=""
              style={{
                width: "42px",
                height: "42px",
                "flex-shrink": 0,
                "border-radius": "10px",
                "object-fit": "cover",
              }}
            />
          )}
        </Show>
        <div style={{ flex: 1, "min-width": 0 }}>
          <div
            style={{
              "font-size": "14px",
              "font-weight": 700,
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {props.piesa.titlu}
          </div>
          <Show when={detalii()}>
            <div
              style={{
                "font-size": "12px",
                color: C.stins,
                overflow: "hidden",
                "text-overflow": "ellipsis",
                "white-space": "nowrap",
              }}
            >
              {detalii()}
            </div>
          </Show>
        </div>
        <Show when={rest() > 0}>
          <a
            href={props.profilUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Încă ${rest()} piese, pe profilul complet`}
            style={{
              "min-width": "36px",
              height: "28px",
              padding: "0 8px",
              "box-sizing": "border-box",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "14px",
              background: C.fundal,
              color: C.negru,
              "font-size": "13px",
              "font-weight": 700,
              "text-decoration": "none",
            }}
          >
            +{rest()}
          </a>
        </Show>
      </div>
      <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
        <button
          type="button"
          class="bbt-moale"
          aria-label={canta() ? "Pauză" : "Ascultă"}
          onClick={() => (canta() ? audio.pause() : void audio.play())}
          style={{
            width: "34px",
            height: "34px",
            "flex-shrink": 0,
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            padding: 0,
            border: "none",
            "border-radius": "50%",
            background: C.negru,
            color: C.fundal,
            cursor: "pointer",
          }}
        >
          <Symbol size={18}>{canta() ? "pause" : "play_arrow"}</Symbol>
        </button>
        <div
          onClick={muta}
          style={{ flex: 1, padding: "8px 0", cursor: "pointer" }}
        >
          <div
            style={{
              height: "4px",
              "border-radius": "2px",
              overflow: "hidden",
              background: C.linie,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${total() > 0 ? (pozitie() / total()) * 100 : 0}%`,
                background: C.negru,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
