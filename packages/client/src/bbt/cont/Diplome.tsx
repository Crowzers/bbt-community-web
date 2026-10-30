import { For, Show } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";

import { useCont, ziLunga } from "./date";
import {
  Buton,
  C,
  DE_FONTE,
  Eticheta,
  Incarcare,
  Mesaj,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Diplome" în hub, ca grilă (23, harta: „grilă diplome, ca 22i"). Până pe 30 oct, listă, copia lui
 * `website/src/app/dashboard/diplome/page.tsx`.
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
      <TitluPagina>Diplome</TitluPagina>
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
              titlu="Nicio diplomă deocamdată"
              text="Diplomele apar aici după ce termini un curs. Rămân aici pentru totdeauna, chiar dacă pierzi emailul."
              link={{
                href: `${BBT_SITE_URL}/cursuri`,
                text: "Vezi cursurile ↗",
              }}
            />
          }
        >
          <p
            style={{
              margin: "-6px 0 18px",
              color: C.stins,
              "font-size": "14px",
            }}
          >
            Diploma rămâne aici pentru totdeauna. Dacă pierzi emailul, o
            descarci de aici.
          </p>
          <div
            style={{
              display: "grid",
              "grid-template-columns": "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            <For each={diplome()}>
              {(d) => (
                <div
                  style={{
                    display: "flex",
                    "flex-direction": "column",
                    gap: "10px",
                    padding: "22px",
                    "border-radius": "24px",
                    background: C.foaie,
                  }}
                >
                  <Eticheta>Diplomă · {ziLunga(d.dataEmitere)}</Eticheta>
                  <h2
                    style={{
                      ...DE_FONTE,
                      margin: 0,
                      "font-size": "26px",
                      "line-height": "1.1",
                    }}
                  >
                    {d.titluCurs}
                  </h2>
                  <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
                    Formator: {d.formator}
                    {d.intalniriLuate > 0
                      ? ` · prezent la ${d.prezente} din ${d.intalniriLuate}`
                      : ""}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: C.slab,
                      "font-size": "14px",
                      "font-family": "monospace",
                    }}
                  >
                    {d.cod}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      "flex-wrap": "wrap",
                      gap: "8px",
                      "margin-top": "4px",
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
                            "font-size": "14px",
                            "align-self": "center",
                          }}
                        >
                          PDF-ul se pregătește. Revino în câteva minute.
                        </span>
                      }
                    >
                      <Buton mic href={d.urlPdf!} target="_blank">
                        <Symbol size={15}>download</Symbol> Descarcă PDF
                      </Buton>
                    </Show>
                    <Buton
                      piele="alb"
                      mic
                      href={`${BBT_SITE_URL}/diploma/${encodeURIComponent(d.cod)}`}
                      target="_blank"
                    >
                      Verificare ↗
                    </Buton>
                  </div>
                </div>
              )}
            </For>
          </div>
          <Show when={diplome().length}>
            <p
              style={{
                margin: "16px 0 0",
                color: C.stins,
                "font-size": "14px",
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
