import { JSX, Show, createSignal } from "solid-js";

import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import {
  CERC_40,
  IconInapoi,
  IconQR,
  deFonte,
  interval,
  ziScurta,
} from "../telefon";

import { lei, ora, useExperiente } from "./date";
import { QrMare } from "./Experiente";
import { BaraRate } from "./ExperienteTelefon";
import { ButonPlateste } from "./Plata";
import { C, Incarcare } from "./ui";

/**
 * BBT: detaliul unei experiențe pe telefon (macheta 20d), copia ecranului `mobil/src/app/experienta.tsx`, cu măsurile de
 * acolo: partea de sus roz cu titlul mare și QR-ul, apoi plata pe rate, apoi drumurile spre program și spre Plăți. Datele
 * sunt cele din lista încărcată, nu o cerere nouă. Pe desktop cardurile din 23b au deja toate astea.
 *
 * Un workshop n-are rândurile: biletul e plătit integral și nu apare în Plăți, ca pe site.
 */
export function ExperientaTelefon(props: { id: string }) {
  const navigate = useNavigate();
  const experiente = useExperiente();
  const [qrMare, setQrMare] = createSignal(false);
  const e = () => {
    const date = experiente.data;
    return date
      ? [...date.active, ...date.trecute].find((x) => x.id === props.id)
      : undefined;
  };
  const inapoi = () => navigate("/cont/experiente");

  const sus = () =>
    [
      e()!.azi
        ? `AZI · ${ora(e()!.dataStart)}`
        : interval(e()!.dataStart, e()!.dataEnd).toUpperCase(),
      e()!.locatie?.toUpperCase(),
    ]
      .filter(Boolean)
      .join(" · ");
  const pila = () =>
    e()!.plata?.intarziat
      ? "Întârziat"
      : e()!.azi
        ? "Azi"
        : e()!.zilePanaLa > 1
          ? `în ${e()!.zilePanaLa} zile`
          : undefined;

  return (
    <div
      style={{
        flex: 1,
        "min-width": 0,
        "overflow-y": "auto",
        background: C.fundal,
      }}
    >
      <Show
        when={e()}
        fallback={
          <div style={{ padding: "12px 16px" }}>
            <Show when={!experiente.isLoading} fallback={<Incarcare />}>
              <Inapoi laApasare={inapoi} />
            </Show>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "10px",
            padding:
              "calc(8px + env(safe-area-inset-top)) 12px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              padding: "14px 14px 18px",
              "border-radius": "32px",
              background: C.roz,
              "box-shadow": "0 8px 18px rgba(255,168,205,0.7)",
              color: C.text,
            }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "40px",
              }}
            >
              <Inapoi laApasare={inapoi} />
              <Show when={pila()}>
                <span
                  style={{
                    padding: "6px 12px",
                    "border-radius": "999px",
                    background: e()!.plata?.intarziat ? C.rosu : C.galben,
                    color: e()!.plata?.intarziat ? C.peNegru : C.text,
                    "font-size": "12px",
                    "font-weight": 800,
                  }}
                >
                  {pila()}
                </span>
              </Show>
            </div>
            <div
              style={{
                "font-size": "12px",
                "font-weight": 800,
                "letter-spacing": "0.72px",
              }}
            >
              {sus()}
            </div>
            <h1 style={{ ...deFonte(40, 38), margin: "4px 0 0" }}>
              {e()!.titlu}
            </h1>
            <Show when={e()!.qr}>
              {(cod) => (
                <>
                  <button
                    type="button"
                    onClick={() => setQrMare(true)}
                    style={{
                      ...BUTON,
                      background: C.negru,
                      color: C.peNegru,
                      gap: "8px",
                      "margin-top": "16px",
                    }}
                  >
                    <IconQR size={18} /> Acces QR
                  </button>
                  <Show when={qrMare()}>
                    <QrMare
                      cod={cod()}
                      titlu={e()!.titlu}
                      laInchidere={() => setQrMare(false)}
                    />
                  </Show>
                </>
              )}
            </Show>
          </div>

          <Show when={e()!.progres}>
            {(pr) => (
              <div style={CARD}>
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                  }}
                >
                  <span
                    style={{
                      color: C.stins,
                      "font-size": "12px",
                      "font-weight": 800,
                      "letter-spacing": "0.6px",
                    }}
                  >
                    {pr().nrTranse > 1
                      ? `PLATĂ · ${pr().nrTranse} RATE`
                      : "PLATĂ INTEGRALĂ"}
                  </span>
                  <span style={{ "font-size": "13px", "font-weight": 800 }}>
                    {lei(pr().platit).replace(" lei", "")} / {lei(pr().total)}
                  </span>
                </div>
                <Show when={pr().nrTranse > 1}>
                  <BaraRate progres={pr()} />
                </Show>
                <Show
                  when={e()!.plata}
                  fallback={
                    <div style={{ ...DETALIU, "margin-top": "12px" }}>
                      Totul e plătit.
                    </div>
                  }
                >
                  {(p) => (
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "12px",
                        "margin-top": "12px",
                      }}
                    >
                      <div style={{ flex: 1, "min-width": 0 }}>
                        <div
                          style={{ "font-size": "16px", "font-weight": 800 }}
                        >
                          {p().actiune === "contract"
                            ? "Contractul"
                            : `${p().actiune === "integral" ? "Plata" : `Rata ${p().numarTransa}`} · ${lei(p().suma)}`}
                        </div>
                        <div
                          style={{
                            ...DETALIU,
                            color: p().intarziat ? C.rosu : C.stins,
                          }}
                        >
                          {p().actiune === "contract"
                            ? "semnează-l ca să-ți păstrezi locul"
                            : p().scadentaLa
                              ? `scadentă ${ziScurta(p().scadentaLa!)}`
                              : "de plătit"}
                        </div>
                      </div>
                      {/* „Plătește" e galben în 20d: plățile scadente sunt galbene. */}
                      <ButonPlateste
                        plata={p()}
                        progres={pr()}
                        buton={(deschide) => (
                          <button
                            type="button"
                            onClick={deschide}
                            style={{ ...BUTON, background: C.galben }}
                          >
                            {p().actiune === "contract"
                              ? "Semnează"
                              : "Plătește"}
                          </button>
                        )}
                      />
                    </div>
                  )}
                </Show>
              </div>
            )}
          </Show>

          <Show when={e()!.fel !== "workshop"}>
            <div style={{ ...CARD, padding: "6px" }}>
              <Show when={e()!.fel === "camp"}>
                <Rand
                  text="Program și sesiuni"
                  laApasare={() => navigate(`/cont/tabara/${e()!.id}`)}
                  cuLinie
                />
              </Show>
              <Rand
                text="Plăți și documente"
                detaliu="Contract · Factură"
                laApasare={() => navigate("/cont/plati")}
              />
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

const CARD: JSX.CSSProperties = {
  padding: "16px",
  "border-radius": "28px",
  background: C.foaie,
  color: C.text,
};

const DETALIU: JSX.CSSProperties = {
  "margin-top": "1px",
  color: C.stins,
  "font-size": "12px",
};

const BUTON: JSX.CSSProperties = {
  display: "inline-flex",
  "align-items": "center",
  padding: "12px 18px",
  border: 0,
  "border-radius": "999px",
  color: C.text,
  "font-family": "inherit",
  "font-size": "14px",
  "font-weight": 800,
  cursor: "pointer",
};

function Inapoi(props: { laApasare: () => void }) {
  return (
    <button
      type="button"
      aria-label="Înapoi"
      onClick={props.laApasare}
      style={{ ...CERC_40, width: "44px", height: "44px", background: "#fff" }}
    >
      <IconInapoi />
    </button>
  );
}

function Rand(props: {
  text: string;
  detaliu?: string;
  laApasare: () => void;
  cuLinie?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.laApasare}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        width: "100%",
        padding: "14px 12px",
        border: 0,
        "border-bottom": props.cuLinie ? `1px solid ${C.linie}` : 0,
        background: "transparent",
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <span style={{ flex: 1, "font-size": "15px", "font-weight": 600 }}>
        {props.text}
      </span>
      <Show when={props.detaliu}>
        <span style={{ color: C.slab, "font-size": "14px" }}>
          {props.detaliu}
        </span>
      </Show>
      <span style={{ color: C.slab, display: "flex" }}>
        <Symbol size={16}>chevron_right</Symbol>
      </span>
    </button>
  );
}
