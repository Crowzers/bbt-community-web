import { For, Show, createEffect, createSignal } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation } from "@revolt/routing";

import { BEANBAG } from "./avatarImplicit";
import { C } from "./cont/ui";
import { TITLU_PAGINA } from "./telefon";

/**
 * BBT: regulile comunității, la prima intrare într-un canal (cererea userului, 1 nov 2026, varianta B). Într-un experiment
 * randomizat pe r/science, regulile afișate au crescut participarea celor noi cu circa 70% (Matias, PNAS 2019). Rămân în Setări,
 * la „Regulile comunității".
 *
 * Textul vine din regulile vechiului server de Discord, strânse de la nouă paragrafe la opt rânduri. Același text în
 * `mobil/src/fir/RegulileComunitatii.tsx`. „Citit" se ține pe dispozitiv, pe cont.
 */

const INTRO =
  "Aici e spațiul comunității BBT. Orice subiect e binevenit, cât timp respectă regulile de mai jos.";

const REGULI = [
  [
    "Respect înainte de toate",
    "Critici piesa, nu omul. Fără hărțuire, jigniri sau presiune, în grup sau în privat.",
  ],
  [
    "Umor cu cap",
    "Glumele pe seama discriminării, sexismului sau agresivității primesc direct „la revedere”.",
  ],
  [
    "Zero ură",
    "Nu tolerăm homofobia, rasismul, antisemitismul sau alte forme de ură. O discuție argumentată e una, un rant de căpitan de galerie de liga a 4-a e alta.",
  ],
  [
    "Ce e aici rămâne aici",
    "Nu dai mai departe poze, piese sau mesaje fără acordul omului.",
  ],
  [
    "Opinii cu argumente",
    "Pune la îndoială orice, cere dovezi, caută răspunsuri. Părerile bine susținute găsesc ușa deschisă.",
  ],
  [
    "Creativ, nu enervant",
    "Iubim oamenii excentrici și glumele bune. Spamul și reclamele, mai puțin.",
  ],
  [
    "Nu dăm note la gramatică",
    "Scrie cum îți vine, cu tot cu englezisme. Go wild.",
  ],
  ["Dacă ceva nu e în regulă, raportează", "Citește un om din echipă."],
] as const;

const [deschise, setDeschise] = createSignal(false);

export const deschideRegulile = () => setDeschise(true);

const cheie = (id: string) => `bbt.reguli-citite.${id}`;

function aCitit(id: string) {
  try {
    return localStorage.getItem(cheie(id)) === "da";
  } catch {
    // Fără stocare, regulile n-ar mai pleca niciodată de pe ecran.
    return true;
  }
}

function marcheaza(id: string) {
  try {
    localStorage.setItem(cheie(id), "da");
  } catch {
    // Vezi `aCitit`.
  }
}

export function RegulileComunitatii() {
  const client = useClient();
  const location = useLocation();
  const eu = () => client().user?.id;

  createEffect(() => {
    const id = eu();
    if (
      id &&
      location.pathname.startsWith("/server") &&
      location.pathname.includes("/channel/") &&
      !aCitit(id)
    ) {
      setDeschise(true);
    }
  });

  function inchide() {
    const id = eu();
    if (id) marcheaza(id);
    setDeschise(false);
  }

  return (
    <Show when={deschise()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          "z-index": 60,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "16px",
          "box-sizing": "border-box",
          background: "rgba(10,10,11,0.4)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bbt-reguli-titlu"
          style={{
            display: "flex",
            "flex-direction": "column",
            width: "100%",
            "max-width": "480px",
            "max-height": "100%",
            overflow: "hidden",
            "border-radius": "16px",
            background: "#FFFFFF",
            color: C.text,
          }}
        >
          <header
            style={{
              position: "relative",
              "flex-shrink": 0,
              overflow: "hidden",
              padding: "20px 24px",
              background: C.roz,
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 480 580"
              style={{
                position: "absolute",
                top: "-46px",
                right: "-34px",
                width: "170px",
                height: "205px",
                transform: "rotate(14deg)",
              }}
            >
              <path d={BEANBAG} fill={C.rozBeanbag} />
            </svg>
            <h2
              id="bbt-reguli-titlu"
              style={{
                ...TITLU_PAGINA,
                position: "relative",
                "font-size": "26px",
                "line-height": "32px",
              }}
            >
              Regulile casei
            </h2>
            <p
              style={{
                position: "relative",
                margin: "2px 0 0",
                "font-size": "14px",
                "line-height": "20px",
                "font-weight": 600,
              }}
            >
              Vechimea nu te scutește de ele.
            </p>
          </header>
          <div
            style={{
              "min-height": 0,
              overflow: "auto",
              padding: "16px 24px 4px",
              "font-size": "15px",
              "line-height": "22px",
            }}
          >
            <p style={{ margin: 0, color: C.stins }}>{INTRO}</p>
            <For each={REGULI}>
              {([titlu, text], i) => (
                <div
                  style={{ display: "flex", gap: "10px", "margin-top": "12px" }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      "flex-shrink": 0,
                      "align-items": "center",
                      "justify-content": "center",
                      width: "24px",
                      height: "24px",
                      "border-radius": "50%",
                      background: C.roz,
                      "font-size": "13px",
                      "font-weight": 800,
                    }}
                  >
                    {i() + 1}
                  </span>
                  <div>
                    <div style={{ "font-weight": 700 }}>{titlu}</div>
                    {text}
                  </div>
                </div>
              )}
            </For>
          </div>
          <div style={{ "flex-shrink": 0, padding: "16px 24px 24px" }}>
            <button
              type="button"
              class="bbt-moale"
              ref={(el) => queueMicrotask(() => el.focus())}
              onClick={inchide}
              style={{
                width: "100%",
                height: "48px",
                border: 0,
                "border-radius": "999px",
                background: C.negru,
                color: "#FFFFFF",
                cursor: "pointer",
                "font-family": "inherit",
                "font-size": "16px",
                "font-weight": 700,
              }}
            >
              Am înțeles
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
