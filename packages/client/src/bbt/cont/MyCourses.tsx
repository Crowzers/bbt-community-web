import { For, Show } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useNavigate } from "@revolt/routing";

import { BBT_SITE_URL } from "../config";

import { reala, useCont, zi, ziLunga } from "./date";
import { Incarcare } from "./MyCamps";
import type { InscriereCurs } from "./tipuri";
import {
  ButonContur,
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
 * BBT: My Courses în hub. Copia lui `website/src/app/dashboard/cursuri/page.tsx`.
 *
 * ⚠️ Plata NU se face de aici, ca pe site: tranșa 2 stă în „Plățile mele", cu penalizarea ei. O a
 * doua copie a butonului ar fi încă un loc în care suma afișată poate să difere de cea cerută de
 * Stripe. Aici doar trimitem acolo.
 */
function stareaPlatii(ins: InscriereCurs): {
  text: string;
  deAchitat: boolean;
} {
  // `Oferta` = comandă cu reducere 100%: nu datorează nimic, deci se citește ca achitată.
  if (["Achitat", "Achitat 2/2", "Oferta"].includes(ins.statusPlata)) {
    return { text: "Achitat integral", deAchitat: false };
  }
  if (ins.statusPlata === "Achitat 1/2") {
    const t2 = ins.plati.find(
      (p) => p.numarTransa === 2 && p.status === "Asteptata",
    );
    return {
      text: t2?.scadentaLa
        ? `Tranșa 2 scadentă pe ${ziLunga(t2.scadentaLa)}`
        : "Tranșa 1 achitată",
      deAchitat: Boolean(t2),
    };
  }
  return { text: "Plată în așteptare", deAchitat: true };
}

const perioada = (start: string, sfarsit: string | null) =>
  sfarsit && zi(sfarsit) !== zi(start)
    ? `${zi(start)} - ${zi(sfarsit)}`
    : zi(start);

export function MyCourses() {
  const cont = useCont();
  const navigate = useNavigate();
  const azi = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const sfarsit = (i: InscriereCurs) =>
    new Date(i.curs.dataEnd ?? i.curs.dataStart);
  const reale = () =>
    (cont.data?.inscrieriCurs ?? []).filter((i) => reala(i.statusPlata));
  const active = () =>
    reale()
      .filter((i) => sfarsit(i) >= azi())
      .sort(
        (a, b) =>
          new Date(a.curs.dataStart).getTime() -
          new Date(b.curs.dataStart).getTime(),
      );
  const istoric = () =>
    reale()
      .filter((i) => sfarsit(i) < azi())
      .sort(
        (a, b) =>
          new Date(b.curs.dataStart).getTime() -
          new Date(a.curs.dataStart).getTime(),
      );

  return (
    <>
      <TitluPagina>My Courses</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca cursurile tale. Încearcă din nou peste un minut.
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
                  simbol="school"
                  titlu="Niciun curs activ"
                  text="Cursurile la care te înscrii apar aici."
                  link={{
                    href: `${BBT_SITE_URL}/cursuri`,
                    text: "Vezi cursurile",
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
                <For each={active()}>
                  {(ins) => {
                    const plata = stareaPlatii(ins);
                    return (
                      <Card
                        style={{
                          padding: "16px",
                          display: "flex",
                          "flex-direction": "column",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <Eticheta culoare={C.cursuri}>Curs</Eticheta>
                          <h2
                            style={{
                              margin: "4px 0 0",
                              color: "#fff",
                              "font-size": "17px",
                              "font-weight": 700,
                            }}
                          >
                            {ins.curs.titlu}
                          </h2>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            "flex-direction": "column",
                            gap: "6px",
                          }}
                        >
                          <RandInfo simbol="person">
                            Formator: {ins.curs.formator}
                          </RandInfo>
                          <RandInfo simbol="calendar_month">
                            {perioada(ins.curs.dataStart, ins.curs.dataEnd)}
                          </RandInfo>
                          <RandInfo simbol="location_on">
                            {ins.curs.locatie}
                          </RandInfo>
                        </div>
                        <div
                          style={{
                            "border-top": `1px solid ${C.linie}`,
                            "padding-top": "12px",
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "space-between",
                            gap: "10px",
                            "flex-wrap": "wrap",
                          }}
                        >
                          <Pastila fel={plata.deAchitat ? "asteapta" : "ok"}>
                            {plata.text}
                          </Pastila>
                          <Show when={plata.deAchitat}>
                            <ButonContur
                              onClick={() => navigate("/cont/plati")}
                            >
                              Plățile mele
                              <Symbol size={14}>arrow_forward</Symbol>
                            </ButonContur>
                          </Show>
                        </div>
                      </Card>
                    );
                  }}
                </For>
              </div>
            </Show>
          )}
          istoric={() => (
            <Show
              when={istoric().length}
              fallback={
                <StareGoala
                  simbol="school"
                  titlu="Niciun curs în istoric"
                  text="Cursurile terminate apar aici."
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
                <For each={istoric()}>
                  {(ins) => (
                    <Card
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "14px",
                        padding: "12px 14px",
                      }}
                    >
                      <span style={{ color: C.cursuri, display: "flex" }}>
                        <Symbol size={20}>school</Symbol>
                      </span>
                      <div style={{ "min-width": 0, "flex-grow": 1 }}>
                        <p
                          style={{
                            margin: 0,
                            color: "#fff",
                            "font-weight": 700,
                            "font-size": "14.5px",
                          }}
                        >
                          {ins.curs.titlu}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            color: C.stins,
                            "font-size": "13px",
                          }}
                        >
                          {ins.curs.formator} ·{" "}
                          {perioada(ins.curs.dataStart, ins.curs.dataEnd)}
                        </p>
                      </div>
                      <Pastila fel="neutru">Încheiat</Pastila>
                    </Card>
                  )}
                </For>
              </div>
            </Show>
          )}
        />
      </Show>
    </>
  );
}
