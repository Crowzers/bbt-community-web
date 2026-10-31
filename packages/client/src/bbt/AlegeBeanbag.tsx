import { For, Show, createEffect, createMemo, createResource, createSignal } from "solid-js";

import { SIMPLU, adresaSvg, incarcaCatalog, svgBeanbag, type Alegere, type Catalog } from "./beanbagCanale";

const ETICHETA = "font-size:14px;font-weight:600;margin:0 0 6px";

/**
 * Biblioteca din care adminii și moderatorii aleg avatarul canalului (cererea userului, 31 oct): toate beanbag-urile, cu
 * căutare după cuvinte. Stă în crearea canalului și în setările lui, iar cine ajunge acolo are deja dreptul de a gestiona
 * canale, deci nu cere altă verificare.
 *
 * Cu `propusa`, biblioteca urmează numele canalului până la primul click, iar după aceea numele nu mai schimbă nimic.
 * Fără ea (setările unui canal existent), nu spune nimic până nu alege omul: altfel orice deschidere ar marca formularul ca
 * modificat și ar înlocui iconul pus deja.
 */
export function AlegeBeanbag(props: {
  /** Ce arată biblioteca atunci când omul n-a ales încă. */
  propusa?: (catalog: Catalog) => Alegere;
  laSchimbare: (alegere: Alegere, catalog: Catalog) => void;
}) {
  const [catalog] = createResource(incarcaCatalog);
  const [cautare, setCautare] = createSignal("");
  const [alesLocal, setAlesLocal] = createSignal<Alegere | null>(null);

  const curent = createMemo(() => {
    const c = catalog();
    if (!c) return null;
    return alesLocal() ?? props.propusa?.(c) ?? { accesoriu: SIMPLU, culoare: "roz" };
  });

  createEffect(() => {
    const c = catalog();
    const acum = curent();
    if (c && acum && (props.propusa || alesLocal())) props.laSchimbare(acum, c);
  });

  const vizibile = createMemo(() => {
    const c = catalog();
    if (!c) return [];
    // Cuvintele din catalog n-au diacritice, iar „chitară" trebuie să găsească „chitara".
    const text = cautare().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const toate = [{ nume: SIMPLU, cuvinte: [] as string[] }, ...c.accesorii];
    if (!text) return toate;
    return toate.filter((a) => a.nume.includes(text) || a.cuvinte.some((w) => w.includes(text)));
  });

  function alege(schimbare: Partial<Alegere>) {
    const acum = curent();
    if (acum) setAlesLocal({ ...acum, ...schimbare });
  }

  return (
    <Show when={catalog() && curent()}>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <img src={adresaSvg(svgBeanbag(catalog()!, curent()!))} alt="" width={64} height={64} />
          <div style="flex:1;min-width:0">
            <p style={ETICHETA}>Avatarul canalului</p>
            <div style="display:flex;gap:6px">
              <For each={Object.entries(catalog()!.volume)}>
                {([culoare, trepte]) => (
                  <button
                    type="button"
                    aria-label={`Culoare ${culoare}`}
                    aria-pressed={curent()!.culoare === culoare}
                    onClick={() => alege({ culoare })}
                    style={`width:26px;height:26px;border-radius:50%;cursor:pointer;background:${trepte[1]};border:2px solid ${curent()!.culoare === culoare ? "#0A0A0B" : "transparent"}`}
                  />
                )}
              </For>
            </div>
          </div>
        </div>
        <input
          type="search"
          placeholder="Caută: chitară, tabără, anunțuri..."
          value={cautare()}
          onInput={(e) => setCautare(e.currentTarget.value)}
          style="width:100%;box-sizing:border-box;font-size:16px;padding:9px 12px;border-radius:12px;border:1px solid #E5E5E5;background:transparent;color:inherit"
        />
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:4px;max-height:216px;overflow-y:auto">
          <For each={vizibile()}>
            {(a) => (
              <button
                type="button"
                title={a.nume}
                aria-label={a.nume}
                aria-pressed={curent()!.accesoriu === a.nume}
                onClick={() => alege({ accesoriu: a.nume })}
                style={`padding:4px;border-radius:12px;cursor:pointer;background:transparent;border:2px solid ${curent()!.accesoriu === a.nume ? "#0A0A0B" : "transparent"}`}
              >
                <img
                  src={adresaSvg(svgBeanbag(catalog()!, { accesoriu: a.nume, culoare: curent()!.culoare }))}
                  alt=""
                  loading="lazy"
                  style="width:100%;display:block"
                />
              </button>
            )}
          </For>
        </div>
        <Show when={vizibile().length === 0}>
          <p style="font-size:14px;margin:0">Niciun beanbag pentru căutarea asta.</p>
        </Show>
      </div>
    </Show>
  );
}
