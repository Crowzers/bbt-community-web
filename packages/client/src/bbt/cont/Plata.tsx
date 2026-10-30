import { JSX, Show, createSignal, onCleanup, onMount } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { BBT_SITE_URL } from "../config";
import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, lei, useSesiune, zi } from "./date";
import type { PlataExperienta } from "./tipuri";
import { Buton, C, DE_FONTE, Eticheta, Fereastra } from "./ui";

/**
 * BBT: plata unei rate din hub, ca fereastră (23g, 30 oct 2026), nu ca pagină.
 *
 * 🔥 **Fereastra arată ce plătești, iar banii se iau tot pe pagina Stripe.** 23g desena cardul salvat ales chiar în
 * fereastră; userul a ales (30 oct) să rămână pagina Stripe, ca până acum: codul de bani rămâne cel testat, fără card
 * salvat și fără o a doua cale de încasare. Fereastra doar spune suma, rata și scadența înainte de clic.
 *
 * ⚠️ Stripe se deschide în ALT TAB (în aplicația instalată, în browser), nu în fereastra hub-ului (decizia #7 din
 * `2026-10-20-hub-standalone-cont-design.md`): checkout-ul se întoarce pe `beanbagtheory.ro/checkout-success`, deci
 * omul ar fi rămas pe site. Tab-ul se deschide SINCRON, în clic, și primește adresa după: un `window.open` chemat după
 * un `await` e blocat ca pop-up de Safari și de Chrome.
 *
 * ⚠️ Suma o decide serverul (`admin/lib/reguli/experiente.ts`, cu penalizarea inclusă), iar rutele de checkout o
 * recalculează. Fereastra nu socotește nimic: arată ce a primit.
 */

/** Ruta de checkout pentru plata primită. Aceleași trei ca pe site și în aplicația de telefon (`adresaDePlata`). */
function cerereaPlatii(p: PlataExperienta): [string, Record<string, string>] {
  if (p.actiune === "transa2") {
    return p.fel === "curs"
      ? ["/api/public/checkout/curs/transa2", { inscriereCursId: p.comandaId }]
      : ["/api/public/checkout/transa2", { inscriereId: p.comandaId }];
  }
  return [
    "/api/public/checkout/comanda",
    { fel: p.fel, comandaId: p.comandaId },
  ];
}

export function FereastraPlata(props: {
  plata: PlataExperienta;
  /** Banii deja încasați pe comandă, pentru „după plată: 3 000 / 3 000 lei". */
  progres?: { platit: number; total: number; nrTranse: number } | null;
  laInchidere: () => void;
}) {
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [lucrez, setLucrez] = createSignal(false);
  const [deschisa, setDeschisa] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  const p = () => props.plata;

  // Omul plătește în alt tab și se întoarce aici: la revenire recitim contul, ca rata plătită să dispară singură.
  onMount(() => {
    const revenire = () => {
      if (deschisa() && document.visibilityState === "visible") {
        void qc.invalidateQueries({ queryKey: CHEIE_CONT });
      }
    };
    document.addEventListener("visibilitychange", revenire);
    onCleanup(() => document.removeEventListener("visibilitychange", revenire));
  });

  async function plateste() {
    setEroare("");
    setLucrez(true);
    const tab = window.open("", "_blank");
    try {
      const [cale, corp] = cerereaPlatii(p());
      const { url } = await cerereCont<{ url: string }>(sesiune(), cale, {
        method: "POST",
        body: JSON.stringify(corp),
      });
      if (!url) throw new Error("Plata n-a putut porni. Încearcă din nou.");
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setDeschisa(true);
    } catch (e) {
      tab?.close();
      setEroare(
        e instanceof Error && e.message !== "Cererea n-a mers."
          ? e.message
          : "Plata n-a putut porni. Încearcă din nou.",
      );
    } finally {
      setLucrez(false);
    }
  }

  const rata = () =>
    p().actiune === "integral"
      ? "Plata integrală"
      : `Rata ${p().numarTransa}${props.progres ? ` din ${props.progres.nrTranse}` : ""}`;

  return (
    <Fereastra
      titlu={
        p().actiune === "contract"
          ? "Semnează contractul"
          : p().actiune === "integral"
            ? "Plătește"
            : `Plătește rata ${p().numarTransa}`
      }
      laInchidere={props.laInchidere}
    >
      <Show
        when={p().actiune !== "contract"}
        fallback={
          // Aceleași texte ca în aplicația de telefon (`FoaiePlata.tsx`): plata vine după semnătură (D11 din 25 oct).
          <>
            <p
              style={{
                margin: "0 0 18px",
                color: C.stins,
                "font-size": "16px",
                "line-height": "1.45",
              }}
            >
              {p().linkContract
                ? `${p().titlu}: semnează contractul ca să-ți păstrezi locul. Linkul de plată vine după semnătură.`
                : `Contractul pentru ${p().titlu} l-am trimis pe emailul ${p().semnatar === "firma" ? "firmei" : "părintelui"}. Linkul de plată vine după ce îl semnează.`}
            </p>
            <Show when={p().linkContract}>
              <Buton
                lat
                href={`${BBT_SITE_URL}${p().linkContract}`}
                target="_blank"
              >
                Semnează contractul ↗
              </Buton>
            </Show>
          </>
        }
      >
        <div
          style={{
            padding: "18px",
            "border-radius": "20px",
            background: C.foaie,
            "text-align": "center",
          }}
        >
          <Eticheta>
            {p().titlu} · {rata()}
          </Eticheta>
          <p
            style={{
              ...DE_FONTE,
              margin: "6px 0 4px",
              "font-size": "48px",
              "line-height": "1",
            }}
          >
            {lei(p().suma)}
          </p>
          <p
            style={{
              margin: 0,
              color: p().intarziat ? C.rosu : C.stins,
              "font-size": "14px",
            }}
          >
            <Show when={p().scadentaLa}>
              {p().intarziat ? "întârziată, scadentă " : "scadentă "}
              {zi(p().scadentaLa!)}
            </Show>
            <Show when={p().scadentaLa && props.progres}> · </Show>
            <Show when={props.progres}>
              după plată:{" "}
              {/* Plafonat la total: penalizarea din sumă nu face parte din prețul comenzii. */}
              {Math.min(
                props.progres!.platit + p().suma,
                props.progres!.total,
              ).toLocaleString("ro-RO")}{" "}
              / {lei(props.progres!.total)}
            </Show>
          </p>
        </div>
        {/* Penalizarea e deja în sumă (o calculează adminul, ca la checkout); aici doar spunem de ce e mai mare. */}
        <Show when={p().intarziat && p().actiune === "transa2"}>
          <p
            style={{
              margin: "12px 0 0",
              color: C.stins,
              "font-size": "14px",
              "line-height": "1.45",
            }}
          >
            Plata e întârziată, așa că suma include penalizarea de 1% pe zi din
            contract.
          </p>
        </Show>
        <p
          style={{
            margin: "14px 0 18px",
            color: C.stins,
            "font-size": "14px",
            "line-height": "1.45",
          }}
        >
          Plata e procesată de Stripe, într-un tab nou. Factura apare în Plăți
          și pe email.
        </p>
        <Show
          when={!deschisa()}
          fallback={
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: C.text,
                  "font-size": "16px",
                  "font-weight": 600,
                }}
              >
                Am deschis plata într-un tab nou. După ce plătești, rata se
                actualizează aici.
              </p>
              <Buton
                piele="alb"
                lat
                onClick={() => void plateste()}
                dezactivat={lucrez()}
              >
                Deschide plata din nou
              </Buton>
            </div>
          }
        >
          <Buton lat onClick={() => void plateste()} dezactivat={lucrez()}>
            {lucrez() ? "Se deschide plata…" : `Plătește ${lei(p().suma)}`}
          </Buton>
        </Show>
        <Show when={eroare()}>
          <p
            role="alert"
            style={{ margin: "10px 0 0", color: C.rosu, "font-size": "14px" }}
          >
            {eroare()}
          </p>
        </Show>
      </Show>
    </Fereastra>
  );
}

/** Butonul galben „Plătește" / „Semnează" de pe carduri (23b, 23e), care deschide fereastra. */
export function ButonPlateste(props: {
  plata: PlataExperienta;
  progres?: { platit: number; total: number; nrTranse: number } | null;
  mic?: boolean;
  /** Alt buton pentru aceeași fereastră: pe telefon e pastila neagră din aplicație (19c), nu cea galbenă din 23. */
  buton?: (deschide: () => void) => JSX.Element;
}) {
  const [deschisa, setDeschisa] = createSignal(false);
  return (
    <>
      <Show
        when={props.buton}
        fallback={
          <Buton
            piele="galben"
            mic={props.mic}
            onClick={() => setDeschisa(true)}
          >
            {props.plata.actiune === "contract" ? "Semnează" : "Plătește"}
          </Buton>
        }
      >
        {(b) => b()(() => setDeschisa(true))}
      </Show>
      <Show when={deschisa()}>
        <FereastraPlata
          plata={props.plata}
          progres={props.progres}
          laInchidere={() => setDeschisa(false)}
        />
      </Show>
    </>
  );
}
