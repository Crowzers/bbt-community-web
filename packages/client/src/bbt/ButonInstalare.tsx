import {
  Match,
  Show,
  Switch,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { TutorialInstalare } from "./TutorialInstalare";
import { browser, instalare, sistemDesktop, sistemTelefon } from "./instalare";

/**
 * BBT: butonul mare „Instalează pe Windows" / „Instalează pe Mac" din bara de sus, lângă cont
 * (cererea userului, 20 oct 2026: „lângă user, în dreapta, în navbar, și să fie mare").
 *
 * Instalează hub-ul ca PWA. De ce nu o aplicație descărcată, vezi `instalare.ts`.
 *
 * Două drumuri, după browser:
 * - Chrome și Edge ne dau evenimentul de instalare ⇒ clicul deschide direct fereastra lor.
 * - Safari, Firefox, sau Chrome care nu l-a trimis (de exemplu fiindcă hub-ul e DEJA instalat și
 *   omul e într-un tab obișnuit) ⇒ clicul deschide un mic panou cu pașii. Fără panoul ăsta, butonul
 *   ar fi părut stricat exact pentru cine are deja aplicația.
 *
 * Pe telefon și tabletă (20 oct 2026), aceeași regulă: instalarea directă când browserul o permite
 * (Chrome pe Android), altfel panoul cu pașii de jos în sus, `TutorialInstalare.tsx`. Pe telefon
 * butonul stă în bara de sus a listei de canale (`compact`), mai mic.
 *
 * 🔥 **Negru din 30 oct 2026** (21 și 23: „pill negru, nu roz, ca să nu concureze cu conținutul"). Până atunci roz,
 * ca acțiune („roz înseamnă click"), cu text negru. Înălțimea 44px, ca o pastilă: cât caseta de cont de lângă (avatar 34 + 2×6 + chenar),
 * ca să stea pe aceeași linie fără să se întindă una pe alta.
 */

const NEGRU = "#0A0A0B";
const NEGRU_APASAT = "#2A2A2C";
const LINIE = "#E5E5E5";
const FOAIE = "#FFFFFF";

export function ButonInstalare(props: { compact?: boolean }) {
  const sistem = sistemDesktop();
  const telefon = sistemTelefon();
  const [pasi, setPasi] = createSignal(false);
  const [tutorial, setTutorial] = createSignal(false);
  const [lat, setLat] = createSignal(true);
  const [incape, setIncape] = createSignal(true);
  let cutie: HTMLDivElement | undefined;

  onMount(() => {
    // Sub ~1180px bara de sus nu mai are loc de sigla, căutare, clopoțel, butonul lung și cont.
    // Butonul rămâne mare, doar textul se scurtează la „Instalează".
    const mq = window.matchMedia("(min-width: 1180px)");
    const aplica = () => setLat(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    // Sub 370px (Android-urile de 360) „Instalează" nu mai încape lângă siglă și cont:
    // rămâne doar iconița.
    const mqTelefon = window.matchMedia("(min-width: 370px)");
    const aplicaTelefon = () => setIncape(mqTelefon.matches);
    aplicaTelefon();
    mqTelefon.addEventListener("change", aplicaTelefon);

    const afara = (e: PointerEvent) => {
      if (cutie && !cutie.contains(e.target as Node)) setPasi(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPasi(false);
    document.addEventListener("pointerdown", afara);
    document.addEventListener("keydown", esc);
    onCleanup(() => {
      mq.removeEventListener("change", aplica);
      mqTelefon.removeEventListener("change", aplicaTelefon);
      document.removeEventListener("pointerdown", afara);
      document.removeEventListener("keydown", esc);
    });
  });

  const numeSistem = sistem === "mac" ? "Mac" : "Windows";
  const text = () => {
    if (telefon) {
      if (props.compact) return incape() ? "Instalează" : "";
      return "Instalează aplicația";
    }
    return lat() ? `Instalează pe ${numeSistem}` : "Instalează";
  };

  async function apasa() {
    if (instalare.directa() && (await instalare.porneste())) return;
    if (telefon) setTutorial(true);
    else setPasi((p) => !p);
  }

  return (
    <Show when={instalare.vizibil()}>
      <div
        ref={cutie}
        style={{ position: "relative", display: "flex", "flex-shrink": 0 }}
      >
        <button
          type="button"
          onClick={apasa}
          class={props.compact ? undefined : "bbt-instalare-buton"}
          aria-expanded={instalare.directa() ? undefined : pasi()}
          aria-label={telefon ? "Instalează BBT Community" : undefined}
          title={
            telefon ? undefined : `Instalează BBT Community pe ${numeSistem}`
          }
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            gap: props.compact ? "6px" : "8px",
            height: props.compact ? "34px" : "44px",
            "min-width": props.compact ? "34px" : undefined,
            "box-sizing": "border-box",
            padding: props.compact
              ? text()
                ? "0 14px 0 10px"
                : "0"
              : "0 20px 0 16px",
            "border-radius": "999px",
            border: "0",
            background: pasi() ? NEGRU_APASAT : NEGRU,
            color: "#FFFFFF",
            cursor: "pointer",
            "font-family": "inherit",
            "font-size": "14px",
            "font-weight": 700,
            "white-space": "nowrap",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = NEGRU_APASAT)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = pasi() ? NEGRU_APASAT : NEGRU)
          }
        >
          <Symbol size={props.compact ? 18 : 20}>download</Symbol>
          {/* Pe îngust (`raspuns.css`) rămâne doar iconița. */}
          <span class={props.compact ? undefined : "bbt-instalare-text"}>
            {text()}
          </span>
        </button>

        <Show when={tutorial() && telefon}>
          <TutorialInstalare
            telefon={telefon!}
            laInchidere={() => setTutorial(false)}
          />
        </Show>

        <Show when={pasi()}>
          <div
            role="dialog"
            aria-label="Cum instalezi BBT Community"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              "z-index": 50,
              width: "300px",
              padding: "16px",
              "border-radius": "16px",
              border: `1px solid ${LINIE}`,
              background: FOAIE,
              "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
              color: "#0A0A0B",
              "font-size": "14px",
              "line-height": "1.5",
            }}
          >
            <div
              style={{
                color: "#0A0A0B",
                "font-weight": 700,
                "font-size": "16px",
                "margin-bottom": "6px",
              }}
            >
              Community pe {numeSistem}
            </div>
            <Switch>
              <Match when={browser() === "chromium"}>
                <p style={{ margin: 0 }}>
                  Apasă iconița de instalare din capătul din dreapta al barei de
                  adrese. E un mic monitor cu o săgeată.
                </p>
                <p style={{ margin: "8px 0 0" }}>
                  Nu o vezi? Atunci Community e deja instalat. Îl găsești în{" "}
                  {sistem === "mac" ? "Launchpad" : "meniul Start"}.
                </p>
              </Match>
              <Match when={browser() === "safari"}>
                <p style={{ margin: 0 }}>
                  Din meniul de sus al lui Safari: Fișier, apoi Adaugă în Dock.
                </p>
                <p style={{ margin: "8px 0 0" }}>
                  Community apare în Dock, cu fereastra lui.
                </p>
              </Match>
              <Match when={true}>
                <p style={{ margin: 0 }}>
                  Browserul ăsta nu instalează aplicații web. Deschide Community
                  în {sistem === "mac" ? "Chrome" : "Edge sau Chrome"} și apasă
                  din nou butonul.
                </p>
              </Match>
            </Switch>
          </div>
        </Show>
      </div>
    </Show>
  );
}
