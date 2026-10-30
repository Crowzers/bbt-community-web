import { For, JSX, Match, Show, Switch, createSignal, untrack } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../../config";
import { cerereCont } from "../../tokenBbt";
import {
  inDesfasurare,
  lei,
  reala,
  useCont,
  useExperiente,
  useSesiune,
  zi,
  zilePana,
} from "../date";
import { BaraPlata, perioada } from "../Experiente";
import { ButonPlateste } from "../Plata";
import type { Experienta, Inscriere } from "../tipuri";
import {
  Buton,
  C,
  CampText,
  Card,
  DE_FONTE,
  Eticheta,
  Incarcare,
  Mesaj,
  MesajSalvare,
  Pastila,
  StareGoala,
} from "../ui";

import {
  type ProgramZi,
  etichetaZi,
  parseMeniu,
  parseProgram,
} from "./continut";
import {
  type Coleg,
  type Piesa,
  type SesiunePentruUrcare,
  Playlist,
} from "./Playlist";

/**
 * BBT: pagina unei tabere în hub, `/cont/tabara/:id`. Copia lui `website/src/app/my-camp/[id]/`
 * (`page.tsx` + `MyCampTabs.tsx`). Design: `2026-10-20-hub-standalone-cont-design.md`, Faza 7.
 *
 * 🔥 **Aranjată după 23e** (30 oct 2026): banda roz sus, apoi trei coloane (plata cu actele, programul zilei,
 * camera), iar dedesubt filele de dinainte. Plata e aceeași ca în Experiențele mele (`participant/experiente`).
 * Din 23e lipsesc, dinadins: „Acces QR" (taberele n-au bilet), „# 4 canale" (canalele stau în Community),
 * mentorii numărați și transportul (nu există în date), „Maps" și „Sună hotelul" (camera n-are adresă și telefon).
 *
 * ⚠️ Notițele LIVE ale unei sesiuni rămân pe site, deschise în browser: sunt editare colaborativă
 * (yjs + CodeMirror), un singur scriitor pe `SessionNote.content`. Un `textarea` cu PUT aici ar
 * fi suprascris starea CRDT a celorlalți. Aici se vede doar previzualizarea, ca pe site.
 */

interface InfoTabara {
  camp: {
    nume: string;
    locatie: string;
    dataStart: string;
    dataEnd: string;
    programGeneral: string | null;
    menuZilnic: string | null;
    mentorNume: string | null;
    mentorBio: string | null;
  };
  room: {
    numar: string;
    etaj: number | null;
    cladire: string | null;
    capacitate: number;
    assignments: { participant: Coleg }[];
  } | null;
  mealPreference: { isVegetarian: boolean; alergeni: string | null };
  participanti: Coleg[];
  currentParticipantId: string;
}

interface Sesiune extends SesiunePentruUrcare {
  startTime: string;
  endTime: string;
  studio: { numar: number; locatie: string; echipamente: string | null };
  formator: { id: string; nume: string } | null;
  note: { content: string; updatedAt: string } | null;
  participants: { participant: Coleg }[];
}

// Filele de sub cele trei coloane (23e). „Program" = programul pe zile, meniul și mentorul (fosta filă „Info").
const FILE = [
  { id: "program", text: "Program & masă" },
  { id: "sesiuni", text: "Sesiuni" },
  { id: "playlist", text: "Playlist" },
  { id: "camera", text: "Camera" },
] as const;
type Fila = (typeof FILE)[number]["id"];

const ora = (iso: string) =>
  new Date(iso).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });
const ziScurta = (iso: string) =>
  new Date(iso).toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Bucharest",
  });

export function Tabara(props: { id: string }) {
  const sesiune = useSesiune();
  const cont = useCont();
  const experiente = useExperiente();
  const cere =
    <T,>(cale: string) =>
    () =>
      cerereCont<T>(sesiune(), cale);
  // Patru cereri în paralel, ca pe site. Doar `info` e obligatoriu: fără el, tabăra nu e a omului.
  const info = useQuery(() => ({
    queryKey: ["bbt-tabara", props.id, "info"],
    queryFn: cere<InfoTabara>(`/api/public/camps/${props.id}/info`),
    retry: 1,
  }));
  const sesiuni = useQuery(() => ({
    queryKey: ["bbt-tabara", props.id, "sesiuni"],
    queryFn: cere<Sesiune[]>(`/api/public/camps/${props.id}/my-sessions`),
    retry: 1,
  }));
  const playlist = useQuery(() => ({
    queryKey: ["bbt-tabara", props.id, "playlist"],
    queryFn: cere<Piesa[]>(`/api/public/camps/${props.id}/playlist`),
    retry: 1,
  }));
  const notita = useQuery(() => ({
    queryKey: ["bbt-tabara", props.id, "notita"],
    queryFn: cere<{ content?: string } | null>(
      `/api/public/camps/${props.id}/my-note`,
    ),
    retry: 1,
  }));
  const [fila, setFila] = createSignal<Fila>("program");
  let file: HTMLDivElement | undefined;
  const mergiLa = (f: Fila) => {
    setFila(f);
    file?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Plata vine din Experiențele mele (aceeași regulă de bani), documentele din `/me` (contractul și facturile).
  const experienta = () =>
    [
      ...(experiente.data?.active ?? []),
      ...(experiente.data?.trecute ?? []),
    ].find((e) => e.fel === "camp" && e.id === props.id);
  const inscriere = () =>
    (cont.data?.inscrieri ?? []).find(
      (i) => i.camp.id === props.id && reala(i.statusPlata),
    );

  return (
    <Switch>
      <Match when={info.isLoading}>
        <Incarcare />
      </Match>
      <Match when={info.isError || !info.data}>
        <Mesaj fel="eroare">
          Nu am putut deschide tabăra. Încearcă din nou peste un minut.
        </Mesaj>
      </Match>
      <Match when={info.data}>
        {(d) => (
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "16px" }}
          >
            {/* Banda roz din 23e: când, unde, cine. */}
            <div
              style={{
                display: "flex",
                "align-items": "flex-end",
                "justify-content": "space-between",
                gap: "16px",
                "flex-wrap": "wrap",
                padding: "28px",
                "border-radius": "32px",
                background: C.roz,
              }}
            >
              <div style={{ "min-width": 0 }}>
                <Eticheta culoare={C.text}>
                  {perioada(d().camp.dataStart, d().camp.dataEnd)} ·{" "}
                  {d().camp.locatie}
                </Eticheta>
                <h1
                  style={{
                    ...DE_FONTE,
                    margin: "8px 0 14px",
                    "font-size": "48px",
                    "line-height": "1",
                  }}
                >
                  {d().camp.nume}
                </h1>
                <Show when={d().participanti.length}>
                  <span
                    style={{
                      display: "inline-flex",
                      // 23e: 11 / 16, text gros de 13.
                      padding: "11px 16px",
                      "border-radius": "999px",
                      background: C.rozDeschis,
                      "font-size": "13px",
                      "font-weight": 800,
                    }}
                  >
                    {d().participanti.length} participanți
                  </span>
                </Show>
              </div>
              <Show
                when={inDesfasurare(d().camp.dataStart, d().camp.dataEnd)}
                fallback={
                  <Show when={zilePana(d().camp.dataStart) > 0}>
                    <Pastila fel="asteapta">
                      {zilePana(d().camp.dataStart) === 1
                        ? "mâine"
                        : `în ${zilePana(d().camp.dataStart)} zile`}
                    </Pastila>
                  </Show>
                }
              >
                <Pastila fel="neutru">În desfășurare</Pastila>
              </Show>
            </div>

            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px",
                "align-items": "start",
              }}
            >
              <PlataSiDocumente
                experienta={experienta()}
                inscriere={inscriere()}
              />
              <ProgramAzi d={d()} laToate={() => mergiLa("program")} />
              <CameraPeScurt d={d()} laDetalii={() => mergiLa("camera")} />
            </div>

            <div
              ref={file}
              role="tablist"
              style={{
                display: "flex",
                gap: "8px",
                "flex-wrap": "wrap",
                "margin-top": "12px",
              }}
            >
              <For each={FILE}>
                {(f) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fila() === f.id}
                    onClick={() => setFila(f.id)}
                    style={{
                      height: "40px",
                      padding: "0 18px",
                      "border-radius": "999px",
                      border: "0",
                      background: fila() === f.id ? C.negru : C.foaie,
                      color: fila() === f.id ? C.peNegru : C.stins,
                      "font-family": "inherit",
                      "font-size": "14px",
                      "font-weight": 700,
                      cursor: "pointer",
                    }}
                  >
                    {f.text}
                  </button>
                )}
              </For>
            </div>

            <div style={{ "max-width": "760px" }}>
              <Switch>
                <Match when={fila() === "program"}>
                  <FilaInfo id={props.id} d={d()} />
                </Match>
                <Match when={fila() === "sesiuni"}>
                  <FilaSesiuni
                    id={props.id}
                    sesiuni={sesiuni.data ?? []}
                    incarc={sesiuni.isLoading}
                    notita={notita.data?.content ?? ""}
                  />
                </Match>
                <Match when={fila() === "playlist"}>
                  <Show when={!playlist.isLoading} fallback={<Incarcare />}>
                    <Playlist
                      campId={props.id}
                      dataEnd={d().camp.dataEnd}
                      initiale={playlist.data ?? []}
                      sesiuni={sesiuni.data ?? []}
                      colegi={d().participanti}
                      euId={d().currentParticipantId}
                    />
                  </Show>
                </Match>
                <Match when={fila() === "camera"}>
                  <FilaCamera d={d()} />
                </Match>
              </Switch>
            </div>
          </div>
        )}
      </Match>
    </Switch>
  );
}

/** Coloana stângă din 23e: rata de plătit și actele (contractul, facturile). */
function PlataSiDocumente(props: {
  experienta?: Experienta;
  inscriere?: Inscriere;
}) {
  const pr = () => props.experienta?.progres ?? null;
  const facturi = () =>
    (props.inscriere?.plati ?? []).filter((p) => p.fgoFacturaLink);
  const contract = () => props.inscriere?.contract ?? null;
  const semnat = () =>
    contract()?.stare === "Semnat" && contract()?.link ? contract()! : null;
  return (
    <Card
      style={{
        padding: "18px",
        display: "flex",
        "flex-direction": "column",
        gap: "12px",
      }}
    >
      <Show when={pr()}>
        {(p) => (
          <>
            <div
              style={{
                display: "flex",
                "justify-content": "space-between",
                gap: "10px",
              }}
            >
              <Eticheta>
                {p().nrTranse === 1
                  ? "Plată integrală"
                  : `Plată · ${p().nrTranse} rate`}
              </Eticheta>
              <span style={{ "font-size": "14px", "font-weight": 700 }}>
                {p().platit.toLocaleString("ro-RO")} / {lei(p().total)}
              </span>
            </div>
            <BaraPlata
              platit={p().platit}
              total={p().total}
              nrTranse={p().nrTranse}
            />
            <Show
              when={props.experienta?.plata}
              fallback={
                <p
                  style={{ margin: 0, "font-size": "16px", "font-weight": 700 }}
                >
                  Plătit integral
                </p>
              }
            >
              {(pl) => (
                <div
                  style={{
                    display: "flex",
                    "flex-direction": "column",
                    gap: "10px",
                    "align-items": "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...DE_FONTE,
                        margin: 0,
                        "font-size": "24px",
                        color: pl().intarziat ? C.rosu : C.text,
                      }}
                    >
                      {pl().actiune === "contract"
                        ? "Contract de semnat"
                        : pl().actiune === "integral"
                          ? lei(pl().suma)
                          : `Rata ${pl().numarTransa} · ${lei(pl().suma)}`}
                    </p>
                    <Show when={pl().scadentaLa && pl().actiune !== "contract"}>
                      <p
                        style={{
                          margin: "2px 0 0",
                          color: C.stins,
                          "font-size": "14px",
                        }}
                      >
                        {pl().intarziat ? "întârziată, scadentă " : "scadentă "}
                        {zi(pl().scadentaLa!)}
                      </p>
                    </Show>
                  </div>
                  <ButonPlateste mic plata={pl()} progres={p()} />
                </div>
              )}
            </Show>
          </>
        )}
      </Show>

      <div style={{ "margin-top": pr() ? "8px" : "0" }}>
        <Eticheta>Documente</Eticheta>
      </div>
      <Show
        when={semnat() || facturi().length}
        fallback={
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            Contractul și facturile apar aici după semnare și plată.
          </p>
        }
      >
        {/* Contractul semnat se deschide pe site, cu „Descarcă" (`/contract/<token>`); facturile, la FGO. */}
        <Show when={semnat()}>
          {(c) => (
            <RandDocument
              href={`${BBT_SITE_URL}${c().link}`}
              text={`Contract semnat nr. ${c().numar}`}
            />
          )}
        </Show>
        <For each={facturi()}>
          {(f) => (
            <RandDocument
              href={f.fgoFacturaLink!}
              text={`Factură ${props.inscriere!.nrTranse === 1 ? "" : `rata ${f.numarTransa} `}${f.fgoFacturaSerie ?? ""}-${f.fgoFacturaNumar ?? ""}`}
            />
          )}
        </For>
      </Show>
    </Card>
  );
}

function RandDocument(props: { href: string; text: string }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "10px",
        color: C.text,
        "font-size": "14px",
        "font-weight": 600,
        "text-decoration": "none",
      }}
    >
      {props.text}
      <Symbol size={18}>download</Symbol>
    </a>
  );
}

/** Ziua din program care ține azi (1-based); înainte de tabără, prima; după, ultima. */
function ziuaDeAzi(dataStart: string, nrZile: number): number {
  const z = 1 - zilePana(dataStart);
  return Math.min(Math.max(z, 1), Math.max(nrZile, 1));
}

/** Ziua de azi din program (sau prima zi, înainte de tabără), cu „Toate zilele ›" spre fila Program (23e). */
function ProgramAzi(props: { d: InfoTabara; laToate: () => void }) {
  const program = () => parseProgram(props.d.camp.programGeneral);
  const ziua = () => ziuaDeAzi(props.d.camp.dataStart, program()?.length ?? 0);
  const intrari = () =>
    [...(program()?.find((z) => z.ziua === ziua())?.intrari ?? [])].sort(
      (a, b) => a.ora.localeCompare(b.ora),
    );
  return (
    <Card style={{ padding: "18px" }}>
      <div
        style={{
          display: "flex",
          "justify-content": "space-between",
          gap: "10px",
          "margin-bottom": "10px",
        }}
      >
        <Eticheta>
          Program
          <Show when={program()?.length}>
            {" "}
            · {etichetaZi(props.d.camp.dataStart, ziua()).split(" - ")[1]}
          </Show>
        </Eticheta>
        <button
          type="button"
          onClick={() => props.laToate()}
          style={{
            padding: 0,
            border: 0,
            background: "transparent",
            color: C.text,
            "font-family": "inherit",
            "font-size": "14px",
            "font-weight": 700,
            cursor: "pointer",
          }}
        >
          Toate zilele ›
        </button>
      </div>
      <Show
        when={intrari().length}
        fallback={
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            Programul apare aici imediat ce e gata.
          </p>
        }
      >
        <For each={intrari()}>
          {(i) => (
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "8px 10px",
                "border-radius": "14px",
              }}
            >
              <span
                style={{
                  width: "40px",
                  "flex-shrink": 0,
                  "font-size": "13px",
                  "font-weight": 800,
                  "font-variant-numeric": "tabular-nums",
                }}
              >
                {i.ora || "-"}
              </span>
              <span style={{ "font-size": "14px", "font-weight": 700 }}>
                {i.titlu}
              </span>
            </div>
          )}
        </For>
      </Show>
    </Card>
  );
}

/** Coloana dreaptă din 23e: camera. Transportul din machetă nu există încă în date, deci lipsește. */
function CameraPeScurt(props: { d: InfoTabara; laDetalii: () => void }) {
  const colegi = () =>
    (props.d.room?.assignments ?? [])
      .filter((a) => a.participant.id !== props.d.currentParticipantId)
      .map((a) => a.participant.numeComplet);
  return (
    <Card
      style={{
        padding: "18px",
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
      }}
    >
      <Eticheta>Cazare</Eticheta>
      <Show
        when={props.d.room}
        fallback={
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            Repartizarea camerelor se anunță aici.
          </p>
        }
      >
        {(camera) => (
          <>
            <p style={{ ...DE_FONTE, margin: 0, "font-size": "24px" }}>
              Camera {camera().numar}
            </p>
            <Show when={camera().cladire || camera().etaj != null}>
              <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
                {[
                  camera().cladire,
                  camera().etaj != null ? `etajul ${camera().etaj}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Show>
            <Show when={colegi().length}>
              <p style={{ margin: 0, "font-size": "14px" }}>
                cu {colegi().join(", ")}
              </p>
            </Show>
            <div style={{ "margin-top": "6px" }}>
              <Buton piele="alb" mic onClick={() => props.laDetalii()}>
                Detalii cameră
              </Buton>
            </div>
          </>
        )}
      </Show>
    </Card>
  );
}

function Bloc(props: {
  titlu: string;
  simbol?: string;
  actiune?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
          "margin-bottom": "12px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            "align-items": "center",
            gap: "8px",
            color: C.stins,
          }}
        >
          <Show when={props.simbol}>
            <Symbol size={14}>{props.simbol!}</Symbol>
          </Show>
          <Eticheta>{props.titlu}</Eticheta>
        </span>
        {props.actiune}
      </div>
      {props.children}
    </Card>
  );
}

const linieRand = {
  display: "flex",
  "align-items": "baseline",
  gap: "12px",
  padding: "6px 0",
  "border-top": `1px solid ${C.linie}`,
};

function FilaInfo(props: { id: string; d: InfoTabara }) {
  const c = () => props.d.camp;
  const program = () => parseProgram(c().programGeneral);
  const meniu = () => parseMeniu(c().menuZilnic);
  const MESE = [
    { k: "micDejun", t: "Mic dejun" },
    { k: "pranz", t: "Prânz" },
    { k: "cina", t: "Cină" },
    { k: "vegetarian", t: "Vegetarian" },
  ] as const;

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "14px" }}>
      <Show when={c().mentorNume}>
        <Bloc titlu="Mentor">
          <p
            style={{
              margin: 0,
              color: C.text,
              "font-weight": 700,
              "font-size": "17px",
            }}
          >
            {c().mentorNume}
          </p>
          <Show when={c().mentorBio}>
            <p
              style={{
                margin: "8px 0 0",
                color: C.stins,
                "font-size": "14px",
                "line-height": "1.55",
              }}
            >
              {c().mentorBio}
            </p>
          </Show>
        </Bloc>
      </Show>
      <Show when={c().programGeneral}>
        <Bloc titlu="Program">
          {/* Taberele vechi au text liber, nu JSON: atunci se afișează textul, ca pe site. */}
          <Show
            when={program()?.length}
            fallback={
              <p
                style={{
                  margin: 0,
                  color: C.stins,
                  "white-space": "pre-line",
                  "font-size": "14px",
                }}
              >
                {c().programGeneral}
              </p>
            }
          >
            <ProgramPeZile dataStart={c().dataStart} zile={program()!} />
          </Show>
        </Bloc>
      </Show>
      <Show when={c().menuZilnic}>
        <Bloc titlu="Meniu zilnic" simbol="restaurant">
          <Show
            when={meniu()?.length}
            fallback={
              <p
                style={{
                  margin: 0,
                  color: C.stins,
                  "white-space": "pre-line",
                  "font-size": "14px",
                }}
              >
                {c().menuZilnic}
              </p>
            }
          >
            <For each={meniu()!}>
              {(z) => (
                <div style={{ "margin-bottom": "12px" }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: C.text,
                      "font-weight": 600,
                      "font-size": "14px",
                    }}
                  >
                    {etichetaZi(c().dataStart, z.ziua)}
                  </p>
                  <For each={MESE.filter((m) => z[m.k])}>
                    {(m) => (
                      <div style={linieRand}>
                        <span
                          style={{
                            width: "84px",
                            "flex-shrink": 0,
                            color: C.slab,
                            "font-size": "14px",
                            "font-weight": 600,
                          }}
                        >
                          {m.t}
                        </span>
                        <span style={{ color: C.stins, "font-size": "14px" }}>
                          {z[m.k]}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </Show>
        </Bloc>
      </Show>
      <PreferinteMasa id={props.id} initial={props.d.mealPreference} />
      <Show when={!c().programGeneral && !c().mentorNume}>
        <StareGoala
          titlu="Detaliile vin curând"
          text="Programul și mentorul taberei apar aici imediat ce sunt gata."
        />
      </Show>
    </div>
  );
}

/**
 * Programul pe zile, cu câte o pastilă pe zi (22a, „Toate zilele ›" din 23e). Se deschide pe ziua de azi; înainte de
 * tabără, pe prima. Până pe 30 oct toate zilele stăteau una sub alta, iar ziua de azi trebuia căutată.
 */
function ProgramPeZile(props: { dataStart: string; zile: ProgramZi[] }) {
  const [ziua, setZiua] = createSignal(
    untrack(() => ziuaDeAzi(props.dataStart, props.zile.length)),
  );
  const intrari = () =>
    [...(props.zile.find((z) => z.ziua === ziua())?.intrari ?? [])].sort(
      (a, b) => a.ora.localeCompare(b.ora),
    );
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "6px",
          "flex-wrap": "wrap",
          "margin-bottom": "12px",
        }}
      >
        <For each={props.zile}>
          {(z) => (
            <button
              type="button"
              aria-pressed={ziua() === z.ziua}
              onClick={() => setZiua(z.ziua)}
              style={{
                height: "36px",
                padding: "0 14px",
                "border-radius": "999px",
                border: "0",
                background: ziua() === z.ziua ? C.negru : C.fundal,
                color: ziua() === z.ziua ? C.peNegru : C.text,
                "font-family": "inherit",
                "font-size": "14px",
                "font-weight": 600,
                cursor: "pointer",
              }}
            >
              {etichetaZi(props.dataStart, z.ziua).split(" - ")[1]}
            </button>
          )}
        </For>
      </div>
      <For each={intrari()}>
        {(i) => (
          <div style={linieRand}>
            <span
              style={{
                width: "48px",
                "flex-shrink": 0,
                color: C.text,
                "font-size": "14px",
                "font-weight": 700,
                "font-variant-numeric": "tabular-nums",
              }}
            >
              {i.ora || "-"}
            </span>
            <span style={{ color: C.text, "font-size": "14px" }}>
              {i.titlu}
            </span>
          </div>
        )}
      </For>
    </>
  );
}

function PreferinteMasa(props: {
  id: string;
  initial: { isVegetarian: boolean; alergeni: string | null };
}) {
  const sesiune = useSesiune();

  const [salvat, setSalvat] = createSignal(props.initial);
  const [editez, setEditez] = createSignal(false);
  const [veg, setVeg] = createSignal(false);
  const [alergeni, setAlergeni] = createSignal("");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<{
    tip: "ok" | "err";
    text: string;
  } | null>(null);

  const porneste = () => {
    setVeg(salvat().isVegetarian);
    setAlergeni(salvat().alergeni ?? "");
    setStare(null);
    setEditez(true);
  };

  async function salveaza(e: SubmitEvent) {
    e.preventDefault();
    setLucrez(true);
    const nou = { isVegetarian: veg(), alergeni: alergeni().trim() || null };
    try {
      await cerereCont(
        sesiune(),
        `/api/public/camps/${props.id}/meal-preference`,
        { method: "POST", body: JSON.stringify(nou) },
      );
      setSalvat(nou);
      setEditez(false);
      setStare({ tip: "ok", text: "Salvat." });
    } catch {
      setStare({ tip: "err", text: "Nu am putut salva. Încearcă din nou." });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Bloc
      titlu="Preferințe masă"
      simbol="restaurant"
      actiune={
        <button
          type="button"
          onClick={() => (editez() ? setEditez(false) : porneste())}
          style={{
            border: "0",
            background: "transparent",
            color: C.stins,
            "font-family": "inherit",
            "font-size": "14px",
            "font-weight": 600,
            cursor: "pointer",
          }}
        >
          {editez() ? "Anulează" : "Editează"}
        </button>
      }
    >
      <Show
        when={editez()}
        fallback={
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "6px" }}
          >
            <div
              style={{
                display: "flex",
                "justify-content": "space-between",
                color: C.stins,
                "font-size": "14px",
              }}
            >
              <span>Vegetarian</span>
              <span
                style={{
                  color: salvat().isVegetarian ? C.verde : C.slab,
                  "font-weight": 600,
                }}
              >
                {salvat().isVegetarian ? "Da" : "Nu"}
              </span>
            </div>
            <Show when={salvat().alergeni}>
              <span style={{ color: C.stins, "font-size": "14px" }}>
                Alergeni: {salvat().alergeni}
              </span>
            </Show>
            <MesajSalvare stare={stare()} />
          </div>
        }
      >
        <form
          onSubmit={salveaza}
          style={{ display: "flex", "flex-direction": "column", gap: "12px" }}
        >
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              color: C.text,
              "font-size": "14px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={veg()}
              onChange={(e) => setVeg(e.currentTarget.checked)}
            />
            Mâncare vegetariană
          </label>
          <CampText
            eticheta="Alergeni sau restricții"
            valoare={alergeni()}
            laSchimbare={setAlergeni}
            placeholder="gluten, lactate, nuci"
          />
          <div
            style={{ display: "flex", "align-items": "center", gap: "12px" }}
          >
            <Buton mic tip="submit" dezactivat={lucrez()}>
              {lucrez() ? "Se salvează…" : "Salvează"}
            </Buton>
            <MesajSalvare stare={stare()} />
          </div>
        </form>
      </Show>
    </Bloc>
  );
}

function FilaSesiuni(props: {
  id: string;
  sesiuni: Sesiune[];
  incarc: boolean;
  notita: string;
}) {
  return (
    <Show when={!props.incarc} fallback={<Incarcare />}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
        <Show
          when={props.sesiuni.length}
          fallback={
            <StareGoala
              titlu="Nicio sesiune încă"
              text="Sesiunile tale apar după ce se publică programul."
            />
          }
        >
          <For each={props.sesiuni}>
            {(s) => (
              <Card
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  "flex-direction": "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    "justify-content": "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: C.text, "font-weight": 700 }}>
                      Sesiunea {s.numar}
                    </p>
                    <Show when={s.formator}>
                      <p
                        style={{
                          margin: "2px 0 0",
                          color: C.slab,
                          "font-size": "14px",
                        }}
                      >
                        cu {s.formator!.nume}
                      </p>
                    </Show>
                  </div>
                  <span
                    style={{
                      "align-self": "flex-start",
                      padding: "3px 10px",
                      "border-radius": "999px",
                      background: C.fundal,
                      color: C.stins,
                      "font-size": "14px",
                      "font-weight": 600,
                    }}
                  >
                    Studio {s.studio.numar}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    "flex-wrap": "wrap",
                    gap: "4px 14px",
                    color: C.stins,
                    "font-size": "14px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      gap: "6px",
                    }}
                  >
                    <Symbol size={13}>schedule</Symbol>
                    {ziScurta(s.startTime)} · {ora(s.startTime)} -{" "}
                    {ora(s.endTime)}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      gap: "6px",
                    }}
                  >
                    <Symbol size={13}>location_on</Symbol>
                    {s.studio.locatie}
                  </span>
                </div>
                <Show when={s.participants.length}>
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: C.slab,
                        "font-size": "14px",
                      }}
                    >
                      Colegii din studio
                    </p>
                    <div
                      style={{
                        display: "flex",
                        "flex-wrap": "wrap",
                        gap: "6px",
                      }}
                    >
                      <For each={s.participants}>
                        {({ participant: p }) => (
                          <span
                            style={{
                              padding: "3px 10px",
                              "border-radius": "999px",
                              background: C.fundal,
                              color: C.stins,
                              "font-size": "14px",
                            }}
                          >
                            {p.numeComplet.split(" ")[0]}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
                {/* Notițele live: pe site, în browser (vezi antetul fișierului). */}
                <a
                  href={`${BBT_SITE_URL}/my-camp/${props.id}/sesiune/${s.id}/notite`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    "border-radius": "12px",
                    border: `1px solid ${C.linie}`,
                    background: "rgba(255,215,49,0.06)",
                    "text-decoration": "none",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      "justify-content": "space-between",
                      gap: "8px",
                      color: C.camps,
                      "font-size": "14px",
                      "font-weight": 600,
                    }}
                  >
                    Notițele sesiunii · live
                    <span
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        gap: "4px",
                        color: C.text,
                      }}
                    >
                      Deschide <Symbol size={13}>open_in_new</Symbol>
                    </span>
                  </span>
                  <Show when={s.note?.content}>
                    <span
                      style={{
                        display: "-webkit-box",
                        "-webkit-line-clamp": 3,
                        "-webkit-box-orient": "vertical",
                        overflow: "hidden",
                        "margin-top": "6px",
                        color: C.stins,
                        "font-size": "14px",
                        "white-space": "pre-line",
                      }}
                    >
                      {s.note!.content}
                    </span>
                  </Show>
                </a>
              </Card>
            )}
          </For>
          <NotitaPrivata id={props.id} initial={props.notita} />
        </Show>
      </div>
    </Show>
  );
}

function NotitaPrivata(props: { id: string; initial: string }) {
  const sesiune = useSesiune();

  const [salvat, setSalvat] = createSignal(props.initial);
  const [editez, setEditez] = createSignal(false);
  const [text, setText] = createSignal("");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<{
    tip: "ok" | "err";
    text: string;
  } | null>(null);

  async function salveaza() {
    setLucrez(true);
    try {
      await cerereCont(sesiune(), `/api/public/camps/${props.id}/my-note`, {
        method: "PUT",
        body: JSON.stringify({ content: text() }),
      });
      setSalvat(text());
      setEditez(false);
      setStare(null);
    } catch {
      setStare({ tip: "err", text: "Nu am putut salva notița." });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Bloc
      titlu="Notița mea privată"
      actiune={
        <Show when={!editez()}>
          <button
            type="button"
            onClick={() => {
              setText(salvat());
              setEditez(true);
            }}
            style={{
              border: "0",
              background: "transparent",
              color: C.stins,
              "font-family": "inherit",
              "font-size": "14px",
              "font-weight": 600,
              cursor: "pointer",
            }}
          >
            Editează
          </button>
        </Show>
      }
    >
      <Show
        when={editez()}
        fallback={
          <Show
            when={salvat()}
            fallback={
              <span style={{ color: C.slab, "font-size": "14px" }}>
                Notițe personale despre tabără, vizibile doar pentru tine.
              </span>
            }
          >
            <p
              style={{
                margin: 0,
                color: C.stins,
                "font-size": "14px",
                "line-height": "1.55",
                "white-space": "pre-line",
              }}
            >
              {salvat()}
            </p>
          </Show>
        }
      >
        <textarea
          rows={5}
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          placeholder="Notițe, impresii, idei (doar tu le vezi)"
          style={{
            width: "100%",
            "box-sizing": "border-box",
            padding: "10px 12px",
            "border-radius": "10px",
            border: `1px solid ${C.linie}`,
            background: C.foaieTare,
            color: C.text,
            "font-family": "inherit",
            "font-size": "14px",
            resize: "vertical",
            outline: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "margin-top": "10px",
          }}
        >
          <Buton mic onClick={salveaza} dezactivat={lucrez()}>
            {lucrez() ? "Se salvează…" : "Salvează"}
          </Buton>
          <Buton piele="alb" mic onClick={() => setEditez(false)}>
            Renunță
          </Buton>
          <MesajSalvare stare={stare()} />
        </div>
      </Show>
    </Bloc>
  );
}

function FilaCamera(props: { d: InfoTabara }) {
  return (
    <Show
      when={props.d.room}
      fallback={
        <StareGoala
          titlu="Camera vine curând"
          text="Repartizarea camerelor se anunță aici."
        />
      }
    >
      {(r) => (
        <div
          style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
        >
          <Bloc titlu="Camera ta">
            <div
              style={{ display: "flex", "align-items": "center", gap: "14px" }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  "border-radius": "16px",
                  background: C.camps,
                  color: "#000",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "font-size": "20px",
                  "font-weight": 800,
                }}
              >
                {r().numar}
              </div>
              <div style={{ color: C.stins, "font-size": "14px" }}>
                <Show when={r().cladire}>
                  <p style={{ margin: 0, color: C.text, "font-weight": 600 }}>
                    {r().cladire}
                  </p>
                </Show>
                <Show when={r().etaj != null}>
                  <p style={{ margin: 0 }}>Etaj {r().etaj}</p>
                </Show>
                <p style={{ margin: 0, color: C.slab, "font-size": "14px" }}>
                  Capacitate: {r().capacitate} persoane
                </p>
              </div>
            </div>
          </Bloc>
          <Show when={r().assignments.length}>
            <Bloc titlu="Colegii de cameră">
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "10px",
                }}
              >
                <For each={r().assignments}>
                  {({ participant: p }) => (
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          "border-radius": "10px",
                          background: C.fundal,
                          color: C.text,
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "font-weight": 700,
                        }}
                      >
                        {p.numeComplet[0]}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: C.text,
                            "font-size": "14px",
                            "font-weight": 600,
                          }}
                        >
                          {p.numeComplet}
                        </p>
                        <Show when={p.roles.length}>
                          <p
                            style={{
                              margin: 0,
                              color: C.slab,
                              "font-size": "14px",
                            }}
                          >
                            {p.roles.join(", ")}
                          </p>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Bloc>
          </Show>
        </div>
      )}
    </Show>
  );
}
