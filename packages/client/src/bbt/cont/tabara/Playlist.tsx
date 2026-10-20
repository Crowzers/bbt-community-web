import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../../tokenBbt";
import { useSesiune } from "../date";
import {
  ButonRoz,
  C,
  CampAlege,
  CampText,
  Card,
  Eticheta2,
  StareGoala,
} from "../ui";

import { tierPentruNumar } from "./continut";
import { deschideStreamCont } from "./streamCont";

/**
 * BBT: playlistul taberei în hub. Copia părții „Playlist" din `website/src/app/my-camp/[id]/MyCampTabs.tsx`.
 *
 * Reguli păstrate dinadins:
 * - Votul de Banger e UNIC per tabără: mutat pe altă piesă, schimbă două piese deodată. Serverul
 *   întoarce contorul tuturor, deci le actualizăm pe toate dintr-odată.
 * - Votarea se închide după `dataEnd` (Big Banger-ul se îngheață prin cron).
 * - Piesa ta (la care ai contribuit) nu o poți vota, dar o poți ascunde de pe profilurile publice.
 * - Live: orice urcare/vot/like de la altcineva emite un eveniment, iar noi recitim lista.
 */

export interface Piesa {
  id: string;
  title: string;
  url: string;
  duration: number | null;
  isBanger: boolean;
  ascunsa: boolean;
  studio: number | null;
  uploadedBy: { id: string; numeComplet: string };
  nrVoturi: number;
  votulMeu: boolean;
  nrLikes: number;
  amDatLike: boolean;
  esteEchipaMea: boolean;
  contributori?: { id: string; numeComplet: string; nrBangere: number }[];
  echipa?: { id: string; numeComplet: string; nrBangere: number }[];
}

export interface SesiunePentruUrcare {
  id: string;
  numar: number;
  studio: { numar: number };
}

export interface Coleg {
  id: string;
  numeComplet: string;
  roles: string[];
}

const prenume = (n: string) => n.split(" ")[0];

export function Playlist(props: {
  campId: string;
  dataEnd: string;
  initiale: Piesa[];
  sesiuni: SesiunePentruUrcare[];
  colegi: Coleg[];
  euId: string;
}) {
  const sesiune = useSesiune();

  const [piese, setPiese] = createSignal<Piesa[]>(props.initiale);
  const votareInchisa = () => new Date(props.dataEnd) < new Date();

  async function reincarca() {
    try {
      setPiese(
        await cerereCont<Piesa[]>(
          sesiune(),
          `/api/public/camps/${props.campId}/playlist`,
        ),
      );
    } catch {
      // refetch tăcut: următorul eveniment reîncearcă oricum
    }
  }

  onMount(() => {
    // Tabăra nu se schimbă cât pagina e deschisă (alt id = altă montare), deci o citim o dată.
    const campId = props.campId;
    const flux = deschideStreamCont(
      sesiune,
      (bilet) =>
        `/api/public/camps/${campId}/playlist/stream?token=${encodeURIComponent(bilet)}`,
      reincarca,
    );
    onCleanup(() => flux.inchide());
  });

  const schimba = (id: string, f: (p: Piesa) => Piesa) =>
    setPiese((l) => l.map((p) => (p.id === id ? f(p) : p)));

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
      <UrcaPiesa
        campId={props.campId}
        sesiuni={props.sesiuni}
        colegi={props.colegi.filter((c) => c.id !== props.euId)}
        laUrcat={reincarca}
      />
      <Show
        when={piese().length}
        fallback={
          <StareGoala
            simbol="music_note"
            titlu="Nicio piesă încă"
            text="Piesele din studio apar aici, cu voturile lor."
          />
        }
      >
        <For each={piese()}>
          {(p) => (
            <CardPiesa
              piesa={p}
              votareInchisa={votareInchisa()}
              laVot={(votulMeu, voturi) =>
                setPiese((l) =>
                  l.map((x) => ({
                    ...x,
                    nrVoturi: voturi[x.id] ?? 0,
                    votulMeu: x.id === votulMeu,
                  })),
                )
              }
              laLike={(amDatLike, nrLikes) =>
                schimba(p.id, (x) => ({ ...x, amDatLike, nrLikes }))
              }
              laAscuns={(ascunsa) => schimba(p.id, (x) => ({ ...x, ascunsa }))}
            />
          )}
        </For>
      </Show>
    </div>
  );
}

function CardPiesa(props: {
  piesa: Piesa;
  votareInchisa: boolean;
  laVot: (votulMeu: string | null, voturi: Record<string, number>) => void;
  laLike: (amDatLike: boolean, nrLikes: number) => void;
  laAscuns: (ascunsa: boolean) => void;
}) {
  const sesiune = useSesiune();
  const [lucrez, setLucrez] = createSignal(false);
  const p = () => props.piesa;
  const membri = () => p().contributori ?? p().echipa ?? [];

  async function voteaza() {
    if (lucrez()) return;
    setLucrez(true);
    try {
      const r = await cerereCont<{
        votulMeu: string | null;
        voturi: Record<string, number>;
      }>(sesiune(), `/api/public/songs/${p().id}/vote`, { method: "POST" });
      props.laVot(r.votulMeu, r.voturi);
    } catch {
      // votul rămâne cum era; nimic de afișat în plus
    } finally {
      setLucrez(false);
    }
  }

  async function like() {
    const inainte = { amDatLike: p().amDatLike, nrLikes: p().nrLikes };
    const nou = !inainte.amDatLike;
    props.laLike(nou, inainte.nrLikes + (nou ? 1 : -1)); // optimist
    try {
      const r = await cerereCont<{ liked: boolean; nrLikes: number }>(
        sesiune(),
        `/api/public/songs/${p().id}/like`,
        { method: "POST" },
      );
      props.laLike(r.liked, r.nrLikes);
    } catch {
      props.laLike(inainte.amDatLike, inainte.nrLikes);
    }
  }

  async function ascunde() {
    const nou = !p().ascunsa;
    props.laAscuns(nou); // optimist, se revine dacă serverul refuză
    try {
      await cerereCont(sesiune(), `/api/public/songs/${p().id}`, {
        method: "PATCH",
        body: JSON.stringify({ ascunsa: nou }),
      });
    } catch {
      props.laAscuns(!nou);
    }
  }

  return (
    <Card
      style={{
        padding: "14px 16px",
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          "flex-wrap": "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            color: C.text,
            "font-weight": 700,
            "font-size": "15px",
          }}
        >
          {p().title}
        </p>
        <Show when={p().isBanger}>
          <span
            style={{
              padding: "2px 8px",
              "border-radius": "999px",
              background: C.camps,
              color: "#000",
              "font-size": "11.5px",
              "font-weight": 700,
            }}
          >
            Banger
          </span>
        </Show>
      </div>
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          gap: "4px 12px",
          color: C.slab,
          "font-size": "12.5px",
        }}
      >
        <Show when={p().studio != null}>
          <span>Studio {p().studio}</span>
        </Show>
        <span>Urcată de {prenume(p().uploadedBy.numeComplet)}</span>
        <span
          style={{
            color: p().nrVoturi > 0 ? C.text : C.slab,
            "font-weight": p().nrVoturi > 0 ? 600 : 400,
          }}
        >
          {p().nrVoturi > 0
            ? `${p().nrVoturi} ${p().nrVoturi === 1 ? "vot" : "voturi"}`
            : "Fără voturi încă"}
        </span>
      </div>
      <Show when={membri().length}>
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "6px 12px" }}>
          <For each={membri()}>
            {(m) => (
              <span
                style={{
                  display: "inline-flex",
                  "align-items": "center",
                  gap: "6px",
                  color: C.stins,
                  "font-size": "12.5px",
                }}
              >
                {prenume(m.numeComplet)}
                <Show when={p().isBanger}>
                  <InsignaBanger nr={m.nrBangere} />
                </Show>
              </span>
            )}
          </For>
        </div>
      </Show>
      {/* `preload="none"`: o listă de zece piese ar fi tras zece MP3-uri la deschiderea filei. */}
      <audio
        controls
        preload="none"
        src={p().url}
        style={{ width: "100%", height: "36px", "color-scheme": "dark" }}
      />
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "10px",
          "flex-wrap": "wrap",
        }}
      >
        <Show
          when={!p().esteEchipaMea}
          fallback={
            <span style={{ color: C.slab, "font-size": "12.5px" }}>
              Piesa la care ai contribuit: nu o poți vota
            </span>
          }
        >
          <Show
            when={!props.votareInchisa}
            fallback={
              <Show when={p().votulMeu}>
                <span style={{ color: C.stins, "font-size": "12.5px" }}>
                  Ai votat piesa asta ca Banger
                </span>
              </Show>
            }
          >
            <button
              type="button"
              onClick={voteaza}
              disabled={lucrez()}
              title={
                p().votulMeu
                  ? "Apasă din nou ca să-ți retragi votul"
                  : "Un singur vot de Banger pe tabără"
              }
              style={{
                display: "inline-flex",
                "align-items": "center",
                gap: "6px",
                height: "34px",
                padding: "0 14px",
                "border-radius": "999px",
                border: "0",
                background: p().votulMeu ? C.camps : "rgba(255,255,255,0.08)",
                color: p().votulMeu ? "#000" : C.text,
                "font-family": "inherit",
                "font-size": "13px",
                "font-weight": 700,
                cursor: "pointer",
                opacity: lucrez() ? 0.5 : 1,
              }}
            >
              <Symbol size={14}>bolt</Symbol>
              {p().votulMeu ? "Banger" : "Votează Banger"}
            </button>
          </Show>
        </Show>
        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
          <Show when={p().esteEchipaMea}>
            <button
              type="button"
              onClick={ascunde}
              title={
                p().ascunsa
                  ? "Arat-o din nou pe profilurile publice"
                  : "Ascunde-o de pe profilurile publice"
              }
              style={{
                display: "inline-flex",
                "align-items": "center",
                gap: "6px",
                height: "34px",
                padding: "0 12px",
                "border-radius": "999px",
                border: `1px solid ${C.linie}`,
                background: "transparent",
                color: C.stins,
                "font-family": "inherit",
                "font-size": "12.5px",
                cursor: "pointer",
              }}
            >
              <Symbol size={14}>
                {p().ascunsa ? "visibility_off" : "visibility"}
              </Symbol>
              {p().ascunsa ? "Ascunsă" : "Pe profil"}
            </button>
          </Show>
          <button
            type="button"
            onClick={like}
            aria-label={p().amDatLike ? "Nu-mi mai place" : "Îmi place"}
            style={{
              display: "inline-flex",
              "align-items": "center",
              gap: "5px",
              height: "34px",
              padding: "0 10px",
              "border-radius": "999px",
              border: "0",
              background: "transparent",
              color: p().amDatLike ? C.rosu : C.stins,
              "font-family": "inherit",
              "font-size": "13px",
              "font-weight": 600,
              cursor: "pointer",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill={p().amDatLike ? "currentColor" : "none"}
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <Show when={p().nrLikes > 0}>{p().nrLikes}</Show>
          </button>
        </div>
      </div>
    </Card>
  );
}

/** Insigna de Banger a unui om, după câte a câștigat. Culorile = `website/src/components/BangerBadge.tsx`. */
function InsignaBanger(props: { nr: number }) {
  const t = () => tierPentruNumar(props.nr);
  const stil = () =>
    ({
      none: { bg: "rgba(255,255,255,0.08)", text: C.stins },
      bronze: { bg: "#CD7F32", text: "#fff" },
      silver: { bg: "#C0C0C0", text: "#000" },
      diamond: {
        bg: "linear-gradient(to right, #3AA0FF, #00E5D0)",
        text: "#000",
      },
    })[t().tier as "none" | "bronze" | "silver" | "diamond"] ?? {
      bg: C.camps,
      text: "#000",
    };
  return (
    <span
      style={{
        padding: "1px 6px",
        "border-radius": "999px",
        background: stil().bg,
        color: stil().text,
        "font-size": "11px",
        "font-weight": 700,
      }}
    >
      {t().nume}
      {t().cuContor ? ` ×${props.nr}` : ""}
    </span>
  );
}

function UrcaPiesa(props: {
  campId: string;
  sesiuni: SesiunePentruUrcare[];
  colegi: Coleg[];
  laUrcat: () => void;
}) {
  const sesiune = useSesiune();
  const [deschis, setDeschis] = createSignal(false);
  const [titlu, setTitlu] = createSignal("");
  const [fisier, setFisier] = createSignal<File | null>(null);
  const [sesiuneId, setSesiuneId] = createSignal("");
  const [colegi, setColegi] = createSignal<string[]>([]);
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");

  /** Durata din metadatele MP3-ului, în browser. Un eșec aici nu oprește urcarea. */
  const durata = (f: File) =>
    new Promise<number | null>((rez) => {
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        URL.revokeObjectURL(a.src);
        rez(Number.isFinite(a.duration) ? Math.round(a.duration) : null);
      };
      a.onerror = () => rez(null);
      a.src = URL.createObjectURL(f);
    });

  async function urca(e: SubmitEvent) {
    e.preventDefault();
    const f = fisier();
    if (!titlu().trim() || !f) {
      setEroare("Scrie titlul și alege un fișier MP3.");
      return;
    }
    setLucrez(true);
    setEroare("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("title", titlu().trim());
      if (sesiuneId()) fd.append("sessionId", sesiuneId());
      const d = await durata(f);
      if (d) fd.append("duration", String(d));
      fd.append("contributorIds", JSON.stringify(colegi()));
      await cerereCont(
        sesiune(),
        `/api/public/camps/${props.campId}/playlist`,
        { method: "POST", body: fd },
      );
      setTitlu("");
      setFisier(null);
      setSesiuneId("");
      setColegi([]);
      setDeschis(false);
      props.laUrcat();
    } catch (err) {
      setEroare(
        err instanceof Error && err.message !== "Cererea n-a mers."
          ? err.message
          : "Piesa n-a putut fi urcată.",
      );
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Show
      when={deschis()}
      fallback={
        <div>
          <ButonRoz onClick={() => setDeschis(true)}>
            <Symbol size={15}>upload</Symbol> Adaugă piesă
          </ButonRoz>
        </div>
      }
    >
      <Card style={{ padding: "16px" }}>
        <form
          onSubmit={urca}
          style={{ display: "flex", "flex-direction": "column", gap: "12px" }}
        >
          <p style={{ margin: 0, color: C.text, "font-weight": 700 }}>
            Adaugă piesă în playlist
          </p>
          <CampText
            eticheta="Titlu"
            valoare={titlu()}
            laSchimbare={setTitlu}
            placeholder="Deep House Jam v2"
          />
          <label style={{ display: "block" }}>
            <Eticheta2>Fișier MP3</Eticheta2>
            <input
              type="file"
              accept="audio/mpeg,.mp3"
              onChange={(e) => {
                setFisier(e.currentTarget.files?.[0] ?? null);
                setEroare("");
              }}
              style={{
                color: C.stins,
                "font-family": "inherit",
                "font-size": "13px",
              }}
            />
            <Show when={fisier()}>
              <span
                style={{
                  display: "block",
                  "margin-top": "4px",
                  color: C.slab,
                  "font-size": "12px",
                }}
              >
                {fisier()!.name} · {(fisier()!.size / 1024 / 1024).toFixed(1)}{" "}
                MB
              </span>
            </Show>
          </label>
          <Show when={props.sesiuni.length}>
            <CampAlege
              eticheta="Sesiunea în care a pornit (opțional)"
              valoare={sesiuneId()}
              laSchimbare={setSesiuneId}
              gol="Fără sesiune"
              optiuni={props.sesiuni.map((s) => ({
                valoare: s.id,
                text: `Sesiunea ${s.numar} - Studio ${s.studio.numar}`,
              }))}
            />
          </Show>
          <Show when={props.colegi.length}>
            <div>
              <Eticheta2>Cine a mai contribuit?</Eticheta2>
              <div
                style={{
                  "max-height": "180px",
                  "overflow-y": "auto",
                  padding: "6px",
                  "border-radius": "10px",
                  border: `1px solid ${C.linie}`,
                  background: "#0D0D0D",
                }}
              >
                <For each={props.colegi}>
                  {(c) => (
                    <label
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "8px",
                        padding: "6px 8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={colegi().includes(c.id)}
                        onChange={() =>
                          setColegi((l) =>
                            l.includes(c.id)
                              ? l.filter((x) => x !== c.id)
                              : [...l, c.id],
                          )
                        }
                      />
                      <span style={{ color: C.text, "font-size": "13.5px" }}>
                        {c.numeComplet}
                      </span>
                      <Show when={c.roles.length}>
                        <span style={{ color: C.slab, "font-size": "12px" }}>
                          {c.roles.join(", ")}
                        </span>
                      </Show>
                    </label>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <Show when={eroare()}>
            <span style={{ color: C.rosu, "font-size": "12.5px" }}>
              {eroare()}
            </span>
          </Show>
          <div style={{ display: "flex", gap: "8px" }}>
            <ButonRoz tip="submit" dezactivat={lucrez()}>
              {lucrez() ? "Se urcă…" : "Adaugă"}
            </ButonRoz>
            <button
              type="button"
              onClick={() => setDeschis(false)}
              style={{
                height: "42px",
                padding: "0 16px",
                "border-radius": "999px",
                border: `1px solid ${C.linie}`,
                background: "transparent",
                color: C.text,
                "font-family": "inherit",
                "font-size": "14px",
                cursor: "pointer",
              }}
            >
              Renunță
            </button>
          </div>
        </form>
      </Card>
    </Show>
  );
}
