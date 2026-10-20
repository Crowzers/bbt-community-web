import { For, JSX, Match, Show, Switch, createSignal } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../../config";
import { cerereCont } from "../../tokenBbt";
import { useSesiune, ziLunga } from "../date";
import { Incarcare } from "../MyCamps";
import {
  ButonContur,
  ButonRoz,
  C,
  CampText,
  Card,
  Eticheta,
  Mesaj,
  MesajSalvare,
  StareGoala,
} from "../ui";

import { etichetaZi, parseMeniu, parseProgram } from "./continut";
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

const FILE = [
  { id: "info", text: "Info", simbol: "info" },
  { id: "sesiuni", text: "Sesiuni", simbol: "group" },
  { id: "playlist", text: "Playlist", simbol: "music_note" },
  { id: "camera", text: "Camera", simbol: "home" },
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
  const [fila, setFila] = createSignal<Fila>("info");

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
            style={{
              "max-width": "760px",
              display: "flex",
              "flex-direction": "column",
              gap: "16px",
            }}
          >
            <Card style={{ padding: "18px 20px" }}>
              <Eticheta culoare={C.camps}>Tabără</Eticheta>
              <h1
                style={{
                  margin: "4px 0 6px",
                  color: C.text,
                  "font-size": "22px",
                  "font-weight": 700,
                }}
              >
                {d().camp.nume}
              </h1>
              <div
                style={{
                  display: "flex",
                  "flex-wrap": "wrap",
                  gap: "4px 16px",
                  color: C.stins,
                  "font-size": "13.5px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    "align-items": "center",
                    gap: "6px",
                  }}
                >
                  <Symbol size={14}>location_on</Symbol>
                  {d().camp.locatie}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    "align-items": "center",
                    gap: "6px",
                  }}
                >
                  <Symbol size={14}>calendar_month</Symbol>
                  {ziLunga(d().camp.dataStart)} - {ziLunga(d().camp.dataEnd)}
                </span>
              </div>
            </Card>

            <div
              role="tablist"
              style={{
                display: "flex",
                gap: "4px",
                padding: "4px",
                "border-radius": "14px",
                background: C.foaie,
                border: `1px solid ${C.linie}`,
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
                      flex: 1,
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      gap: "6px",
                      height: "38px",
                      "border-radius": "10px",
                      border: "0",
                      background:
                        fila() === f.id
                          ? "rgba(255,255,255,0.1)"
                          : "transparent",
                      color: fila() === f.id ? C.text : C.stins,
                      "font-family": "inherit",
                      "font-size": "13.5px",
                      "font-weight": 600,
                      cursor: "pointer",
                    }}
                  >
                    <Symbol size={15}>{f.simbol}</Symbol>
                    {f.text}
                  </button>
                )}
              </For>
            </div>

            <Switch>
              <Match when={fila() === "info"}>
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
        )}
      </Match>
    </Switch>
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
        <Bloc titlu="Program general">
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
            <For each={program()!}>
              {(z) => (
                <div style={{ "margin-bottom": "12px" }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: C.text,
                      "font-weight": 600,
                      "font-size": "13.5px",
                    }}
                  >
                    {etichetaZi(c().dataStart, z.ziua)}
                  </p>
                  <For
                    each={[...z.intrari].sort((a, b) =>
                      a.ora.localeCompare(b.ora),
                    )}
                  >
                    {(i) => (
                      <div style={linieRand}>
                        <span
                          style={{
                            width: "48px",
                            "flex-shrink": 0,
                            color: C.slab,
                            "font-size": "12.5px",
                            "font-weight": 700,
                            "font-variant-numeric": "tabular-nums",
                          }}
                        >
                          {i.ora || "-"}
                        </span>
                        <span style={{ color: C.stins, "font-size": "14px" }}>
                          {i.titlu}
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
                      "font-size": "13.5px",
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
                            "font-size": "12.5px",
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
          simbol="info"
          titlu="Detaliile vin curând"
          text="Programul și mentorul taberei apar aici imediat ce sunt gata."
        />
      </Show>
    </div>
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
            "font-size": "13px",
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
            <ButonRoz tip="submit" dezactivat={lucrez()}>
              {lucrez() ? "Se salvează…" : "Salvează"}
            </ButonRoz>
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
              simbol="group"
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
                          "font-size": "12.5px",
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
                      background: "rgba(255,255,255,0.06)",
                      color: C.stins,
                      "font-size": "12px",
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
                    "font-size": "13px",
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
                        "font-size": "12px",
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
                              background: "rgba(255,255,255,0.06)",
                              color: C.stins,
                              "font-size": "12.5px",
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
                      "font-size": "12.5px",
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
                        "font-size": "13.5px",
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
              "font-size": "13px",
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
            background: "#0D0D0D",
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
          <ButonRoz onClick={salveaza} dezactivat={lucrez()}>
            {lucrez() ? "Se salvează…" : "Salvează"}
          </ButonRoz>
          <ButonContur onClick={() => setEditez(false)}>Renunță</ButonContur>
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
          simbol="home"
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
              <div style={{ color: C.stins, "font-size": "13.5px" }}>
                <Show when={r().cladire}>
                  <p style={{ margin: 0, color: C.text, "font-weight": 600 }}>
                    {r().cladire}
                  </p>
                </Show>
                <Show when={r().etaj != null}>
                  <p style={{ margin: 0 }}>Etaj {r().etaj}</p>
                </Show>
                <p style={{ margin: 0, color: C.slab, "font-size": "12.5px" }}>
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
                          background: "rgba(255,255,255,0.08)",
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
                              "font-size": "12px",
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
