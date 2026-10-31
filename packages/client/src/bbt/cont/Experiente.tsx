import { For, JSX, Show, createSignal } from "solid-js";

import { QRCodeSVG } from "solid-qr-code";

import { useNavigate } from "@revolt/routing";

import { BBT_SITE_URL } from "../config";

import { lei, ora, useCont, useExperiente, zi, zileRo } from "./date";
import { Gol } from "./ExperienteTelefon";
import { ButonPlateste } from "./Plata";
import type { Experienta } from "./tipuri";
import {
  Buton,
  C,
  Fereastra,
  FileActivIstoric,
  Incarcare,
  Mesaj,
  Pastila,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Experiențe" și, cu `fel`, My Camps, My Workshops și My Courses din meniul Profilului, pe desktop și tabletă: același card
 * pentru tabere, cursuri și workshopuri. Pe telefon, `ExperienteTelefon.tsx`.
 *
 * Lista vine gata făcută din `participant/experiente` (`useExperiente`): ce e activ, ce s-a terminat, ce mai e de
 * plătit și QR-ul biletului. Hub-ul doar o desenează.
 *
 * Ce e altfel decât în 23b, dinadins:
 * - Fără „Trimite pe telefon": aplicația de telefon n-are încă notificări de la noi.
 * - Fără „# 4 canale": canalele taberei stau în Community, iar un număr fără drum spre ele n-ar ajuta.
 * - Fără „QR-ul merge offline": nu e adevărat în hub.
 */
export function Experiente(props: {
  /** My Camps, My Workshops, My Courses din meniul Profilului (ca pe site): doar experiențele de felul ăsta. */
  fel?: "camp" | "workshop" | "curs";
  titlu?: string;
}) {
  const experiente = useExperiente();
  const alFelului = (e: { fel: string }) => !props.fel || e.fel === props.fel;
  const active = () => (experiente.data?.active ?? []).filter(alFelului);
  const trecute = () => (experiente.data?.trecute ?? []).filter(alFelului);

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
        {props.titlu ?? "Experiențe"}
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
              fallback={<Gol {...(props.fel ? GOL[props.fel] : {})} />}
            >
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "12px",
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
                  text={
                    props.fel
                      ? ISTORIC_GOL[props.fel]
                      : "Taberele, cursurile și workshopurile la care ai fost apar aici."
                  }
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

/** Culoarea de sub un afiș lipsă. Teritoriul spune unde ești, ca pe site. */
const TERITORIU: Record<Experienta["fel"], string> = {
  camp: C.camps,
  curs: C.lilaDeschis,
  workshop: C.portocaliuDeschis,
};

/** Fiecare pagină își spune lista goală pe numele ei; `Experiențe` rămâne pe textul general. */
const GOL = {
  camp: {
    titlu: "Nicio tabără activă",
    text: "Nu ești înscris la nicio tabără viitoare.",
    link: { cale: "/camps", text: "Explorează taberele" },
  },
  workshop: {
    titlu: "Niciun workshop activ",
    text: "Nu ai bilet la niciun workshop viitor.",
    link: { cale: "/workshops", text: "Vezi workshopurile" },
  },
  curs: {
    titlu: "Niciun curs activ",
    text: "Nu ești înscris la niciun curs.",
    link: { cale: "/cursuri", text: "Vezi cursurile" },
  },
};

const ISTORIC_GOL = {
  camp: "Taberele la care ai fost apar aici.",
  workshop: "Workshopurile la care ai fost apar aici.",
  curs: "Cursurile terminate apar aici.",
};

/** Unde duce fiecare scurtătură în pagina taberei (`Tabara.tsx`). */
const SCURTATURI = [
  { text: "Program", adresa: "?fila=program" },
  { text: "Documente", adresa: "?la=acte" },
  { text: "Cazare", adresa: "?fila=camera" },
];

/** Pastila neagră de pe card: ce ține azi, altfel cât mai e. */
function eticheta(e: Experienta) {
  if (e.azi) return e.fel === "workshop" ? "Azi" : "În desfășurare";
  if (e.zilePanaLa <= 0) return "începe azi";
  return e.zilePanaLa === 1 ? "mâine" : `peste ${zileRo(e.zilePanaLa)}`;
}

/** Aceeași listă ca `STATUSURI_PLATITE` din `admin/lib/reguli/statusuri.ts`: interiorul taberei se deschide doar cu ele. */
const STATUSURI_PLATITE = ["Achitat", "Achitat 1/2", "Achitat 2/2", "Oferta"];

/** Înscrierea din `/me` din spatele cardului: de acolo vin starea, adresa publică și penalizarea. */
function useInscriere(e: () => Experienta) {
  const cont = useCont();
  return () =>
    e().fel === "camp"
      ? cont.data?.inscrieri?.find((i) => i.id === e().comandaId)
      : undefined;
}

/** Afișul de pe card: 56 pe 75, sau numele BBT pe culoarea teritoriului când ediția n-are afiș. */
export function Afis(props: { url?: string | null; fel: Experienta["fel"]; alb?: boolean }) {
  return (
    <div
      style={{
        width: "56px",
        height: "75px",
        "flex-shrink": 0,
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        overflow: "hidden",
        "border-radius": "10px",
        background: TERITORIU[props.fel],
        color: "rgba(10,10,11,0.3)",
        "font-size": "15px",
        "font-weight": 900,
      }}
    >
      <Show when={props.url} fallback="BBT">
        {(url) => (
          <img
            src={url()}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              "object-fit": "cover",
              filter: props.alb ? "grayscale(1)" : undefined,
            }}
          />
        )}
      </Show>
    </div>
  );
}

const STARI = {
  verde: { bg: C.verdeDeschis, text: C.verde },
  galben: { bg: C.galbenDeschis, text: C.chihlimbar },
  rosu: { bg: C.rosuDeschis, text: C.rosu },
};

export function Stare(props: { fel: keyof typeof STARI; children: JSX.Element }) {
  return (
    <span
      style={{
        "white-space": "nowrap",
        padding: "4px 10px",
        "border-radius": "999px",
        background: STARI[props.fel].bg,
        color: STARI[props.fel].text,
        "font-size": "12px",
        "font-weight": 600,
      }}
    >
      {props.children}
    </span>
  );
}

/**
 * Cardul de pe site (`CardCamp` din `website/src/app/dashboard/mycamps/page.tsx`, varianta aleasă de user pe 23 oct 2026), adus
 * aici pe 31 oct: afișul, starea și titlul sus, iar jos o singură bandă albă cu plata și butoanele.
 *
 * ⚠️ „Intră în tabără" apare doar la tabăra în desfășurare. Interiorul cere înscriere PLĂTITĂ, deci o înscriere încă neplătită
 * duce la pagina publică a taberei, nu la „Nu am putut deschide tabăra".
 */
function CardExperienta(props: { e: Experienta }) {
  const navigate = useNavigate();
  const e = () => props.e;
  const inscriere = useInscriere(e);
  const [qrMare, setQrMare] = createSignal(false);

  const faraInterior = () => {
    const i = inscriere();
    return !!i && !STATUSURI_PLATITE.includes(i.statusPlata);
  };
  const paginaPublica = () => {
    const slug = inscriere()?.camp.slug;
    return faraInterior() && slug ? `${BBT_SITE_URL}/camps/${slug}` : undefined;
  };
  const deschide = (rest = "") => navigate(`/cont/tabara/${e().id}${rest}`);

  const pr = () => e().progres;
  // Oferta de 100% n-are progres: omul nu mai datorează nimic.
  const faraPlata = () => e().fel !== "workshop" && !pr() && !e().plata;
  const complet = () =>
    faraPlata() || (!!pr() && pr()!.total > 0 && pr()!.platit >= pr()!.total);
  const procent = () =>
    complet()
      ? 100
      : pr() && pr()!.total > 0
        ? Math.min(100, Math.round((pr()!.platit / pr()!.total) * 100))
        : 0;
  const penalizare = () =>
    e().plata?.actiune === "transa2"
      ? (inscriere()?.penalizareTransa2 ?? 0)
      : 0;

  const stare = () => {
    const p = e().plata;
    if (complet()) return <Stare fel="verde">{faraPlata() ? "Confirmat" : "Plătit"}</Stare>;
    if (p?.actiune === "contract") return <Stare fel="galben">Contract de semnat</Stare>;
    if (p?.intarziat) return <Stare fel="rosu">Întârziată</Stare>;
    if (p?.scadentaLa) return <Stare fel="galben">Scadent {zi(p.scadentaLa)}</Stare>;
    return <Stare fel="galben">În așteptare</Stare>;
  };

  return (
    <article
      style={{ padding: "10px", "border-radius": "20px", background: C.foaie }}
    >
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "12px",
        }}
      >
        <Afis url={e().afisUrl ?? inscriere()?.camp.imgUrl} fel={e().fel} />
        <div
          style={{
            flex: "1 1 240px",
            "min-width": 0,
            display: "flex",
            "flex-direction": "column",
            "align-items": "flex-start",
            gap: "4px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              "align-items": "center",
              gap: "6px",
              padding: "2px 10px",
              "border-radius": "999px",
              background: C.negru,
              color: C.peNegru,
              "font-size": "12px",
              "font-weight": 600,
              "white-space": "nowrap",
            }}
          >
            <Show when={e().azi}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  "border-radius": "3px",
                  background: C.verdeBara,
                }}
              />
            </Show>
            {eticheta(e())}
          </span>
          <h2
            style={{
              margin: 0,
              "font-size": "20px",
              "font-weight": 700,
              "line-height": "1.15",
            }}
          >
            {e().titlu}
          </h2>
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            {[antet(e()), inscriere()?.camp.durataText, FEL[e().fel]]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {/* Scurtăturile din 23b, spre locul lor din pagina taberei (23e). */}
        <Show when={e().fel === "camp" && !faraInterior()}>
          <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
            <For each={SCURTATURI}>
              {(s) => (
                <button
                  type="button"
                  onClick={() => deschide(s.adresa)}
                  style={{
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
                  {s.text}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "12px",
          "margin-top": "10px",
          padding: "8px 8px 8px 14px",
          "border-radius": "10px",
          background: C.fundal,
        }}
      >
        <Show
          when={e().qr}
          fallback={
            <div
              style={{
                flex: "1 1 260px",
                "min-width": 0,
                display: "flex",
                "flex-direction": "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "space-between",
                  gap: "8px",
                  "font-size": "13px",
                }}
              >
                <Show
                  when={!faraPlata()}
                  fallback={
                    <b style={{ "font-weight": 700 }}>Nu ai nimic de plătit</b>
                  }
                >
                  <span style={{ "white-space": "nowrap" }}>
                    <b style={{ "font-weight": 700 }}>
                      {(pr()?.platit ?? 0).toLocaleString("ro-RO")}
                    </b>{" "}
                    <span style={{ color: C.stins }}>
                      din {lei(pr()?.total ?? e().plata?.suma ?? 0)}
                    </span>
                  </span>
                </Show>
                {stare()}
              </div>
              <div
                role="progressbar"
                aria-label="Cât ai plătit din total"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={procent()}
                style={{
                  height: "6px",
                  overflow: "hidden",
                  "border-radius": "3px",
                  background: C.foaie,
                }}
              >
                <div
                  style={{
                    width: `${procent()}%`,
                    height: "100%",
                    background: complet() ? C.verdeBara : C.roz,
                  }}
                />
              </div>
              {/* Suma de pe buton include deja penalizarea; aici omul vede de unde vine diferența. */}
              <Show when={penalizare() > 0}>
                <p style={{ margin: 0, color: C.rosu, "font-size": "14px" }}>
                  Include penalizarea de întârziere: {lei(penalizare())}
                  <Show when={(inscriere()?.zileIntarziereTransa2 ?? 0) > 0}>
                    {" "}
                    ({inscriere()!.zileIntarziereTransa2}{" "}
                    {inscriere()!.zileIntarziereTransa2 === 1 ? "zi" : "zile"} ×
                    1%/zi din tranșă)
                  </Show>
                  .
                </p>
              </Show>
            </div>
          }
        >
          {(cod) => (
            <div
              style={{
                flex: "1 1 260px",
                "min-width": 0,
                display: "flex",
                "align-items": "center",
                gap: "12px",
              }}
            >
              <QRCodeSVG
                value={cod()}
                level="medium"
                width={64}
                height={64}
                backgroundColor="white"
                foregroundColor="black"
                backgroundAlpha={1}
                foregroundAlpha={1}
              />
              <div style={{ "min-width": 0 }}>
                <p style={{ margin: 0, "font-size": "14px", "font-weight": 800 }}>
                  Acces #{cod()}
                </p>
                <p style={{ margin: "2px 0 0", color: C.stins, "font-size": "14px" }}>
                  Arată codul la intrare.
                </p>
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

        {/* Lățime fixă, aliniată la dreapta: așa barele se termină în același punct pe toate cardurile. */}
        <div
          style={{
            flex: "0 1 288px",
            display: "flex",
            "flex-wrap": "wrap",
            "justify-content": "flex-end",
            gap: "6px",
          }}
        >
          <Show when={e().qr}>
            <Buton mic onClick={() => setQrMare(true)}>
              Mărește QR
            </Buton>
          </Show>
          <Show when={e().plata}>
            {(p) => <ButonPlateste mic plata={p()} progres={pr()} />}
          </Show>
          <Show when={e().fel === "camp"}>
            <Show
              when={e().azi && !faraInterior()}
              fallback={
                <Buton
                  piele="alb"
                  mic
                  href={paginaPublica()}
                  target={paginaPublica() ? "_blank" : undefined}
                  onClick={paginaPublica() ? undefined : () => deschide()}
                >
                  Vezi detalii
                </Buton>
              }
            >
              <Buton mic onClick={() => deschide()}>
                Intră în tabără
              </Buton>
            </Show>
          </Show>
        </div>
      </div>
    </article>
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
  const inscriere = useInscriere(e);
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "14px",
        padding: "10px",
        "border-radius": "20px",
        background: C.foaie,
      }}
    >
      <Afis url={e().afisUrl ?? inscriere()?.camp.imgUrl} fel={e().fel} alb />
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
      <Pastila fel="neutru">Participat</Pastila>
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
          Vezi detalii
        </Buton>
      </Show>
    </div>
  );
}
