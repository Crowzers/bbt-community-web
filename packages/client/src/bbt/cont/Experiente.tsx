import { For, Show, createSignal } from "solid-js";

import { QRCodeSVG } from "solid-qr-code";

import { useNavigate } from "@revolt/routing";

import { BBT_SITE_URL } from "../config";

import { lei, ora, useExperiente, zi } from "./date";
import { ButonPlateste } from "./Plata";
import type { Experienta } from "./tipuri";
import {
  Buton,
  C,
  DE_FONTE,
  Eticheta,
  Fereastra,
  FileActivIstoric,
  Incarcare,
  Mesaj,
  Pastila,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Experiențele mele" (23b, 23c, 30 oct 2026). Înlocuiește My Camps, My Workshops și My Courses: un singur card
 * pentru tabere, cursuri și workshopuri, cum e tab-ul Experiențe din aplicația de telefon.
 *
 * Lista vine gata făcută din `participant/experiente` (`useExperiente`): ce e activ, ce s-a terminat, ce mai e de
 * plătit și QR-ul biletului. Hub-ul doar o desenează.
 *
 * Ce e altfel decât în 23b, dinadins:
 * - Fără „Trimite pe telefon": aplicația de telefon n-are încă notificări de la noi.
 * - Fără „# 4 canale": canalele taberei stau în Community, iar un număr fără drum spre ele n-ar ajuta.
 * - Fără „QR-ul merge offline": nu e adevărat în hub.
 * - Cardul e roz doar pentru ce ține AZI (workshopul din seara asta, tabăra în curs), ca bannerul „Azi" din aplicație.
 *   Restul e gri: rozul ar fi încetat să spună ceva dacă era pe toate.
 */
export function Experiente() {
  const experiente = useExperiente();
  const active = () => experiente.data?.active ?? [];
  const trecute = () => experiente.data?.trecute ?? [];

  return (
    <>
      <TitluPagina
        dreapta={
          <Show when={active().length}>
            <div
              style={{ display: "flex", "align-items": "center", gap: "14px" }}
            >
              <span style={{ color: C.stins, "font-size": "14px" }}>
                Înscrie-te la următoarea experiență BBT pe website.
              </span>
              <Buton piele="alb" mic href={BBT_SITE_URL} target="_blank">
                Vezi site ↗
              </Buton>
            </div>
          </Show>
        }
      >
        Experiențele mele
      </TitluPagina>
      <Show when={experiente.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca experiențele tale. Încearcă din nou peste un
          minut.
        </Mesaj>
      </Show>
      <Show when={!experiente.isLoading} fallback={<Incarcare />}>
        <FileActivIstoric
          active={() => (
            <Show
              when={active().length}
              fallback={
                <StareGoala
                  roz
                  titlu="Încă nimic aici"
                  text="Înscrie-te la următoarea experiență BBT pe website. După înscriere, accesul și detaliile apar aici."
                  link={{ href: BBT_SITE_URL, text: "Vezi site ↗" }}
                />
              }
            >
              <div
                style={{
                  display: "grid",
                  "grid-template-columns":
                    // `auto-fit`: două carduri umplu rândul, ca în 23b (cu `auto-fill` rămânea un loc gol).
                    "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
                  gap: "14px",
                }}
              >
                <For each={active()}>{(e) => <CardExperienta e={e} />}</For>
              </div>
            </Show>
          )}
          istoric={() => (
            <Show
              when={trecute().length}
              fallback={
                <StareGoala
                  titlu="Niciun istoric încă"
                  text="Taberele, cursurile și workshopurile la care ai fost apar aici."
                />
              }
            >
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "10px",
                }}
              >
                <For each={trecute()}>{(e) => <RandIstoric e={e} />}</For>
              </div>
            </Show>
          )}
        />
      </Show>
    </>
  );
}

/** „12–19 DEC · SINAIA" sau „AZI · 19:00 · CONTROL CLUB" (23b). */
function antet(e: Experienta) {
  const loc = e.locatie ? ` · ${e.locatie}` : "";
  if (e.fel === "workshop") {
    return `${e.azi ? "Azi" : zi(e.dataStart)} · ${ora(e.dataStart)}${loc}`;
  }
  return `${perioada(e.dataStart, e.dataEnd)}${loc}`;
}

/** „12-19 dec." în aceeași lună, „28 nov. - 3 dec." peste lună, o zi singură când începe și se termină în aceeași. */
export function perioada(start: string, sfarsit: string | null) {
  if (!sfarsit || zi(sfarsit) === zi(start)) return zi(start);
  const [z1, ...luna1] = zi(start).split(" ");
  const [z2, ...luna2] = zi(sfarsit).split(" ");
  return luna1.join(" ") === luna2.join(" ")
    ? `${z1}-${z2} ${luna2.join(" ")}`
    : `${zi(start)} - ${zi(sfarsit)}`;
}

const FEL: Record<Experienta["fel"], string> = {
  camp: "Tabără",
  curs: "Curs",
  workshop: "Workshop",
};

function CardExperienta(props: { e: Experienta }) {
  const navigate = useNavigate();
  const e = () => props.e;
  const [qrMare, setQrMare] = createSignal(false);
  const paginaTaberei = () => `/cont/tabara/${e().id}`;
  const deschide = () => navigate(paginaTaberei());

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "14px",
        padding: "22px",
        "border-radius": "28px",
        background: e().azi ? C.roz : C.foaie,
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "flex-start",
          "justify-content": "space-between",
          gap: "12px",
        }}
      >
        <div style={{ "min-width": 0 }}>
          <Eticheta culoare={C.text}>{antet(e())}</Eticheta>
          <Show
            when={e().fel === "camp"}
            fallback={
              <h2
                style={{
                  ...DE_FONTE,
                  margin: "6px 0 0",
                  "font-size": "28px",
                  "line-height": "1.05",
                }}
              >
                {e().titlu}
              </h2>
            }
          >
            {/* Titlul taberei deschide pagina ei, ca „Deschide" (harta din 23). */}
            <a
              href={paginaTaberei()}
              onClick={(ev) => {
                ev.preventDefault();
                deschide();
              }}
              style={{ color: C.text, "text-decoration": "none" }}
            >
              <h2
                style={{
                  ...DE_FONTE,
                  margin: "6px 0 0",
                  "font-size": "28px",
                  "line-height": "1.05",
                }}
              >
                {e().titlu}
              </h2>
            </a>
          </Show>
          <p
            style={{
              margin: "4px 0 0",
              color: e().azi ? C.text : C.stins,
              "font-size": "14px",
            }}
          >
            {FEL[e().fel]}
          </p>
        </div>
        <Show
          when={e().azi}
          fallback={
            <Show when={e().zilePanaLa > 0}>
              <Pastila fel="asteapta">
                {e().zilePanaLa === 1 ? "mâine" : `în ${e().zilePanaLa} zile`}
              </Pastila>
            </Show>
          }
        >
          {/* Workshopul de azi are deja „AZI" în etichetă; pastila spune ce contează la ușă (23b). */}
          <Pastila fel={e().fel === "workshop" ? "negru" : "neutru"}>
            {e().fel === "workshop" ? "Plătit" : "În desfășurare"}
          </Pastila>
        </Show>
      </div>

      {/* Biletul de workshop: QR-ul pe loc, mărit la cerere (23b „Mărește QR"). */}
      <Show when={e().qr}>
        {(cod) => (
          <div
            style={{ display: "flex", "align-items": "center", gap: "16px" }}
          >
            {/* Fundal ALB sub cod, oricât de colorat ar fi cardul: scanerele citesc prost un QR pe roz. */}
            <div
              style={{
                padding: "7px",
                "border-radius": "14px",
                background: "#fff",
                display: "flex",
              }}
            >
              <QRCodeSVG
                value={cod()}
                level="medium"
                width={90}
                height={90}
                backgroundColor="white"
                foregroundColor="black"
                backgroundAlpha={1}
                foregroundAlpha={1}
              />
            </div>
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
                "min-width": 0,
              }}
            >
              <div>
                <p
                  style={{ margin: 0, "font-size": "15px", "font-weight": 800 }}
                >
                  Acces #{cod()}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    color: e().azi ? C.text : C.stins,
                    "font-size": "12px",
                  }}
                >
                  Arată codul la intrare.
                </p>
              </div>
              <div>
                <Buton mic onClick={() => setQrMare(true)}>
                  Mărește QR
                </Buton>
              </div>
            </div>
            <Show when={qrMare()}>
              <QrMare
                cod={cod()}
                titlu={e().titlu}
                laInchidere={() => setQrMare(false)}
              />
            </Show>
          </div>
        )}
      </Show>

      {/* Tabere și cursuri: cât s-a plătit și ce urmează (23b). */}
      <Show when={e().progres}>
        {(pr) => (
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "8px" }}
          >
            <BaraPlata
              platit={pr().platit}
              total={pr().total}
              nrTranse={pr().nrTranse}
            />
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                gap: "12px",
                "flex-wrap": "wrap",
              }}
            >
              <div>
                <Show
                  when={e().plata}
                  fallback={
                    <p
                      style={{
                        margin: 0,
                        "font-size": "15px",
                        "font-weight": 800,
                      }}
                    >
                      Plătit integral
                    </p>
                  }
                >
                  {(p) => (
                    <p
                      style={{
                        margin: 0,
                        "font-size": "15px",
                        "font-weight": 800,
                        color: p().intarziat ? C.rosu : C.text,
                      }}
                    >
                      {p().actiune === "contract"
                        ? "Contract de semnat"
                        : p().actiune === "integral"
                          ? `De plătit · ${lei(p().suma)}`
                          : `Rata ${p().numarTransa} · ${lei(p().suma)}`}
                      <Show when={p().scadentaLa && p().actiune !== "contract"}>
                        {" "}
                        · {zi(p().scadentaLa!)}
                      </Show>
                    </p>
                  )}
                </Show>
                <p
                  style={{
                    margin: "2px 0 0",
                    color: C.stins,
                    "font-size": "12px",
                  }}
                >
                  {pr().platit.toLocaleString("ro-RO")} / {lei(pr().total)}{" "}
                  plătiți
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <Show when={e().plata}>
                  {(p) => <ButonPlateste mic plata={p()} progres={pr()} />}
                </Show>
                <Show when={e().fel === "camp"}>
                  <Buton piele="alb" mic onClick={deschide}>
                    Deschide
                  </Buton>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>

      {/* Oferta de 100% n-are progres: rămâne drumul spre tabără. */}
      <Show when={!e().progres && e().fel === "camp"}>
        <div>
          <Buton piele="alb" mic onClick={deschide}>
            Deschide
          </Buton>
        </div>
      </Show>

      {/* Scurtăturile din 23b spre secțiunile paginii taberei (23e). */}
      <Show when={e().fel === "camp"}>
        <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
          <For each={["Program", "Documente", "Cazare"]}>
            {(t) => (
              <button
                type="button"
                onClick={deschide}
                style={{
                  // 23b: 6 / 12, text gros de 12.
                  height: "28px",
                  padding: "0 12px",
                  "border-radius": "999px",
                  border: "0",
                  background: C.fundal,
                  color: C.text,
                  "font-family": "inherit",
                  "font-size": "12px",
                  "font-weight": 700,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

/**
 * Bara de rate (23b): câte un segment pe rată, verde cât s-a plătit. Plata integrală = un singur segment.
 * Segmentele verzi = partea plătită din total, rotunjită la rate (ratele nu sunt egale, dar nici adminul nu dă suma
 * fiecăreia aici; o rată plătită pe jumătate nu există).
 */
export function BaraPlata(props: {
  platit: number;
  total: number;
  nrTranse?: number;
}) {
  const n = () => Math.max(1, props.nrTranse ?? 1);
  const verzi = () =>
    props.total > 0
      ? Math.min(n(), Math.round((props.platit / props.total) * n()))
      : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={props.total}
      aria-valuenow={props.platit}
      style={{ display: "flex", gap: "5px" }}
    >
      <For each={Array.from({ length: n() }, (_, i) => i)}>
        {(i) => (
          <div
            style={{
              flex: 1,
              height: "8px",
              "border-radius": "4px",
              background: i < verzi() ? C.verdeBara : C.linie,
            }}
          />
        )}
      </For>
    </div>
  );
}

/** QR-ul mare, pe roz, ca ecranul 20c din aplicație. */
export function QrMare(props: {
  cod: string;
  titlu: string;
  laInchidere: () => void;
}) {
  return (
    <Fereastra
      titlu={props.titlu}
      laInchidere={props.laInchidere}
      fundal={C.roz}
      latime={420}
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            padding: "18px",
            "border-radius": "24px",
            background: "#fff",
            display: "flex",
          }}
        >
          <QRCodeSVG
            value={props.cod}
            level="medium"
            width={280}
            height={280}
            backgroundColor="white"
            foregroundColor="black"
            backgroundAlpha={1}
            foregroundAlpha={1}
          />
        </div>
        <p
          style={{
            margin: 0,
            "font-family": "monospace",
            "font-size": "18px",
            "letter-spacing": "0.08em",
          }}
        >
          {props.cod}
        </p>
      </div>
    </Fereastra>
  );
}

function RandIstoric(props: { e: Experienta }) {
  const navigate = useNavigate();
  const e = () => props.e;
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "14px",
        padding: "14px 18px",
        "border-radius": "20px",
        background: C.foaie,
      }}
    >
      <div style={{ "min-width": 0, "flex-grow": 1 }}>
        <p
          style={{
            margin: 0,
            "font-size": "16px",
            "font-weight": 700,
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap",
          }}
        >
          {e().titlu}
        </p>
        <p style={{ margin: "2px 0 0", color: C.stins, "font-size": "14px" }}>
          {FEL[e().fel]} · {antet(e())}
        </p>
      </div>
      <Show when={e().areDiploma}>
        <Buton piele="alb" mic onClick={() => navigate("/cont/diplome")}>
          Diploma
        </Buton>
      </Show>
      <Show when={e().fel === "camp"}>
        <Buton
          piele="alb"
          mic
          onClick={() => navigate(`/cont/tabara/${e().id}`)}
        >
          Deschide
        </Buton>
      </Show>
    </div>
  );
}
