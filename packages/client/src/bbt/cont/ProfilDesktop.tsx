import { For, JSX, Show } from "solid-js";

import { useNavigate } from "@revolt/routing";

import { BEANBAG } from "../avatarImplicit";
import { BBT_SITE_URL } from "../config";
import { PlicVinyl } from "../PlicVinyl";
import { IconCamera, UN_RAND } from "../telefon";

import { useCont, useExperiente, ziLunga } from "./date";
import { usePiese } from "./Piese";
import { initiale, useDescriere } from "./ProfilTelefon";
import { C, DE_FONTE, TitluPagina } from "./ui";

/** Câte rânduri stau pe pagină în fiecare listă; restul, în pagina lor. */
const RANDURI = 3;
/** Cercurile rândurilor, pe rând, din demo. */
const CERCURI = ["#DCEEFF", "#FFEFAD", "#E9CCFF"];

/**
 * BBT: „Profilul meu" pe desktop și tabletă (cererea userului, 31 oct 2026, varianta B, demo-ul „C · Profil"), cu măsurile
 * de acolo: eroul de 232, cifrele de 40 și cele două liste, piesele și diplomele. Pe telefon rămâne `ProfilTelefon.tsx`.
 *
 * ⚠️ Poza și linkul spre profilul public sunt două elemente alăturate: până la varianta asta, butonul pozei stătea în link.
 */
export function ProfilDesktop() {
  const navigate = useNavigate();
  const cont = useCont();
  const experiente = useExperiente();
  const piese = usePiese();
  const descriere = useDescriere();

  const toate = () => [
    ...(experiente.data?.active ?? []),
    ...(experiente.data?.trecute ?? []),
  ];
  const numara = (fel: string) => toate().filter((e) => e.fel === fel).length;
  const nume = () => cont.data?.numeAfisat ?? cont.data?.numeComplet ?? "";
  const diplome = () => cont.data?.diplome ?? [];

  return (
    <div style={{ height: "100%", "overflow-y": "auto", width: "100%" }}>
      <div
        class="bbt-pagina-cont"
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "12px",
          "max-width": "1100px",
          padding: "16px 22px 48px",
          "box-sizing": "border-box",
        }}
      >
        <TitluPagina>Profilul meu</TitluPagina>

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            "flex-shrink": 0,
            "align-items": "center",
            gap: "24px",
            "min-height": "232px",
            padding: "24px 36px",
            "box-sizing": "border-box",
            "border-radius": "32px",
            background: C.rozDeschis,
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 480 580"
            style={{
              position: "absolute",
              top: "-110px",
              right: "60px",
              width: "400px",
              height: "483px",
              transform: "rotate(14deg)",
            }}
          >
            <path d={BEANBAG} fill={C.rozBeanbag} />
          </svg>

          <button
            type="button"
            aria-label="Schimbă poza de profil"
            onClick={() => navigate("/cont/profil")}
            style={{
              position: "relative",
              "flex-shrink": 0,
              display: "flex",
              padding: "3px",
              border: `3px solid ${C.roz}`,
              "border-radius": "62px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: "112px",
                height: "112px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                overflow: "hidden",
                "border-radius": "50%",
                background: C.negru,
                color: C.peNegru,
                "font-size": "36px",
                "font-weight": 800,
              }}
            >
              <Show when={cont.data?.avatarUrl} fallback={initiale(nume())}>
                {(url) => (
                  <img
                    src={url()}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      "object-fit": "cover",
                    }}
                  />
                )}
              </Show>
            </span>
            <span
              style={{
                position: "absolute",
                right: "0",
                bottom: "0",
                width: "32px",
                height: "32px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "box-sizing": "border-box",
                "border-radius": "16px",
                border: `2px solid ${C.rozDeschis}`,
                background: C.negru,
                color: C.peNegru,
              }}
            >
              <IconCamera size={16} />
            </span>
          </button>

          <div style={{ position: "relative", "min-width": 0 }}>
            <h2
              style={{
                ...DE_FONTE,
                ...UN_RAND,
                margin: 0,
                "font-size": "44px",
                "line-height": "1.15",
              }}
            >
              {nume()}
            </h2>
            <Show when={descriere()}>
              <div
                style={{ ...UN_RAND, "margin-top": "2px", "font-size": "14px" }}
              >
                {descriere()}
              </div>
            </Show>
            <div
              style={{
                display: "flex",
                "flex-wrap": "wrap",
                "align-items": "center",
                gap: "10px",
                "margin-top": "10px",
              }}
            >
              {/* Aceeași regulă ca în contul de pe site: telefonul confirmat face „Artist verificat". */}
              <Show when={cont.data?.phoneVerified}>
                <span
                  style={{
                    padding: "6px 12px",
                    "border-radius": "999px",
                    background: C.verdeDeschis,
                    "font-size": "12px",
                    "font-weight": 800,
                  }}
                >
                  Artist verificat
                </span>
              </Show>
              <Show when={cont.data?.username}>
                <a
                  href={`${BBT_SITE_URL}/u/${cont.data!.username}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: C.text,
                    "font-size": "13px",
                    "font-weight": 600,
                  }}
                >
                  Vezi profilul public ↗
                </a>
              </Show>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(3, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <Cifra
            valoare={experiente.data ? numara("camp") : "-"}
            eticheta={numara("camp") === 1 ? "tabără" : "tabere"}
            laApasare={() => navigate("/cont/mycamps")}
          />
          <Cifra
            valoare={experiente.data ? numara("workshop") : "-"}
            eticheta={numara("workshop") === 1 ? "workshop" : "workshopuri"}
            laApasare={() => navigate("/cont/workshops")}
          />
          <Cifra
            valoare={experiente.data ? numara("curs") : "-"}
            eticheta={numara("curs") === 1 ? "curs" : "cursuri"}
            laApasare={() => navigate("/cont/cursuri")}
          />
        </div>

        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          <Lista
            titlu="Piesele mele"
            total={piese.data?.length ?? 0}
            gol={
              piese.isError
                ? "Piesele nu se încarcă acum."
                : "Piesele tale de la tabere și challenge-uri apar aici."
            }
            laToate={() => navigate("/cont/piese")}
          >
            <For each={piese.data?.slice(0, RANDURI)}>
              {(p) => (
                <Rand
                  plic={<PlicVinyl id={p.id} coperta={p.coverUrl} marime={40} />}
                  titlu={p.title}
                  loc={p.camp?.nume ?? p.challenge?.titlu}
                  laApasare={() => navigate("/cont/piese")}
                />
              )}
            </For>
          </Lista>
          <Lista
            titlu="Diplomele mele"
            total={diplome().length}
            gol="Diplomele apar aici după ce termini un curs."
            laToate={() => navigate("/cont/diplome")}
          >
            <For each={diplome().slice(0, RANDURI)}>
              {(d, i) => (
                <Rand
                  cerc={CERCURI[(i() + 1) % CERCURI.length]}
                  titlu={d.titluCurs}
                  loc={ziLunga(d.dataEmitere)}
                  laApasare={() => navigate("/cont/diplome")}
                />
              )}
            </For>
          </Lista>
        </div>
      </div>
    </div>
  );
}

function Cifra(props: {
  valoare: number | string;
  eticheta: string;
  laApasare: () => void;
}) {
  return (
    <button
      type="button"
      class="bbt-moale"
      onClick={() => props.laApasare()}
      style={{
        padding: "18px 22px",
        border: 0,
        "border-radius": "28px",
        background: C.foaie,
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <div style={{ ...DE_FONTE, "font-size": "40px", "line-height": "1.1" }}>
        {props.valoare}
      </div>
      <div style={{ color: C.stins, "font-size": "14px", "font-weight": 600 }}>
        {props.eticheta}
      </div>
    </button>
  );
}

function Lista(props: {
  titlu: string;
  total: number;
  gol: string;
  laToate: () => void;
  children: JSX.Element;
}) {
  return (
    <section
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
        "min-width": 0,
        padding: "22px 24px",
        "box-sizing": "border-box",
        "border-radius": "32px",
        background: C.foaie,
      }}
    >
      <h2 style={{ ...DE_FONTE, margin: 0, "font-size": "26px" }}>
        {props.titlu}
      </h2>
      <Show
        when={props.total > 0}
        fallback={
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            {props.gol}
          </p>
        }
      >
        {props.children}
      </Show>
      <Show when={props.total > RANDURI}>
        <button
          type="button"
          onClick={() => props.laToate()}
          style={{
            "align-self": "flex-start",
            padding: "4px 0 0",
            border: 0,
            background: "transparent",
            color: C.text,
            "font-family": "inherit",
            "font-size": "13px",
            "font-weight": 700,
            cursor: "pointer",
          }}
        >
          Vezi toate ({props.total})
        </button>
      </Show>
    </section>
  );
}

function Rand(props: {
  cerc?: string;
  plic?: JSX.Element;
  titlu: string;
  loc?: string;
  laApasare: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        "min-height": "56px",
        padding: "0 12px",
        border: 0,
        "border-radius": "20px",
        background: C.fundal,
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <Show
        when={props.plic}
        fallback={
          <span
            style={{
              width: "36px",
              height: "36px",
              "flex-shrink": 0,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "50%",
              background: props.cerc,
            }}
          >
            <svg aria-hidden="true" width="21" height="25" viewBox="0 0 480 580">
              <path d={BEANBAG} fill={C.negru} fill-opacity="0.55" />
            </svg>
          </span>
        }
      >
        {props.plic}
      </Show>
      <span
        style={{
          ...UN_RAND,
          flex: 1,
          "min-width": 0,
          "font-size": "15px",
          "font-weight": 700,
        }}
      >
        {props.titlu}
      </span>
      <Show when={props.loc}>
        <span
          style={{
            ...UN_RAND,
            "max-width": "45%",
            color: C.stins,
            "font-size": "13px",
          }}
        >
          {props.loc}
        </span>
      </Show>
    </button>
  );
}
