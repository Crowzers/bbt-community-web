import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../../tokenBbt";
import { useSesiune } from "../date";
import { C, Card, StareGoala } from "../ui";

import { tierPentruNumar } from "./continut";
import { oSinguraPiesa } from "./redareUnica";
import { deschideStreamCont } from "./streamCont";

/**
 * BBT: fila „Piese” a taberei în hub (până pe 22 nov 2026 „Playlist”). Copia părții „Piese" din
 * `website/src/app/my-camp/[id]/MyCampTabs.tsx`.
 *
 * Butonul „Adaugă piesă” a plecat de aici pe 22 nov 2026 (D2 din `admin/docs/plans/2026-11-22-piesa-sesiunii-artwork-design.md`):
 * piesa se încarcă din cardul sesiunii ei (`IncarcaPiesaSesiunii.tsx`), cu artwork pătrat obligatoriu. Fără sesiune piesa nu
 * știa din ce studio vine.
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
  /** Artwork-ul piesei. Piesele de dinainte de 22 nov 2026 n-au, și cad pe imaginea taberei. */
  coverUrl?: string | null;
  /** Sesiunea în care s-a lucrat: cardul sesiunii își arată piesele după ea. */
  sessionId?: string | null;
  duration: number | null;
  isBanger: boolean;
  ascunsa: boolean;
  studio: number | null;
  uploadedBy: { id: string; numeComplet: string };
  /** `null` cât clasamentul e ascuns: votul e deschis și omul încă n-a votat (21 nov 2026). */
  nrVoturi: number | null;
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
  /** Numele de scenă: după el se caută autorii piesei (22 nov 2026). */
  numeAfisat?: string | null;
  avatarUrl?: string | null;
  /** Unde duce apăsarea pe om (25 nov 2026): profilul scurt din Community, altfel profilul public de pe site. */
  stoatUserId?: string | null;
  username?: string | null;
  roles: string[];
}

const prenume = (n: string) => n.split(" ")[0];

export function Playlist(props: {
  campId: string;
  dataEnd: string;
  initiale: Piesa[];
  /** Coperta de arătat: artwork-ul piesei sau, la piesele vechi, imaginea taberei. */
  coperta: (p: Piesa) => string | null;
  /** Duce la fila Sesiuni, de unde se încarcă piesele. */
  laSesiuni: () => void;
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
      <p
        style={{
          margin: 0,
          padding: "16px",
          "border-radius": "24px",
          background: C.foaie,
          color: C.text,
          "font-size": "16px",
        }}
      >
        Piesele se încarcă din sesiunea în care ai lucrat la ele.{" "}
        <button
          type="button"
          onClick={() => props.laSesiuni()}
          style={{
            padding: 0,
            border: 0,
            background: "transparent",
            color: C.text,
            "font-family": "inherit",
            "font-size": "16px",
            "font-weight": 600,
            "text-decoration": "underline",
            "text-underline-offset": "4px",
            cursor: "pointer",
          }}
        >
          Mergi la Sesiuni
        </button>
      </p>
      <Show
        when={piese().length}
        fallback={
          <StareGoala
            titlu="Nicio piesă încă"
            text="Piesele din studio apar aici, cu voturile lor."
          />
        }
      >
        <For each={piese()}>
          {(p) => (
            <CardPiesa
              piesa={p}
              coperta={props.coperta(p)}
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
  coperta: string | null;
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
      <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
        <Show
          when={props.coperta}
          fallback={
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "12px",
                background: C.galben,
                "flex-shrink": 0,
              }}
            />
          }
        >
          {(url) => (
            <img
              src={url()}
              alt=""
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "12px",
                "object-fit": "cover",
                "flex-shrink": 0,
              }}
            />
          )}
        </Show>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "4px",
            "min-width": 0,
            flex: 1,
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
                "font-size": "16px",
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
                  "font-size": "14px",
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
              "font-size": "14px",
            }}
          >
            <Show when={p().studio != null}>
              <span>Studio {p().studio}</span>
            </Show>
            <span>Urcată de {prenume(p().uploadedBy.numeComplet)}</span>
            {/* `null` = clasamentul ascuns cât omul n-a votat (21 nov 2026): nu arătăm nici „Fără voturi încă”. */}
            <Show when={p().nrVoturi !== null}>
              <span
                style={{
                  color: (p().nrVoturi ?? 0) > 0 ? C.text : C.slab,
                  "font-weight": (p().nrVoturi ?? 0) > 0 ? 600 : 400,
                }}
              >
                {(p().nrVoturi ?? 0) > 0
                  ? `${p().nrVoturi} ${p().nrVoturi === 1 ? "vot" : "voturi"}`
                  : "Fără voturi încă"}
              </span>
            </Show>
          </div>
        </div>
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
                  "font-size": "14px",
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
      {/* Înscris în `redareUnica.ts`: pornit aici, tac piesa de pe cardul sesiunii și ascultarea din formular. */}
      <audio
        ref={(el) => onCleanup(oSinguraPiesa(el))}
        controls
        preload="none"
        src={p().url}
        style={{ width: "100%", height: "36px", "color-scheme": "light" }}
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
            <span style={{ color: C.slab, "font-size": "14px" }}>
              Piesa la care ai contribuit: nu o poți vota
            </span>
          }
        >
          <Show
            when={!props.votareInchisa}
            fallback={
              <Show when={p().votulMeu}>
                <span style={{ color: C.stins, "font-size": "14px" }}>
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
                background: p().votulMeu ? C.camps : C.fundal,
                color: p().votulMeu ? "#000" : C.text,
                "font-family": "inherit",
                "font-size": "14px",
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
                "font-size": "14px",
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
              "font-size": "14px",
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
      none: { bg: C.fundal, text: C.stins },
      bronze: { bg: "#CD7F32", text: C.peNegru },
      silver: { bg: "#C0C0C0", text: "#000" },
      diamond: {
        bg: "linear-gradient(to right, #4DA2FF, #55DB9C)",
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
        "font-size": "14px",
        "font-weight": 700,
      }}
    >
      {t().nume}
      {t().cuContor ? ` ×${props.nr}` : ""}
    </span>
  );
}
