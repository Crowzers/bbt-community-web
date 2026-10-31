import { For, JSX, Show, createSignal } from "solid-js";

import { QRCodeSVG } from "solid-qr-code";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";
import { LOC_PASTILA } from "../PastilaDeJos";
import {
  IconBilet,
  TITLU_PAGINA,
  UN_RAND,
  deFonte,
  interval,
  lunaScurta,
  ziScurta,
} from "../telefon";

import { lei, ora, useExperiente } from "./date";
import { QrMare } from "./Experiente";
import { ButonPlateste } from "./Plata";
import type { Experienta, PlataExperienta } from "./tipuri";
import { C, Incarcare } from "./ui";

/**
 * BBT: tab-ul Experiențe pe telefon (macheta 19c; starea goală din 18h), copia ecranului
 * `mobil/src/app/(tabs)/experiente.tsx`, cu măsurile de acolo. Primul card e evenimentul cel mai apropiat, mare și roz,
 * cu QR-ul pe el când are bilet; dedesubt restul, pe gri; apoi drumul spre site și trecutele, ca rând pe orizontală.
 * Desktopul rămâne pe 23b (`Experiente.tsx`).
 *
 * Ce e altfel decât în aplicație, dinadins:
 * - Fără „merge și offline": nu e adevărat în browser (ca în `Experiente.tsx`).
 * - Tap pe card: tabăra își deschide pagina, cursul duce la Plăți; workshopul are totul pe card (QR-ul).
 */
export function ExperienteTelefon() {
  const experiente = useExperiente();
  const date = () => experiente.data;
  const gol = () =>
    date()?.active.length === 0 && date()?.trecute.length === 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        "overflow-y": "auto",
        background: C.fundal,
      }}
    >
      <Show
        when={!experiente.isError || date()}
        fallback={
          <div style={CENTRU}>
            <p
              style={{
                margin: 0,
                color: C.stins,
                "font-size": "16px",
                "text-align": "center",
              }}
            >
              Experiențele nu se încarcă acum.
            </p>
            <button
              type="button"
              onClick={() => void experiente.refetch()}
              style={{ ...BUTON_NEGRU, "margin-top": "18px" }}
            >
              Încearcă din nou
            </button>
          </div>
        }
      >
        <Show when={date()} fallback={<Incarcare />}>
          <Show
            when={!gol()}
            fallback={
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  height: "100%",
                  "padding-top": "calc(env(safe-area-inset-top) + 8px)",
                  "box-sizing": "border-box",
                }}
              >
                {/* 20h: titlul mare rămâne sus și pe ecranul gol. */}
                <h1 style={{ ...TITLU, margin: "0 14px 4px" }}>
                  Experiențele
                  <br />
                  tale
                </h1>
                <Gol />
              </div>
            }
          >
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "12px",
                padding:
                  "calc(env(safe-area-inset-top) + 8px) 14px " + LOC_PASTILA,
              }}
            >
              <h1 style={TITLU}>
                Experiențele
                <br />
                tale
              </h1>

              <For each={date()!.active}>
                {(e, i) =>
                  i() === 0 ? <CardPrincipal e={e} /> : <CardGri e={e} />
                }
              </For>

              <a
                href={`${BBT_SITE_URL}/camps`}
                target="_blank"
                rel="noopener"
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                  padding: "4px 6px",
                  "text-decoration": "none",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: C.stins,
                    "font-size": "14px",
                    "line-height": "19px",
                  }}
                >
                  Înscrie-te la următoarea experiență BBT pe website.
                </span>
                <span
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "3px",
                    color: C.text,
                    "font-size": "14px",
                    "font-weight": 800,
                    "white-space": "nowrap",
                  }}
                >
                  Vezi site <Symbol size={14}>arrow_outward</Symbol>
                </span>
              </a>

              <Show when={date()!.trecute.length > 0}>
                <div
                  style={{
                    padding: "6px 6px 0",
                    color: C.slab,
                    "font-size": "12px",
                    "font-weight": 800,
                    "letter-spacing": "0.6px",
                  }}
                >
                  TRECUTE
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    margin: "0 -14px",
                    padding: "0 14px",
                    "overflow-x": "auto",
                    "scrollbar-width": "none",
                  }}
                >
                  <For each={date()!.trecute}>
                    {(e) => (
                      <div
                        style={{
                          "flex-shrink": 0,
                          "max-width": "220px",
                          padding: "12px 16px",
                          "box-sizing": "border-box",
                          "border-radius": "18px",
                          background: C.foaie,
                        }}
                      >
                        <div
                          style={{
                            ...UN_RAND,
                            color: C.text,
                            "font-size": "15px",
                            "font-weight": 800,
                          }}
                        >
                          {e.titlu}
                        </div>
                        <div
                          style={{
                            "margin-top": "1px",
                            color: C.slab,
                            "font-size": "12px",
                          }}
                        >
                          {lunaScurta(e.dataStart)}
                          {e.areDiploma ? " · diplomă" : ""}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}

const TITLU: JSX.CSSProperties = {
  ...TITLU_PAGINA,
  padding: "0 6px",
  "margin-bottom": "4px",
};

const CENTRU: JSX.CSSProperties = {
  flex: 1,
  height: "100%",
  display: "flex",
  "flex-direction": "column",
  "align-items": "center",
  "justify-content": "center",
  padding: `0 32px ${LOC_PASTILA}`,
  "box-sizing": "border-box",
};

const BUTON_NEGRU: JSX.CSSProperties = {
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  gap: "6px",
  padding: "12px 18px",
  border: 0,
  "border-radius": "999px",
  background: C.negru,
  color: C.peNegru,
  "font-family": "inherit",
  "font-size": "14px",
  "font-weight": 800,
  "text-decoration": "none",
  cursor: "pointer",
};

/** Eticheta de sus a cardului: „AZI · 19:00 · CONTROL CLUB", „MÂINE · 18:00 · …" sau „12-19 DEC · SINAIA". */
function cand(e: Experienta) {
  const timp = e.azi
    ? `AZI · ${ora(e.dataStart)}`
    : e.zilePanaLa === 1
      ? `MÂINE · ${ora(e.dataStart)}`
      : interval(e.dataStart, e.dataEnd).toUpperCase();
  return [timp, e.locatie?.toUpperCase()].filter(Boolean).join(" · ");
}

/** Pilula din colț: „Plătit" (negru), „Întârziat" (roșu) sau „în N zile" (galben). */
function Stare(props: { e: Experienta }) {
  const pila = () => {
    const e = props.e;
    if (e.plata?.intarziat)
      return { text: "Întârziat", fundal: C.rosu, culoare: C.peNegru };
    if (!e.plata && (!e.progres || e.progres.platit >= e.progres.total))
      return { text: "Plătit", fundal: C.negru, culoare: C.peNegru };
    if (e.zilePanaLa > 1)
      return {
        text: `în ${e.zilePanaLa} zile`,
        fundal: C.galben,
        culoare: C.text,
      };
    return undefined;
  };
  return (
    <Show when={pila()}>
      {(p) => (
        <span
          style={{
            "flex-shrink": 0,
            padding: "5px 11px",
            "border-radius": "999px",
            background: p().fundal,
            color: p().culoare,
            "font-size": "12px",
            "font-weight": 800,
            "white-space": "nowrap",
          }}
        >
          {p().text}
        </span>
      )}
    </Show>
  );
}

/** Bara ratelor: câte o bucată pe rată, verde când e plătită. Se socotește din bani, ca în `mobil/src/cont/BaraRate.tsx`. */
function BaraRate(props: { progres: NonNullable<Experienta["progres"]> }) {
  const platite = () => {
    const peRata = props.progres.total / Math.max(1, props.progres.nrTranse);
    return Math.min(
      props.progres.nrTranse,
      Math.floor(props.progres.platit / peRata + 0.001),
    );
  };
  return (
    <div style={{ display: "flex", gap: "4px", "margin-top": "12px" }}>
      <For each={Array.from({ length: props.progres.nrTranse }, (_, i) => i)}>
        {(i) => (
          <div
            style={{
              flex: 1,
              height: "6px",
              "border-radius": "3px",
              background: i < platite() ? C.verdeBara : "rgba(10,10,11,0.1)",
            }}
          />
        )}
      </For>
    </div>
  );
}

/** Rata de plătit și butonul negru (19c). La contract nesemnat, butonul duce la semnătură, nu la plată. */
function RandPlata(props: { e: Experienta; plata: PlataExperienta }) {
  const contract = () => props.plata.actiune === "contract";
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        "margin-top": "14px",
      }}
    >
      <div style={{ flex: 1, "min-width": 0 }}>
        <div style={{ color: C.text, "font-size": "16px", "font-weight": 800 }}>
          {contract()
            ? "Contractul"
            : `${props.plata.actiune === "integral" ? "Plata" : `Rata ${props.plata.numarTransa}`} · ${lei(props.plata.suma)}`}
        </div>
        <div
          style={{
            "margin-top": "1px",
            color: props.plata.intarziat ? C.rosu : C.stins,
            "font-size": "13px",
          }}
        >
          {contract()
            ? "semnează-l ca să-ți păstrezi locul"
            : props.plata.scadentaLa
              ? `${props.plata.intarziat ? "întârziată, scadentă" : "scadentă"} ${ziScurta(props.plata.scadentaLa)}`
              : "de plătit"}
        </div>
      </div>
      <span onClick={(ev) => ev.stopPropagation()}>
        <ButonPlateste
          plata={props.plata}
          progres={props.e.progres}
          buton={(deschide) => (
            <button
              type="button"
              onClick={deschide}
              style={{ ...BUTON_NEGRU, padding: "11px 18px" }}
            >
              {contract() ? "Semnează" : "Plătește"}
            </button>
          )}
        />
      </span>
    </div>
  );
}

/** Tap pe card = pagina taberei; un curs n-are pagină pe hub, deci duce la plățile lui. */
function useDeschide(e: () => Experienta) {
  const navigate = useNavigate();
  return () => {
    if (e().fel === "camp") navigate(`/cont/tabara/${e().id}`);
    else if (e().fel === "curs") navigate("/cont/plati");
  };
}

function CardPrincipal(props: { e: Experienta }) {
  const client = useClient();
  const deschide = useDeschide(() => props.e);
  const [qrMare, setQrMare] = createSignal(false);
  return (
    <div
      onClick={deschide}
      style={{
        padding: "18px",
        "border-radius": "32px",
        background: C.roz,
        // Umbra colorată din 19: cardul de azi plutește în rozul lui.
        "box-shadow": "0 8px 18px rgba(255,179,217,0.7)",
        color: C.text,
      }}
    >
      <RandSus e={props.e} />
      <h2 style={{ ...deFonte(26, 28), margin: "6px 0 0" }}>{props.e.titlu}</h2>

      <Show when={props.e.qr}>
        {(cod) => (
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "14px",
              "margin-top": "14px",
            }}
          >
            {/* Fundal ALB sub cod, oricât de colorat ar fi cardul: scanerele citesc prost un QR pe roz. */}
            <button
              type="button"
              aria-label="Mărește QR-ul"
              onClick={(ev) => {
                ev.stopPropagation();
                setQrMare(true);
              }}
              style={{
                display: "flex",
                padding: "7px",
                border: 0,
                "border-radius": "18px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <QRCodeSVG
                value={cod()}
                level="medium"
                width={140}
                height={140}
                backgroundColor="white"
                foregroundColor="black"
                backgroundAlpha={1}
                foregroundAlpha={1}
              />
            </button>
            <div
              style={{
                flex: 1,
                "min-width": 0,
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <div style={{ "font-size": "16px", "font-weight": 800 }}>
                {client().user?.displayName ?? ""}
              </div>
              <div style={{ color: C.stins, "font-size": "12px" }}>
                Acces {cod()}
              </div>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setQrMare(true);
                }}
                style={{ ...BUTON_NEGRU, "margin-top": "10px" }}
              >
                Mărește QR
              </button>
            </div>
            <Show when={qrMare()}>
              <QrMare
                cod={cod()}
                titlu={props.e.titlu}
                laInchidere={() => setQrMare(false)}
              />
            </Show>
          </div>
        )}
      </Show>

      <Show when={props.e.progres && props.e.progres.nrTranse > 1}>
        <BaraRate progres={props.e.progres!} />
      </Show>
      <Show when={props.e.plata}>
        {(p) => <RandPlata e={props.e} plata={p()} />}
      </Show>
    </div>
  );
}

function RandSus(props: { e: Experienta }) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "10px",
      }}
    >
      <span
        style={{
          ...UN_RAND,
          flex: 1,
          color: C.text,
          "font-size": "12px",
          "font-weight": 800,
          "letter-spacing": "0.6px",
        }}
      >
        {cand(props.e)}
      </span>
      <Stare e={props.e} />
    </div>
  );
}

function CardGri(props: { e: Experienta }) {
  const deschide = useDeschide(() => props.e);
  const [qrMare, setQrMare] = createSignal(false);
  return (
    <div
      onClick={deschide}
      style={{
        padding: "18px",
        "border-radius": "32px",
        background: C.foaie,
        color: C.text,
      }}
    >
      <RandSus e={props.e} />
      <h2 style={{ ...deFonte(22), margin: "4px 0 0" }}>{props.e.titlu}</h2>
      <Show when={props.e.progres && props.e.progres.nrTranse > 1}>
        <BaraRate progres={props.e.progres!} />
      </Show>
      <Show when={props.e.plata}>
        {(p) => <RandPlata e={props.e} plata={p()} />}
      </Show>
      <Show when={props.e.qr}>
        {(cod) => (
          <>
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                setQrMare(true);
              }}
              style={{ ...BUTON_NEGRU, width: "100%", "margin-top": "10px" }}
            >
              Arată QR
            </button>
            <Show when={qrMare()}>
              <QrMare
                cod={cod()}
                titlu={props.e.titlu}
                laInchidere={() => setQrMare(false)}
              />
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}

/** 18h: contul fără nicio experiență. Starea goală a ecranului, mare, cu drumul spre site. */
function Gol() {
  return (
    <div style={CENTRU}>
      {/* 20h: plăcuța de 120 cu raza 40, umbra roz, textul 14. */}
      <div
        style={{
          width: "120px",
          height: "120px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "40px",
          background: C.roz,
          "box-shadow": "0 8px 18px rgba(255,179,217,0.7)",
          color: C.text,
        }}
      >
        <IconBilet size={44} />
      </div>
      <h2
        style={{
          ...deFonte(28),
          margin: "18px 0 0",
          color: C.text,
        }}
      >
        Încă nimic aici
      </h2>
      <p
        style={{
          margin: "8px 0 0",
          color: C.stins,
          "font-size": "14px",
          "line-height": "20px",
          "text-align": "center",
        }}
      >
        Înscrie-te la următoarea experiență BBT pe website. După înscriere,
        accesul și detaliile apar aici.
      </p>
      <a
        href={`${BBT_SITE_URL}/camps`}
        target="_blank"
        rel="noopener"
        style={{ ...BUTON_NEGRU, "margin-top": "18px", padding: "12px 22px" }}
      >
        Vezi site <Symbol size={15}>arrow_outward</Symbol>
      </a>
    </div>
  );
}
