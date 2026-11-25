import { For, JSX, Show } from "solid-js";

import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../../config";
import type { CalendarTabara, Moment } from "../calendarIcs";
import { adaugaInCalendar } from "../CumAjungi";
import type { LinkuriNavigare } from "../tipuri";
import { Buton, C, Card } from "../ui";

/**
 * BBT: blocurile variantei A din fila de informații a taberei (25 nov 2026), copia comportamentului de pe site
 * (`website/src/app/[limba]/my-camp/[id]/InfoTabara.tsx`) și din aplicație (`mobil/src/app/tabara/[id].tsx`). Stau sus în
 * prima filă, deasupra programului. Plata și actele au deja cardul lor în capul paginii (`PlataSiDocumente`, 23e), deci
 * „Plătește” duce acolo.
 */

export interface Pregatire {
  contract: {
    semnat: boolean;
    link: string | null;
    semnatar: "tu" | "parinte" | "firma" | null;
  } | null;
  plata: {
    numarTransa: number;
    suma: number;
    scadentaLa: string | null;
    actiune: string;
  } | null;
  masa: boolean;
  profil: boolean;
}

const TITLU: JSX.CSSProperties = {
  margin: "0 0 6px",
  color: C.text,
  "font-size": "18px",
  "font-weight": 700,
};

const lei = (n: number) => `${n.toLocaleString("ro-RO")} lei`;
const zi = (iso: string) =>
  new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });

function Rand(props: {
  gata: boolean;
  text: string;
  detaliu?: string | null;
  buton?: JSX.Element;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        padding: "9px 0",
        "border-top": `1px solid ${C.linie}`,
      }}
    >
      <Show
        when={props.gata}
        fallback={
          <span
            style={{
              width: "20px",
              height: "20px",
              "border-radius": "50%",
              border: `2px solid ${C.slab}`,
              "flex-shrink": 0,
            }}
          />
        }
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            "border-radius": "50%",
            background: "#99E9C4",
            color: "#216043",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "flex-shrink": 0,
          }}
        >
          <Symbol size={14}>check</Symbol>
        </span>
      </Show>
      <div style={{ flex: 1, "min-width": 0 }}>
        <p style={{ margin: 0, color: C.text, "font-size": "16px" }}>
          {props.text}
        </p>
        <Show when={props.detaliu}>
          <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
            {props.detaliu}
          </p>
        </Show>
      </div>
      <Show when={!props.gata && props.buton}>{props.buton}</Show>
    </div>
  );
}

/** „Pregătirea ta”: contractul, plata, masa și profilul. Doar înainte de tabără. Roz doar „Plătește” (userul, 25 nov 2026). */
export function PregatireaTa(props: {
  p: Pregatire;
  laPlata: () => void;
  laMasa: () => void;
}) {
  const navigate = useNavigate();
  const c = () => props.p.contract;
  const plata = () => props.p.plata;
  return (
    <Card style={{ padding: "18px" }}>
      <p style={TITLU}>Pregătirea ta</p>
      <Show when={c()}>
        {(k) => (
          <Rand
            gata={k().semnat}
            text={k().semnat ? "Contract semnat" : "Contractul de semnat"}
            detaliu={
              !k().semnat && !k().link
                ? k().semnatar === "firma"
                  ? "Îl semnează firma, din emailul primit"
                  : "Îl semnează părintele, din emailul primit"
                : null
            }
            buton={
              k().link ? (
                <Buton
                  piele="negru"
                  mic
                  href={`${BBT_SITE_URL}${k().link}`}
                  target="_blank"
                >
                  Semnează
                </Buton>
              ) : undefined
            }
          />
        )}
      </Show>
      <Rand
        gata={!plata()}
        text={
          plata()
            ? plata()!.actiune === "integral"
              ? `Plata · ${lei(plata()!.suma)}`
              : `Rata ${plata()!.numarTransa} · ${lei(plata()!.suma)}`
            : "Plata e făcută"
        }
        detaliu={
          plata()?.scadentaLa ? `până pe ${zi(plata()!.scadentaLa!)}` : null
        }
        buton={
          <Buton piele="roz" mic onClick={() => props.laPlata()}>
            Plătește
          </Buton>
        }
      />
      <Rand
        gata={props.p.masa}
        text="Preferințe masă"
        buton={
          <Buton piele="negru" mic onClick={() => props.laMasa()}>
            Completează
          </Buton>
        }
      />
      <Rand
        gata={props.p.profil}
        text="Profilul tău"
        buton={
          <Buton piele="negru" mic onClick={() => navigate("/cont/profil")}>
            Completează
          </Buton>
        }
      />
    </Card>
  );
}

const cand = (m: Moment) => {
  const z = new Date(`${m.data}T12:00:00`).toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return m.ora ? `${z}, ${m.ora}` : z;
};

function Linie(props: { simbol: string; children: JSX.Element }) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        padding: "8px 0",
        "border-top": `1px solid ${C.linie}`,
        color: C.text,
        "font-size": "16px",
      }}
    >
      <span style={{ display: "flex", color: C.stins }}>
        <Symbol size={18}>{props.simbol}</Symbol>
      </span>
      {props.children}
    </div>
  );
}

/** „Cum ajungi”: adresa, sosirea și plecarea din program, Waze, Google Maps și calendarul. */
export function CumAjungiBloc(props: {
  id: string;
  locatie: string;
  navigare?: LinkuriNavigare | null;
  calendar?: CalendarTabara | null;
}) {
  return (
    <Card style={{ padding: "18px" }}>
      <p style={TITLU}>Cum ajungi</p>
      <Linie simbol="location_on">{props.locatie}</Linie>
      <Show when={props.calendar}>
        {(k) => (
          <>
            <Linie simbol="login">Sosirea · {cand(k().sosire)}</Linie>
            <Linie simbol="logout">Plecarea · {cand(k().plecare)}</Linie>
          </>
        )}
      </Show>
      <Show when={props.navigare}>
        {(n) => (
          <div style={{ display: "flex", gap: "8px", "margin-top": "10px" }}>
            <div style={{ flex: 1, display: "flex" }}>
              <Buton lat href={n().waze} target="_blank">
                Waze
              </Buton>
            </div>
            <div style={{ flex: 1, display: "flex" }}>
              <Buton lat href={n().google} target="_blank">
                Google Maps
              </Buton>
            </div>
          </div>
        )}
      </Show>
      <Show when={props.calendar}>
        {(k) => (
          <div style={{ "margin-top": "8px", display: "flex" }}>
            <Buton
              lat
              piele="alb"
              onClick={() => adaugaInCalendar(k(), props.id)}
            >
              Adaugă în calendar
            </Buton>
          </div>
        )}
      </Show>
    </Card>
  );
}

/** „Ce să iei cu tine”: lista scrisă de echipă în admin. */
export function CeIeiCuTine(props: { lista: string[] }) {
  return (
    <Card style={{ padding: "18px" }}>
      <p style={TITLU}>Ce să iei cu tine</p>
      <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
        <For each={props.lista}>
          {(x) => (
            <div
              style={{
                display: "flex",
                gap: "10px",
                color: C.text,
                "font-size": "16px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  "border-radius": "50%",
                  background: C.text,
                  "margin-top": "9px",
                  "flex-shrink": 0,
                }}
              />
              {x}
            </div>
          )}
        </For>
      </div>
    </Card>
  );
}

/** Votul de Banger, sus, cât e deschis după tabără. Butonul duce la fila „Piese”. */
export function VotDeschis(props: {
  panaLa?: string | null;
  laPiese: () => void;
}) {
  return (
    <div
      style={{
        "border-radius": "28px",
        background: C.rozDeschis,
        padding: "18px",
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
      }}
    >
      <p style={{ ...TITLU, margin: 0 }}>Votează Bangerul taberei</p>
      <Show when={props.panaLa}>
        <p style={{ margin: 0, color: C.text, "font-size": "16px" }}>
          Votul e deschis până pe {zi(props.panaLa!)}. Alege piesa care ți-a
          rămas în cap.
        </p>
      </Show>
      <div style={{ display: "flex" }}>
        <Buton piele="roz" onClick={() => props.laPiese()}>
          Mergi la piese
        </Buton>
      </div>
    </div>
  );
}
