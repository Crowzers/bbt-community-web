import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../tokenBbt";

import {
  CHEIE_CONT,
  lei,
  useCont,
  useExperiente,
  useSesiune,
  zi,
  ziCuAn,
  ziLunga,
} from "./date";
import { ButonPlateste } from "./Plata";
import type {
  Inscriere,
  InscriereCurs,
  Plata,
  PlataExperienta,
} from "./tipuri";
import {
  Buton,
  C,
  DE_FONTE,
  Eticheta,
  Fereastra,
  Incarcare,
  Mesaj,
  Pastila,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Plăți" în hub (23d, 30 oct 2026): sus cât ai de plătit și cât ai plătit, dedesubt toate tranzacțiile, cu
 * factura fiecăreia. Până atunci, copia lui `website/src/app/dashboard/plati/page.tsx` (câte un card pe comandă).
 *
 * Ce e altfel decât în 23d, dinadins:
 * - Fără cardul „Card salvat" și fără „Schimbă cardul": plata trece prin pagina Stripe, fără card ținut de noi
 *   (alegerea userului, 30 oct; vezi `Plata.tsx`).
 * - „Plătit în total", nu „Plătit în 2026": un an în titlu ar fi ascuns banii de anul trecut fără să spună.
 * - Sub tranzacții rămân comenzile, cu ce nu încape într-un rând: prelungirea scadenței și cererea de anulare.
 *
 * ⚠️ Totul vine din UN singur răspuns `/me` (`useCont`), pentru ambele produse: două cereri ar fi două momente
 * diferite, deci un total de sus care poate să nu se potrivească cu rândurile. Butonul „Plătește" vine din
 * `participant/experiente`, ca suma și ruta lui să fie exact cele din Experiențele mele.
 *
 * ⚠️ Cursurile n-au meniul de anulare, ca pe site: ruta cererii cere un `inscriereId` de TABĂRĂ și ar da 404 pe un
 * id de curs. Anularea unui curs se cere pe email.
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

type Tranzactie = { comanda: Comanda; plata: Plata; data: string | null };

export function Plati() {
  const cont = useCont();
  const experiente = useExperiente();
  const comenzi = () => [
    ...(cont.data?.inscrieri ?? []).map(dinTabara),
    ...(cont.data?.inscrieriCurs ?? []).map(dinCurs),
  ];
  const total = () => comenzi().reduce((t, c) => t + restant(c), 0);
  const platit = () =>
    comenzi()
      .flatMap((c) => c.plati)
      .filter((p) => p.status === "Platita")
      .reduce((s, p) => s + p.suma, 0);
  const cuPlati = () =>
    comenzi().filter((c) => c.plati.some((p) => p.status === "Platita")).length;

  // Plățile care se pot face acum, după comandă: aceleași ca butoanele din Experiențele mele.
  const deFacut = () => {
    const m = new Map<string, PlataExperienta>();
    for (const e of experiente.data?.active ?? []) {
      if (e.plata) m.set(e.plata.comandaId, e.plata);
    }
    return m;
  };
  const urmatoarea = () =>
    [...deFacut().values()].sort((a, b) =>
      (a.scadentaLa ?? "9").localeCompare(b.scadentaLa ?? "9"),
    )[0];

  // Cea mai nouă sus: o plată făcută după data ei, una de făcut după scadență. Fără dată, la coadă.
  const tranzactii = (): Tranzactie[] =>
    comenzi()
      .flatMap((c) =>
        c.plati.map((p) => ({
          comanda: c,
          plata: p,
          data:
            p.status === "Asteptata"
              ? p.scadentaLa
              : (p.platitaLa ?? p.scadentaLa),
        })),
      )
      .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));

  return (
    <>
      <TitluPagina>Plăți</TitluPagina>
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
              titlu="Nicio plată încă"
              text="Plățile pentru tabere și cursuri apar aici, cu factura fiecăreia."
            />
          }
        >
          <div
            style={{
              display: "grid",
              "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              "margin-bottom": "28px",
            }}
          >
            <Rezumat
              eticheta="De plătit"
              suma={total()}
              fundal={total() > 0 ? C.galbenDeschis : C.foaie}
              sub={
                total() === 0
                  ? "Ești la zi."
                  : urmatoarea()
                    ? `${urmatoarea()!.actiune === "integral" ? "Plata integrală" : `Rata ${urmatoarea()!.numarTransa}`}${urmatoarea()!.scadentaLa ? ` · ${zi(urmatoarea()!.scadentaLa!)}` : ""}`
                    : ""
              }
            />
            <Rezumat
              eticheta="Plătit în total"
              suma={platit()}
              fundal={C.foaie}
              sub={`${cuPlati()} ${cuPlati() === 1 ? "experiență" : "experiențe"}`}
            />
          </div>

          <div style={{ "margin-bottom": "10px" }}>
            <Eticheta>Toate tranzacțiile</Eticheta>
          </div>
          <div
            class="bbt-tranzactii"
            style={{
              "border-radius": "24px",
              background: C.foaie,
              padding: "6px 20px",
              "margin-bottom": "28px",
            }}
          >
            <For each={tranzactii()}>
              {(t, i) => (
                <RandTranzactie
                  t={t}
                  primul={i() === 0}
                  deFacut={deFacut().get(t.comanda.id)}
                />
              )}
            </For>
          </div>

          <div style={{ "margin-bottom": "10px" }}>
            <Eticheta>Comenzile tale</Eticheta>
          </div>
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "10px" }}
          >
            <For each={comenzi()}>{(c) => <RandComanda comanda={c} />}</For>
          </div>
        </Show>
      </Show>
    </>
  );
}

function Rezumat(props: {
  eticheta: string;
  suma: number;
  sub: string;
  fundal: string;
}) {
  return (
    <div
      style={{
        padding: "20px 22px",
        "border-radius": "24px",
        background: props.fundal,
      }}
    >
      <Eticheta culoare={C.text}>{props.eticheta}</Eticheta>
      <p
        style={{
          ...DE_FONTE,
          margin: "6px 0 2px",
          "font-size": "34px",
          "line-height": "1.1",
        }}
      >
        {lei(props.suma)}
      </p>
      <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
        {props.sub}
      </p>
    </div>
  );
}

const STATUS_TRANSA: Record<string, string> = {
  Asteptata: "Urmează",
  Platita: "Plătit",
  // Oferta de 100% aprobată de admin: tranșa nu se mai plătește, deci nu stă „în așteptare".
  Oferta: "Fără plată",
  Rambursata: "Rambursat",
  RambursataPartial: "Rambursat parțial",
};

function RandTranzactie(props: {
  t: Tranzactie;
  primul: boolean;
  deFacut?: PlataExperienta;
}) {
  const c = () => props.t.comanda;
  const p = () => props.t.plata;
  // O comandă anulată lasă tranșele neplătite pe „Asteptata": nu mai sunt datorate, deci le arătăm
  // anulate, nu „urmează".
  const anulata = () => inactiva(c().statusPlata) && p().status === "Asteptata";
  const platit = () => p().status === "Platita" || p().status === "Oferta";
  // Butonul doar pe rândul ratei pe care o cere serverul acum (nu pe tranșa 2 cât tranșa 1 e neplătită).
  const plateste = () =>
    props.deFacut && props.deFacut.numarTransa === p().numarTransa && !anulata()
      ? props.deFacut
      : undefined;

  return (
    // Grila e în `bbt/raspuns.css` (`.bbt-tranzactie`): pe îngust rândul se desface pe trei linii.
    <div
      class="bbt-tranzactie"
      style={{
        padding: "14px 0",
        "border-top": props.primul ? "0" : `1px solid ${C.linie}`,
      }}
    >
      <span class="data" style={{ color: C.stins, "font-size": "14px" }}>
        {props.t.data ? ziCuAn(props.t.data) : ""}
      </span>
      <span
        class="titlu"
        style={{
          "font-size": "16px",
          "font-weight": 600,
          "min-width": 0,
          overflow: "hidden",
          "text-overflow": "ellipsis",
          "white-space": "nowrap",
        }}
      >
        {c().titlu} ·{" "}
        {c().nrTranse === 1 ? "Plată integrală" : `Rata ${p().numarTransa}`}
        <Show when={(p().sumaRambursata ?? 0) > 0}>
          <span style={{ color: C.stins, "font-weight": 400 }}>
            {" "}
            · rambursat {lei(p().sumaRambursata ?? 0)}
          </span>
        </Show>
      </span>
      <span
        class="suma"
        style={{
          "font-size": "16px",
          "font-weight": 700,
          "white-space": "nowrap",
        }}
      >
        {lei(p().suma)}
      </span>
      <span class="stare">
        <Show
          when={plateste()}
          fallback={
            <Pastila
              fel={
                anulata()
                  ? "neutru"
                  : platit()
                    ? "ok"
                    : p().status === "Asteptata"
                      ? "asteapta"
                      : "neutru"
              }
            >
              {anulata()
                ? c().statusPlata
                : (STATUS_TRANSA[p().status] ?? p().status)}
            </Pastila>
          }
        >
          {(pl) => <ButonPlateste mic plata={pl()} />}
        </Show>
      </span>
      <Show when={p().fgoFacturaLink} fallback={<span class="factura" />}>
        <a
          class="factura"
          href={p().fgoFacturaLink!}
          target="_blank"
          rel="noopener noreferrer"
          title={`Factura ${p().fgoFacturaSerie ?? ""}-${p().fgoFacturaNumar ?? ""}`}
          aria-label="Descarcă factura"
          style={{
            width: "38px",
            height: "38px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "border-radius": "999px",
            background: C.fundal,
            color: C.text,
          }}
        >
          <Symbol size={18}>download</Symbol>
        </a>
      </Show>
    </div>
  );
}

function RandComanda(props: { comanda: Comanda }) {
  const c = () => props.comanda;
  const t2Neplatita = () =>
    c().plati.some((p) => p.numarTransa === 2 && p.status === "Asteptata");
  const achitat = () =>
    ["Achitat", "Achitat 2/2", "Oferta"].includes(c().statusPlata);

  return (
    <div
      style={{
        padding: "16px 20px",
        "border-radius": "20px",
        background: C.foaie,
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
        }}
      >
        <div style={{ "min-width": 0 }}>
          <p style={{ margin: 0, "font-size": "16px", "font-weight": 700 }}>
            {c().titlu}
          </p>
          <p style={{ margin: "2px 0 0", color: C.stins, "font-size": "14px" }}>
            {c().numarComanda ? `${c().numarComanda} · ` : ""}
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
          <Pastila
            fel={
              achitat()
                ? "ok"
                : inactiva(c().statusPlata)
                  ? "neutru"
                  : "asteapta"
            }
          >
            {/* „Oferta" e numele din bază: omul a fost înscris fără plată, de admin. Ca pe site (27 oct 2026). */}
            {c().statusPlata === "Oferta" ? "Fără plată" : c().statusPlata}
          </Pastila>
          <Show when={c().produs === "camp" && !inactiva(c().statusPlata)}>
            <MeniuAnulare
              inscriereId={c().id}
              statusCerere={c().cerereAnulare?.status}
            />
          </Show>
        </div>
      </div>

      {/* Prelungirea vorbită la telefon, scrisă pe ecran: omul care a sunat ca să nu primească
          penalizare trebuie să VADĂ că a primit-o. ⚠️ Fără motiv și fără numele sellerului. */}
      <Show
        when={
          c().prelungireTransa2 && !inactiva(c().statusPlata) && t2Neplatita()
        }
      >
        <p
          style={{
            margin: "12px 0 0",
            padding: "12px 14px",
            "border-radius": "14px",
            background: C.verdeDeschis,
            "font-size": "14px",
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
        </p>
      </Show>

      {/* Penalizarea arătată ÎNAINTE de clic: serverul o adaugă la Stripe oricum (bug-ul reparat pe site pe 19 sept). */}
      <Show
        when={
          (c().penalizareTransa2 ?? 0) > 0 &&
          !inactiva(c().statusPlata) &&
          t2Neplatita()
        }
      >
        <p
          style={{
            margin: "12px 0 0",
            padding: "12px 14px",
            "border-radius": "14px",
            background: "rgba(202,26,56,0.08)",
            color: C.rosu,
            "font-size": "14px",
            "line-height": "1.45",
          }}
        >
          Plată întârziată, s-a adăugat o penalizare
          {(c().zileIntarziereTransa2 ?? 0) > 0
            ? ` (${c().zileIntarziereTransa2} ${c().zileIntarziereTransa2 === 1 ? "zi" : "zile"} × 1%/zi din tranșă)`
            : ""}
          : <b>{lei(c().penalizareTransa2 ?? 0)}</b>
        </p>
      </Show>
    </div>
  );
}

/**
 * Meniul discret (⋮) cu cererea de anulare: ascunsă dinadins, ca să nu fie prima acțiune la
 * îndemână (design 2026-07-20). După o respingere se poate cere din nou (audit 3 oct 2026, G24).
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
          width: "36px",
          height: "36px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "999px",
          border: "0",
          background: meniu() ? C.fundal : "transparent",
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
            top: "40px",
            "z-index": 10,
            width: "250px",
            padding: "6px 0",
            "border-radius": "16px",
            border: `1px solid ${C.linie}`,
            background: C.fundal,
            "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
          }}
        >
          <Show when={trimisa()}>
            <p
              style={{
                margin: 0,
                padding: "8px 14px",
                color: C.stins,
                "font-size": "14px",
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
                padding: "10px 14px",
                border: "0",
                background: "transparent",
                color: C.rosu,
                "font-family": "inherit",
                "font-size": "14px",
                "font-weight": 600,
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
        <Fereastra
          titlu="Cerere de anulare"
          laInchidere={() => setFormular(false)}
          latime={440}
        >
          <p
            style={{
              margin: "0 0 12px",
              color: C.stins,
              "font-size": "16px",
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
              padding: "12px 16px",
              "border-radius": "14px",
              border: "0",
              background: C.foaieTare,
              color: C.text,
              "font-family": "inherit",
              "font-size": "16px",
              resize: "none",
              outline: "none",
            }}
          />
          <Show when={eroare()}>
            <p
              role="alert"
              style={{ margin: "8px 0 0", color: C.rosu, "font-size": "14px" }}
            >
              {eroare()}
            </p>
          </Show>
          <div style={{ display: "flex", gap: "8px", "margin-top": "16px" }}>
            <Buton piele="alb" lat onClick={() => setFormular(false)}>
              Renunță
            </Buton>
            {/* Roșu, nu negru: e o acțiune care desface ceva. */}
            <button
              type="button"
              disabled={lucrez()}
              onClick={trimite}
              style={{
                flex: 1,
                height: "46px",
                "border-radius": "999px",
                border: "0",
                background: C.rosu,
                color: C.peNegru,
                "font-family": "inherit",
                "font-size": "16px",
                "font-weight": 700,
                cursor: lucrez() ? "default" : "pointer",
                opacity: lucrez() ? 0.6 : 1,
              }}
            >
              {lucrez() ? "Se trimite…" : "Trimite cererea"}
            </button>
          </div>
        </Fereastra>
      </Show>
    </div>
  );
}
