import { For, Show } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";

import { useCont, ziLunga } from "./date";
import { Incarcare } from "./MyCamps";
import {
  ButonContur,
  ButonRoz,
  C,
  Card,
  Mesaj,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Diplomele mele" în hub. Copia lui `website/src/app/dashboard/diplome/page.tsx`.
 *
 * ⚠️ O eroare de rețea NU e „nu ai diplome": mesajul de eroare stă separat de starea goală. Un om
 * care crede că a rămas fără diploma lui scrie echipei.
 *
 * PDF-ul și pagina de verificare se deschid în browser: sunt acte de arătat altcuiva, cu adresă
 * publică pe site, nu ecrane ale aplicației.
 */
export function Diplome() {
  const cont = useCont();
  const diplome = () => cont.data?.diplome ?? [];

  return (
    <>
      <TitluPagina>Diplomele mele</TitluPagina>
      <p
        style={{ margin: "-12px 0 20px", color: C.stins, "font-size": "14px" }}
      >
        Diploma rămâne aici pentru totdeauna. Dacă pierzi emailul, o descarci de
        aici.
      </p>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca diplomele tale. Încearcă din nou peste un minut.
        </Mesaj>
      </Show>
      <Show when={!cont.isLoading} fallback={<Incarcare />}>
        <Show
          when={diplome().length || cont.isError}
          fallback={
            <StareGoala
              simbol="school"
              titlu="Nicio diplomă deocamdată"
              text="Diplomele apar aici după ce termini un curs."
              link={{ href: `${BBT_SITE_URL}/cursuri`, text: "Vezi cursurile" }}
            />
          }
        >
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "12px" }}
          >
            <For each={diplome()}>
              {(d) => (
                <Card
                  style={{ padding: "16px 18px", display: "flex", gap: "12px" }}
                >
                  <span
                    style={{
                      color: C.cursuri,
                      display: "flex",
                      "margin-top": "2px",
                    }}
                  >
                    <Symbol size={20}>workspace_premium</Symbol>
                  </span>
                  <div style={{ "min-width": 0, "flex-grow": 1 }}>
                    <p
                      style={{
                        margin: 0,
                        color: C.text,
                        "font-weight": 600,
                        "font-size": "15px",
                      }}
                    >
                      {d.titluCurs}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        color: C.stins,
                        "font-size": "13px",
                      }}
                    >
                      Formator: {d.formator} · emisă {ziLunga(d.dataEmitere)}
                      {d.intalniriLuate > 0
                        ? ` · prezent la ${d.prezente} din ${d.intalniriLuate}`
                        : ""}
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: C.slab,
                        "font-size": "12px",
                        "font-family": "monospace",
                      }}
                    >
                      {d.cod}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        "flex-wrap": "wrap",
                        gap: "10px",
                        "margin-top": "12px",
                      }}
                    >
                      {/* Fără PDF încă: diploma e emisă, dar generarea fișierului se reîncearcă.
                          Actul EXISTĂ și se verifică public, deci linkul de verificare rămâne. */}
                      <Show
                        when={d.urlPdf}
                        fallback={
                          <span
                            style={{
                              color: C.stins,
                              "font-size": "13px",
                              "align-self": "center",
                            }}
                          >
                            PDF-ul se pregătește. Revino în câteva minute.
                          </span>
                        }
                      >
                        <ButonRoz href={d.urlPdf!} target="_blank">
                          <Symbol size={15}>download</Symbol> Descarcă PDF
                        </ButonRoz>
                      </Show>
                      <ButonContur
                        href={`${BBT_SITE_URL}/diploma/${encodeURIComponent(d.cod)}`}
                        target="_blank"
                      >
                        <Symbol size={15}>verified_user</Symbol> Pagina de
                        verificare
                      </ButonContur>
                    </div>
                  </div>
                </Card>
              )}
            </For>
          </div>
          <Show when={diplome().length}>
            <p
              style={{
                margin: "16px 0 0",
                color: C.slab,
                "font-size": "12.5px",
              }}
            >
              Oricine primește diploma de la tine îi poate verifica
              autenticitatea scanând codul QR de pe ea sau introducând codul pe
              pagina de verificare.
            </p>
          </Show>
        </Show>
      </Show>
    </>
  );
}
