import {
  Match,
  Show,
  Switch,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { browser, instalare, sistemDesktop } from "./instalare";

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
 * Roz, fiindcă e o acțiune („roz înseamnă click", regula de pe site), cu text NEGRU (alb pe roz =
 * 1,6:1). Înălțimea 44px, ca o pastilă: cât caseta de cont de lângă (avatar 34 + 2×6 + chenar),
 * ca să stea pe aceeași linie fără să se întindă una pe alta.
 */

const ROZ = "#FFA8CD";
const ROZ_INTENS = "#B85C86";
const LINIE = "rgba(255,255,255,0.08)";
const FOAIE = "#141414";

export function ButonInstalare() {
  const sistem = sistemDesktop();
  const [pasi, setPasi] = createSignal(false);
  const [lat, setLat] = createSignal(true);
  let cutie: HTMLDivElement | undefined;

  onMount(() => {
    // Sub ~1180px bara de sus nu mai are loc de sigla, căutare, clopoțel, butonul lung și cont.
    // Butonul rămâne mare, doar textul se scurtează la „Instalează".
    const mq = window.matchMedia("(min-width: 1180px)");
    const aplica = () => setLat(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);

    const afara = (e: PointerEvent) => {
      if (cutie && !cutie.contains(e.target as Node)) setPasi(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPasi(false);
    document.addEventListener("pointerdown", afara);
    document.addEventListener("keydown", esc);
    onCleanup(() => {
      mq.removeEventListener("change", aplica);
      document.removeEventListener("pointerdown", afara);
      document.removeEventListener("keydown", esc);
    });
  });

  const numeSistem = sistem === "mac" ? "Mac" : "Windows";

  async function apasa() {
    if (instalare.directa() && (await instalare.porneste())) return;
    setPasi((p) => !p);
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
          aria-expanded={instalare.directa() ? undefined : pasi()}
          title={`Instalează BBT Community pe ${numeSistem}`}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            height: "44px",
            padding: "0 20px 0 16px",
            "border-radius": "999px",
            border: "0",
            background: pasi() ? ROZ_INTENS : ROZ,
            color: "#000",
            cursor: "pointer",
            "font-family": "inherit",
            "font-size": "14px",
            "font-weight": 700,
            "white-space": "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = ROZ_INTENS)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = pasi() ? ROZ_INTENS : ROZ)
          }
        >
          <Symbol size={20}>download</Symbol>
          {lat() ? `Instalează pe ${numeSistem}` : "Instalează"}
        </button>

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
              "box-shadow": "0 16px 48px rgba(0,0,0,0.6)",
              color: "rgba(255,255,255,0.8)",
              "font-size": "13.5px",
              "line-height": "1.5",
            }}
          >
            <div
              style={{
                color: "#fff",
                "font-weight": 700,
                "font-size": "14px",
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
