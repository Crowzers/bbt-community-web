import { For, Show } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";

import {
  inDesfasurare,
  inViitor,
  lei,
  reala,
  useCont,
  zi,
  ziLunga,
  zilePana,
} from "./date";
import { PlatesteTransa2 } from "./PlatesteTransa2";
import type { Inscriere, Plata } from "./tipuri";
import {
  C,
  Card,
  Eticheta,
  FileActivIstoric,
  Mesaj,
  Pastila,
  RandInfo,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: My Camps în hub. Copia lui `website/src/app/dashboard/mycamps/page.tsx`, pe paleta hub-ului.
 *
 * Ce e la fel ca pe site, dinadins: active = în desfășurare sau viitoare, istoric = trecute;
 * anulatele/abandonatele lipsesc (`reala`); „Plătește tranșa 2" apare DOAR când tranșa 1 e plătită
 * (o comandă făcută din CRM stă cu ambele tranșe „Asteptata", iar fără condiția asta pagina îi
 * oferea a doua rată peste o primă rată neîncasată).
 *
 * ⚠️ Lipsește deocamdată pagina taberei (`/my-camp/[id]`: program, sesiuni, notițe) = Faza 7 din
 * design. Până atunci „Intră în tabără" o deschide pe site, în browser.
 */
export function MyCamps() {
  const cont = useCont();
  const toate = () =>
    (cont.data?.inscrieri ?? []).filter((i) => reala(i.statusPlata));
  const active = () =>
    toate().filter(
      (i) =>
        inDesfasurare(i.camp.dataStart, i.camp.dataEnd) ||
        inViitor(i.camp.dataStart),
    );
  const istoric = () =>
    toate().filter(
      (i) =>
        !inDesfasurare(i.camp.dataStart, i.camp.dataEnd) &&
        !inViitor(i.camp.dataStart),
    );

  return (
    <>
      <TitluPagina>My Camps</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca taberele tale. Încearcă din nou peste un minut.
        </Mesaj>
      </Show>
      <Show when={!cont.isLoading} fallback={<Incarcare />}>
        <FileActivIstoric
          nrActive={active().length}
          active={() => (
            <Show
              when={active().length}
              fallback={
                <StareGoala
                  simbol="camping"
                  titlu="Nicio tabără activă"
                  text="Nu ești înscris la nicio tabără viitoare."
                  link={{
                    href: `${BBT_SITE_URL}/camps`,
                    text: "Vezi taberele",
                  }}
                />
              }
            >
              <div
                style={{
                  display: "grid",
                  "grid-template-columns":
                    "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                <For each={active()}>{(i) => <CardTabara ins={i} />}</For>
              </div>
            </Show>
          )}
          istoric={() => (
            <Show
              when={istoric().length}
              fallback={
                <StareGoala
                  simbol="camping"
                  titlu="Nicio tabără în istoric"
                  text="Taberele la care ai fost apar aici."
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
                <For each={istoric()}>{(i) => <RandIstoric ins={i} />}</For>
              </div>
            </Show>
          )}
        />
      </Show>
    </>
  );
}

export function Incarcare() {
  return (
    <p style={{ color: C.stins, "font-size": "14px", margin: "8px 0" }}>
      Se încarcă…
    </p>
  );
}

function CardTabara(props: { ins: Inscriere }) {
  const camp = () => props.ins.camp;
  const zile = () => zilePana(camp().dataStart);
  const activa = () => inDesfasurare(camp().dataStart, camp().dataEnd);
  const transa2 = () =>
    props.ins.plati.find(
      (p) => p.numarTransa === 2 && p.status === "Asteptata",
    );
  const transa1Platita = () =>
    props.ins.plati.find((p) => p.numarTransa === 1)?.status === "Platita";

  return (
    <Card style={{ display: "flex", "flex-direction": "column" }}>
      <div
        style={{
          position: "relative",
          height: "160px",
          background: camp().imgUrl
            ? `center / cover no-repeat url("${camp().imgUrl}")`
            : C.foaieTare,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%)",
          }}
        />
        <div style={{ position: "absolute", top: "12px", left: "12px" }}>
          <Show
            when={activa()}
            fallback={
              <span
                style={{
                  padding: "4px 10px",
                  "border-radius": "999px",
                  background: zile() <= 7 ? C.camps : "rgba(0,0,0,0.45)",
                  color: zile() <= 7 ? "#000" : "#fff",
                  "font-size": "12px",
                  "font-weight": 700,
                }}
              >
                {zile() <= 7
                  ? `Peste ${zile()} ${zile() === 1 ? "zi" : "zile"}`
                  : zi(camp().dataStart)}
              </span>
            }
          >
            <span
              style={{
                padding: "4px 10px",
                "border-radius": "999px",
                background: C.verde,
                color: "#000",
                "font-size": "12px",
                "font-weight": 700,
              }}
            >
              În desfășurare
            </span>
          </Show>
        </div>
        <div
          style={{
            position: "absolute",
            left: "16px",
            right: "16px",
            bottom: "12px",
          }}
        >
          <Eticheta culoare={C.camps}>Tabără</Eticheta>
          <h2
            style={{
              margin: "2px 0 0",
              color: "#fff",
              "font-size": "17px",
              "font-weight": 700,
            }}
          >
            {camp().nume}
          </h2>
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          "flex-direction": "column",
          gap: "12px",
          "flex-grow": 1,
        }}
      >
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "6px 14px" }}>
          <RandInfo simbol="calendar_month">
            {zi(camp().dataStart)} - {zi(camp().dataEnd)}
          </RandInfo>
          <RandInfo simbol="location_on">{camp().locatie}</RandInfo>
        </div>

        <a
          href={`${BBT_SITE_URL}/my-camp/${camp().id}`}
          target="_blank"
          rel="noopener"
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "space-between",
            padding: "10px 14px",
            "border-radius": "12px",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            "text-decoration": "none",
            "font-size": "14px",
            "font-weight": 700,
          }}
        >
          Intră în tabără
          <Symbol size={16}>arrow_forward</Symbol>
        </a>

        <div
          style={{
            "border-top": `1px solid ${C.linie}`,
            "padding-top": "12px",
            display: "flex",
            "flex-direction": "column",
            gap: "8px",
          }}
        >
          <Eticheta>Plăți</Eticheta>
          <For each={props.ins.plati}>
            {(p) => (
              <RandPlata plata={p} integrala={props.ins.nrTranse === 1} />
            )}
          </For>
          <Show when={transa2() && transa1Platita()}>
            <PlatesteTransa2
              comandaId={props.ins.id}
              produs="camp"
              pret={transa2()!.suma}
              penalizare={props.ins.penalizareTransa2 ?? 0}
              zileIntarziere={props.ins.zileIntarziereTransa2 ?? 0}
            />
          </Show>
        </div>
      </div>
    </Card>
  );
}

export function RandPlata(props: { plata: Plata; integrala: boolean }) {
  const p = () => props.plata;
  const platit = () => p().status === "Platita";
  const rambursat = () =>
    p().status === "Rambursata" || p().status === "RambursataPartial";
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "10px",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.8)", "font-size": "13.5px" }}>
        {props.integrala ? "Plată integrală" : `Tranșa ${p().numarTransa}`} -{" "}
        {lei(p().suma)}
      </span>
      <Pastila fel={platit() ? "ok" : rambursat() ? "neutru" : "asteapta"}>
        {platit()
          ? "Plătit"
          : rambursat()
            ? "Rambursat"
            : p().scadentaLa
              ? `Scadentă ${ziLunga(p().scadentaLa!)}`
              : "În așteptare"}
      </Pastila>
    </div>
  );
}

function RandIstoric(props: { ins: Inscriere }) {
  const camp = () => props.ins.camp;
  return (
    <Card
      style={{
        display: "flex",
        "align-items": "center",
        gap: "14px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          "flex-shrink": 0,
          "border-radius": "12px",
          background: camp().imgUrl
            ? `center / cover no-repeat url("${camp().imgUrl}")`
            : C.foaieTare,
          filter: "grayscale(1)",
        }}
      />
      <div style={{ "min-width": 0, "flex-grow": 1 }}>
        <p
          style={{
            margin: 0,
            color: "#fff",
            "font-weight": 700,
            "font-size": "14.5px",
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap",
          }}
        >
          {camp().nume}
        </p>
        <div
          style={{
            display: "flex",
            "flex-wrap": "wrap",
            gap: "2px 12px",
            "margin-top": "2px",
          }}
        >
          <RandInfo simbol="calendar_month">
            {zi(camp().dataStart)} - {zi(camp().dataEnd)}
          </RandInfo>
          <RandInfo simbol="location_on">{camp().locatie}</RandInfo>
        </div>
      </div>
      <Pastila fel="neutru">Participat</Pastila>
    </Card>
  );
}
