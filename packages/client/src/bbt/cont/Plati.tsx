import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import { useQueryClient } from "@tanstack/solid-query";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, lei, useCont, useSesiune, ziLunga } from "./date";
import { Incarcare } from "./MyCamps";
import { ButonPlata, PlatesteTransa2 } from "./PlatesteTransa2";
import type { Inscriere, InscriereCurs, Plata } from "./tipuri";
import { C, Card, Mesaj, StareGoala, TitluPagina } from "./ui";

/**
 * BBT: „Plățile mele" în hub. Copia lui `website/src/app/dashboard/plati/page.tsx` +
 * `BlocTranse.tsx` + `MeniuInscriere.tsx`.
 *
 * ⚠️ Totul vine din UN singur răspuns `/me` (`useCont`), pentru ambele produse: două cereri ar fi
 * două momente diferite, deci un total de sus care poate să nu se potrivească cu rândurile.
 *
 * ⚠️ Cursurile n-au meniul de anulare, ca pe site: ruta cererii cere un `inscriereId` de TABĂRĂ și
 * ar da 404 pe un id de curs. Anularea unui curs se cere pe email.
 */

type Comanda = {
  id: string;
  produs: "camp" | "curs";
  numarComanda: string | null;
  titlu: string;
  subtitlu: string;
  statusPlata: string;
  nrTranse: number;
  plati: Plata[];
  penalizareTransa2?: number;
  zileIntarziereTransa2?: number;
  prelungireTransa2?: { zile: number; scadentaNoua: string } | null;
  cerereAnulare?: { id: string; status: string } | null;
};

const dinTabara = (i: Inscriere): Comanda => ({
  id: i.id,
  produs: "camp",
  numarComanda: i.numarComanda,
  titlu: i.camp.nume,
  subtitlu: ziLunga(i.camp.dataStart),
  statusPlata: i.statusPlata,
  nrTranse: i.nrTranse,
  plati: i.plati,
  penalizareTransa2: i.penalizareTransa2,
  zileIntarziereTransa2: i.zileIntarziereTransa2,
  prelungireTransa2: i.prelungireTransa2,
  cerereAnulare: i.cerereAnulare,
});

const dinCurs = (i: InscriereCurs): Comanda => ({
  id: i.id,
  produs: "curs",
  numarComanda: i.numarComanda,
  titlu: i.curs.titlu,
  subtitlu: `Curs · ${ziLunga(i.curs.dataStart)}`,
  statusPlata: i.statusPlata,
  nrTranse: i.nrTranse,
  plati: i.plati,
  penalizareTransa2: i.penalizareTransa2,
  zileIntarziereTransa2: i.zileIntarziereTransa2,
  prelungireTransa2: i.prelungireTransa2,
});

const inactiva = (status: string) =>
  status === "Anulat" || status === "Abandonat";

/**
 * Cât mai are omul efectiv de plătit pe o comandă: tranșele neachitate + penalizarea pe tranșa 2.
 * ⚠️ Penalizarea intră, altfel cifra mare de sus ar contrazice suma cerută la checkout. O comandă
 * anulată lasă tranșe „Asteptata" în bază, dar nu mai sunt datorate, deci iese întreagă.
 */
function restant(c: Comanda): number {
  if (inactiva(c.statusPlata)) return 0;
  const neplatit = c.plati
    .filter((p) => p.status === "Asteptata")
    .reduce((s, p) => s + p.suma, 0);
  const t2 = c.plati.some(
    (p) => p.numarTransa === 2 && p.status === "Asteptata",
  );
  return neplatit + (t2 ? (c.penalizareTransa2 ?? 0) : 0);
}

export function Plati() {
  const cont = useCont();
  const comenzi = () => [
    ...(cont.data?.inscrieri ?? []).map(dinTabara),
    ...(cont.data?.inscrieriCurs ?? []).map(dinCurs),
  ];
  const total = () => comenzi().reduce((t, c) => t + restant(c), 0);

  return (
    <>
      <TitluPagina>Plățile mele</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca plățile tale. Încearcă din nou peste un minut.
        </Mesaj>
      </Show>
      <Show when={!cont.isLoading} fallback={<Incarcare />}>
        <Show
          when={comenzi().length}
          fallback={
            <StareGoala
              simbol="payments"
              titlu="Nicio plată înregistrată"
              text="Plățile pentru tabere și cursuri apar aici."
            />
          }
        >
          <div style={{ "margin-bottom": "24px" }}>
            <p style={{ margin: 0, color: C.stins, "font-size": "13.5px" }}>
              Total de plată
            </p>
            <p
              style={{
                margin: "4px 0 0",
                "font-size": "44px",
                "line-height": "48px",
                "font-weight": 700,
                color: C.text,
              }}
            >
              {lei(total())}
            </p>
            <Show when={total() === 0}>
              <p
                style={{
                  margin: "6px 0 0",
                  color: C.stins,
                  "font-size": "14px",
                }}
              >
                Ești la zi, nu ai nimic de plătit.
              </p>
            </Show>
          </div>
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
          >
            <For each={comenzi()}>{(c) => <CardComanda comanda={c} />}</For>
          </div>
        </Show>
      </Show>
    </>
  );
}

function EtichetaStatus(props: { status: string }) {
  const achitat = () =>
    ["Achitat", "Achitat 2/2", "Oferta"].includes(props.status);
  return (
    <span
      style={{
        padding: "3px 10px",
        "border-radius": "999px",
        "font-size": "12px",
        "font-weight": 600,
        "white-space": "nowrap",
        background: achitat()
          ? "rgba(91,208,138,0.12)"
          : inactiva(props.status)
            ? "rgba(255,255,255,0.06)"
            : "rgba(224,168,84,0.14)",
        color: achitat()
          ? C.verde
          : inactiva(props.status)
            ? C.slab
            : C.chihlimbar,
      }}
    >
      {props.status}
    </span>
  );
}

function CardComanda(props: { comanda: Comanda }) {
  const c = () => props.comanda;
  const t1 = () => c().plati.find((p) => p.numarTransa === 1);
  const t2Neplatita = () =>
    c().plati.some((p) => p.numarTransa === 2 && p.status === "Asteptata");
  // 🔴 Tranșa 2 DOAR după ce prima e plătită: o comandă din CRM stă cu ambele pe „Asteptata".
  // `=== "Platita"` strict: o tranșă 1 rambursată = comandă desfăcută, nu una gata de rata a doua.
  const t1Platita = () => t1()?.status === "Platita";
  // Comanda deschisă de seller/admin (audit 3 oct 2026, G22): prima rată se plătește de aici.
  const deschisa = () =>
    ["Inscris", "LinkTrimis", "Programat"].includes(c().statusPlata);

  return (
    <Card style={{ padding: "18px" }}>
      <div
        style={{
          display: "flex",
          "align-items": "flex-start",
          "justify-content": "space-between",
          gap: "12px",
          "margin-bottom": "12px",
        }}
      >
        <div style={{ "min-width": 0 }}>
          <Show when={c().numarComanda}>
            <p
              style={{
                margin: "0 0 2px",
                color: C.slab,
                "font-size": "12px",
                "font-family": "monospace",
              }}
            >
              {c().numarComanda}
            </p>
          </Show>
          <p
            style={{
              margin: 0,
              color: C.text,
              "font-size": "15.5px",
              "font-weight": 600,
            }}
          >
            {c().titlu}
          </p>
          <p
            style={{ margin: "2px 0 0", color: C.stins, "font-size": "12.5px" }}
          >
            {c().subtitlu}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "6px",
            "flex-shrink": 0,
          }}
        >
          <EtichetaStatus status={c().statusPlata} />
          <Show when={c().produs === "camp" && !inactiva(c().statusPlata)}>
            <MeniuAnulare
              inscriereId={c().id}
              statusCerere={c().cerereAnulare?.status}
            />
          </Show>
        </div>
      </div>

      <div style={{ display: "flex", "flex-direction": "column" }}>
        <For each={c().plati}>
          {(p, i) => (
            <RandTransa
              plata={p}
              eticheta={
                c().nrTranse === 1
                  ? "Plată integrală"
                  : `Tranșa ${p.numarTransa}`
              }
              statusComanda={c().statusPlata}
              primul={i() === 0}
            />
          )}
        </For>
      </div>

      {/* Prelungirea vorbită la telefon, scrisă pe ecran: omul care a sunat ca să nu primească
          penalizare trebuie să VADĂ că a primit-o. ⚠️ Fără motiv și fără numele sellerului. */}
      <Show
        when={
          c().prelungireTransa2 && !inactiva(c().statusPlata) && t2Neplatita()
        }
      >
        <div
          style={{
            margin: "10px 0 0",
            padding: "12px 14px",
            "border-radius": "12px",
            background: "rgba(91,208,138,0.1)",
            color: C.verde,
            "font-size": "13.5px",
            "line-height": "1.45",
          }}
        >
          <b>
            Ai primit o prelungire pentru tranșa 2 de{" "}
            {c().prelungireTransa2!.zile}{" "}
            {c().prelungireTransa2!.zile === 1 ? "zi" : "zile"}.
          </b>{" "}
          Noua scadență e {ziLunga(c().prelungireTransa2!.scadentaNoua)}. Până
          atunci nu se aplică nicio penalizare.
        </div>
      </Show>

      <Show when={deschisa() && t1()?.status === "Asteptata"}>
        <div style={{ "margin-top": "12px" }}>
          <ButonPlata
            cale="/api/public/checkout/comanda"
            corp={{ fel: c().produs, comandaId: c().id }}
            eticheta={`${c().nrTranse === 1 ? "Plătește" : "Plătește tranșa 1"} - ${lei(t1()!.suma)}`}
          />
        </div>
      </Show>

      <Show when={!inactiva(c().statusPlata) && t2Neplatita() && t1Platita()}>
        <div style={{ "margin-top": "12px" }}>
          <PlatesteTransa2
            comandaId={c().id}
            produs={c().produs}
            pret={c().plati.find((p) => p.numarTransa === 2)!.suma}
            penalizare={c().penalizareTransa2 ?? 0}
            zileIntarziere={c().zileIntarziereTransa2 ?? 0}
          />
        </div>
      </Show>
    </Card>
  );
}

const STATUS_TRANSA: Record<string, string> = {
  Asteptata: "În așteptare",
  Platita: "Plătit",
  Rambursata: "Rambursat",
  RambursataPartial: "Rambursat parțial",
};

function RandTransa(props: {
  plata: Plata;
  eticheta: string;
  statusComanda: string;
  primul: boolean;
}) {
  const p = () => props.plata;
  const platit = () => p().status === "Platita";
  const rambursat = () =>
    p().status === "Rambursata" || p().status === "RambursataPartial";
  // O comandă anulată lasă tranșele neplătite pe „Asteptata": nu mai sunt datorate, deci le arătăm
  // anulate, nu „în așteptare" cu scadență.
  const anulata = () =>
    inactiva(props.statusComanda) && p().status === "Asteptata";
  const culoare = () =>
    anulata()
      ? C.slab
      : platit()
        ? C.verde
        : rambursat()
          ? C.stins
          : C.chihlimbar;
  const simbol = () =>
    anulata()
      ? "block"
      : platit()
        ? "check_circle"
        : rambursat()
          ? "refresh"
          : "schedule";

  return (
    <div
      style={{
        padding: "10px 0",
        "border-top": props.primul ? "0" : `1px solid ${C.linie}`,
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
          <span style={{ color: culoare(), display: "flex" }}>
            <Symbol size={18}>{simbol()}</Symbol>
          </span>
          <div>
            <p
              style={{
                margin: 0,
                color: C.text,
                "font-size": "14.5px",
                "font-weight": 500,
              }}
            >
              {props.eticheta}
            </p>
            <Show
              when={!anulata() && p().status === "Asteptata" && p().scadentaLa}
            >
              <p
                style={{ margin: 0, color: C.chihlimbar, "font-size": "12px" }}
              >
                Scadentă: {ziLunga(p().scadentaLa!)}
              </p>
            </Show>
            <Show when={rambursat() && (p().sumaRambursata ?? 0) > 0}>
              <p style={{ margin: 0, color: C.stins, "font-size": "12px" }}>
                Rambursat: {lei(p().sumaRambursata ?? 0)}
              </p>
            </Show>
          </div>
        </div>
        <div style={{ "text-align": "right" }}>
          <p
            style={{
              margin: 0,
              color: C.text,
              "font-size": "14.5px",
              "font-weight": 500,
            }}
          >
            {lei(p().suma)}
          </p>
          <p
            style={{
              margin: 0,
              color: culoare(),
              "font-size": "12px",
              "font-weight": 600,
            }}
          >
            {anulata()
              ? props.statusComanda
              : (STATUS_TRANSA[p().status] ?? p().status)}
          </p>
        </div>
      </div>
      <Show when={p().fgoFacturaLink}>
        <a
          href={p().fgoFacturaLink!}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            "align-items": "center",
            gap: "6px",
            "margin-top": "6px",
            "padding-left": "28px",
            color: C.stins,
            "font-size": "12.5px",
            "text-decoration": "none",
          }}
        >
          <Symbol size={13}>receipt_long</Symbol> Factură {p().fgoFacturaSerie}-
          {p().fgoFacturaNumar}
        </a>
      </Show>
    </div>
  );
}

/**
 * Meniul discret (⋮) cu cererea de anulare: ascunsă dinadins, ca să nu fie prima acțiune la
 * îndemână (design 2026-07-20). După o respingere se poate cere din nou (audit 3 oct 2026, G24).
 *
 * ⚠️ Fereastra cererii e în `Portal`, pe `body`: pe telefon contul stă într-un SlideDrawer mutat
 * cu `transform`, iar un `position: fixed` dinăuntru s-ar fi poziționat față de drawer, nu de ecran.
 */
function MeniuAnulare(props: { inscriereId: string; statusCerere?: string }) {
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [meniu, setMeniu] = createSignal(false);
  const [formular, setFormular] = createSignal(false);
  const [motiv, setMotiv] = createSignal("");
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  let cutie: HTMLDivElement | undefined;

  onMount(() => {
    const afara = (e: PointerEvent) => {
      if (cutie && !cutie.contains(e.target as Node)) setMeniu(false);
    };
    document.addEventListener("pointerdown", afara);
    onCleanup(() => document.removeEventListener("pointerdown", afara));
  });

  const trimisa = () => Boolean(props.statusCerere);
  const textStare = () =>
    props.statusCerere === "Respins"
      ? "Cerere respinsă"
      : props.statusCerere === "Executat"
        ? "Anulare executată"
        : "Cerere de anulare în curs";

  async function trimite() {
    setEroare("");
    setLucrez(true);
    try {
      await cerereCont(
        sesiune(),
        `/api/public/participant/inscrieri/${props.inscriereId}/cerere-anulare`,
        { method: "POST", body: JSON.stringify({ motiv: motiv() }) },
      );
      setFormular(false);
      // Starea cererii vine tot din `/me`: o cerem din nou, ca meniul să arate „în curs".
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
    } catch (e) {
      setEroare(
        e instanceof Error ? e.message : "Cererea n-a putut fi trimisă.",
      );
    } finally {
      setLucrez(false);
    }
  }

  return (
    <div ref={cutie} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Opțiuni înscriere"
        onClick={() => setMeniu((m) => !m)}
        style={{
          width: "30px",
          height: "30px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "999px",
          border: "0",
          background: meniu() ? "rgba(255,255,255,0.08)" : "transparent",
          color: C.stins,
          cursor: "pointer",
        }}
      >
        <Symbol size={18}>more_vert</Symbol>
      </button>
      <Show when={meniu()}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "34px",
            "z-index": 10,
            width: "230px",
            padding: "6px 0",
            "border-radius": "12px",
            border: `1px solid ${C.linie}`,
            background: C.foaieTare,
            "box-shadow": "0 16px 48px rgba(0,0,0,0.6)",
          }}
        >
          <Show when={trimisa()}>
            <p
              style={{
                margin: 0,
                padding: "8px 12px",
                color: C.stins,
                "font-size": "12.5px",
              }}
            >
              {textStare()}
            </p>
          </Show>
          <Show when={!trimisa() || props.statusCerere === "Respins"}>
            <button
              type="button"
              onClick={() => {
                setMeniu(false);
                setFormular(true);
              }}
              style={{
                display: "flex",
                "align-items": "center",
                gap: "8px",
                width: "100%",
                padding: "10px 12px",
                border: "0",
                background: "transparent",
                color: C.rosu,
                "font-family": "inherit",
                "font-size": "13.5px",
                "text-align": "left",
                cursor: "pointer",
              }}
            >
              <Symbol size={15}>cancel</Symbol>
              {trimisa()
                ? "Cere din nou anularea"
                : "Cere anularea participării"}
            </button>
          </Show>
        </div>
      </Show>

      <Show when={formular()}>
        <Portal>
          <div
            onClick={() => setFormular(false)}
            style={{
              position: "fixed",
              inset: 0,
              "z-index": 1000,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              padding: "16px",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <div
              role="dialog"
              aria-label="Cerere de anulare"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                "max-width": "420px",
                padding: "20px",
                "border-radius": "16px",
                border: `1px solid ${C.linie}`,
                background: C.foaie,
                color: C.text,
                "font-family": "inherit",
              }}
            >
              <p
                style={{
                  margin: 0,
                  "font-weight": 700,
                  "font-size": "16px",
                  color: C.rosu,
                }}
              >
                Cerere de anulare
              </p>
              <p
                style={{
                  margin: "6px 0 12px",
                  color: C.stins,
                  "font-size": "13px",
                  "line-height": "1.45",
                }}
              >
                Te contactează echipa noastră ca să stabilim ce rambursare se
                aplică.
              </p>
              <textarea
                rows={3}
                placeholder="Motiv (opțional)"
                value={motiv()}
                onInput={(e) => setMotiv(e.currentTarget.value)}
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
                  resize: "none",
                  outline: "none",
                }}
              />
              <Show when={eroare()}>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: C.rosu,
                    "font-size": "12.5px",
                  }}
                >
                  {eroare()}
                </p>
              </Show>
              <div
                style={{ display: "flex", gap: "8px", "margin-top": "14px" }}
              >
                <button
                  type="button"
                  onClick={() => setFormular(false)}
                  style={{
                    flex: 1,
                    height: "40px",
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
                {/* Roșu, nu roz: e o acțiune care desface ceva. Rozul rămâne pentru „mergi mai departe". */}
                <button
                  type="button"
                  disabled={lucrez()}
                  onClick={trimite}
                  style={{
                    flex: 1,
                    height: "40px",
                    "border-radius": "999px",
                    border: "0",
                    background: "#E5484D",
                    color: "#fff",
                    "font-family": "inherit",
                    "font-size": "14px",
                    "font-weight": 700,
                    cursor: lucrez() ? "default" : "pointer",
                    opacity: lucrez() ? 0.6 : 1,
                  }}
                >
                  {lucrez() ? "Se trimite…" : "Trimite cererea"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
