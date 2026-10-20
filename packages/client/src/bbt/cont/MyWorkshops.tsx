import { For, Show, createSignal } from "solid-js";

import { QRCodeSVG } from "solid-qr-code";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";

import { ora, useCont, zi, ziCuSaptamana } from "./date";
import { Incarcare } from "./MyCamps";
import type { BiletWorkshop } from "./tipuri";
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
 * BBT: My Workshops în hub. Copia lui `website/src/app/dashboard/workshops/page.tsx`.
 *
 * ⚠️ `/me` întoarce DOAR biletele plătite: un bilet „Neplatit" e o rezervare, nu un loc. De-aia
 * nu există stări de plată aici. Iar „azi" rămâne la Active: în ziua workshopului omul caută
 * biletul, nu istoricul.
 *
 * Diferența față de site, dinadins: biletul cu QR se deschide AICI, nu pe `/bilet/[cod]`. La ușă
 * omul are aplicația deschisă; trimis pe site, ar fi ieșit din ea fix când trebuie să arate codul.
 * QR-ul conține doar CODUL, nu un URL, ca pe site: scanerul din admin înlănțuie oamenii
 * („scanează, bip, următorul"), iar un URL i-ar trimite pe fiecare prin camera telefonului.
 */
export function MyWorkshops() {
  const cont = useCont();
  const azi = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const sortate = () =>
    [...(cont.data?.bileteWorkshop ?? [])].sort(
      (a, b) =>
        new Date(a.workshop.dataStart).getTime() -
        new Date(b.workshop.dataStart).getTime(),
    );
  const active = () =>
    sortate().filter((b) => new Date(b.workshop.dataStart) >= azi());
  const istoric = () =>
    sortate()
      .filter((b) => new Date(b.workshop.dataStart) < azi())
      .reverse();

  return (
    <>
      <TitluPagina>My Workshops</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca biletele tale. Încearcă din nou peste un minut.
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
                  simbol="bolt"
                  titlu="Niciun workshop viitor"
                  text="Biletele la workshopuri apar aici, cu codul QR pentru intrare."
                  link={{
                    href: `${BBT_SITE_URL}/workshops`,
                    text: "Vezi workshopurile",
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
                <For each={active()}>{(b) => <CardBilet bilet={b} />}</For>
              </div>
            </Show>
          )}
          istoric={() => (
            <Show
              when={istoric().length}
              fallback={
                <StareGoala
                  simbol="bolt"
                  titlu="Niciun workshop în istoric"
                  text="Workshopurile la care ai fost apar aici."
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
                  {(b) => (
                    <Card
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "14px",
                        padding: "12px 14px",
                      }}
                    >
                      <span style={{ color: C.workshops, display: "flex" }}>
                        <Symbol size={20}>bolt</Symbol>
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
                          {b.workshop.titlu}
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
                            {zi(b.workshop.dataStart)}
                          </RandInfo>
                          <RandInfo simbol="location_on">
                            {b.workshop.locatie}
                          </RandInfo>
                        </div>
                      </div>
                      <Pastila fel="neutru">Participat</Pastila>
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

const majusculaInitiala = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function CardBilet(props: { bilet: BiletWorkshop }) {
  const [qr, setQr] = createSignal(false);
  const w = () => props.bilet.workshop;
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
        <Eticheta culoare={C.workshops}>Bilet workshop</Eticheta>
        <h2
          style={{
            margin: "4px 0 0",
            color: "#fff",
            "font-size": "17px",
            "font-weight": 700,
          }}
        >
          {w().titlu}
        </h2>
      </div>
      <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
        <RandInfo simbol="calendar_month">
          {/* Doar prima literă mare: `text-transform: capitalize` ridica toate cuvintele
              („Marți, 27 Octombrie"), iar în română luna se scrie cu literă mică. */}
          {majusculaInitiala(ziCuSaptamana(w().dataStart))}, ora{" "}
          {ora(w().dataStart)}
        </RandInfo>
        <RandInfo simbol="location_on">{w().locatie}</RandInfo>
      </div>

      <button
        type="button"
        onClick={() => setQr((v) => !v)}
        aria-expanded={qr()}
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "10px 14px",
          "border-radius": "12px",
          border: "0",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          "font-family": "inherit",
          "font-size": "14px",
          "font-weight": 700,
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", "align-items": "center", gap: "8px" }}>
          <Symbol size={16}>qr_code</Symbol>
          {qr() ? "Ascunde biletul" : "Biletul meu"}
        </span>
        <Symbol size={16}>
          {qr() ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </Symbol>
      </button>

      <Show when={qr()}>
        {/* Fundal ALB sub cod, oricât de întunecat ar fi restul: scanerele citesc prost un QR
            inversat (alb pe negru), iar luminozitatea ecranului la ușă nu e a noastră. */}
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "10px",
            padding: "16px",
            "border-radius": "14px",
            background: "#fff",
          }}
        >
          <QRCodeSVG
            value={props.bilet.cod}
            level="medium"
            width={200}
            height={200}
            backgroundColor="white"
            foregroundColor="black"
            backgroundAlpha={1}
            foregroundAlpha={1}
          />
          <span
            style={{
              color: "#000",
              "font-family": "monospace",
              "font-size": "15px",
              "letter-spacing": "0.08em",
            }}
          >
            {props.bilet.cod}
          </span>
        </div>
      </Show>
    </Card>
  );
}
