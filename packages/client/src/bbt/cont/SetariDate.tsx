import { For, Show, createSignal, onCleanup, untrack } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, useSesiune } from "./date";
import type { Participant } from "./tipuri";
import {
  ButonContur,
  ButonRoz,
  C,
  CampAlege,
  CampText,
  Eticheta2,
  MesajSalvare,
  RandValoare,
  Sectiune,
} from "./ui";

/**
 * BBT: „Date personale" și „Date de facturare" în hub. Copia lui
 * `website/src/app/dashboard/setari/DatePersonaleForm.tsx` + `DateFacturareForm.tsx`.
 *
 * ⚠️ Ambele scriu în ACEEAȘI rută (`PUT /participant/date-personale`), fiecare doar câmpurile ei.
 * `numeComplet` NU pleacă de aici: se editează ca prenume + nume în „Nume și adresă de profil", iar
 * serverul îl recompune. Trimis și de aici, cele două părți ar rămâne desincronizate de întreg.
 */

/** Copia lui `website/src/lib/judete.ts`. */
const JUDETE = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brașov",
  "Brăila",
  "Buzău",
  "Caraș-Severin",
  "Călărași",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Sălaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea",
  "București",
] as const;

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];
const TARI = [
  "România",
  "Moldova",
  "Ungaria",
  "Germania",
  "Italia",
  "Spania",
  "Franța",
  "Marea Britanie",
  "SUA",
  "Canada",
  "Altă țară",
];

type Stare = { tip: "ok" | "err"; text: string } | null;

const grila = {
  display: "grid",
  "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

export function DatePersonale(props: { p: Participant }) {
  // Valorile de pornire, citite O dată: formularul se remontează la alt cont (`<Show keyed>`
  // din `Setari`), iar cât editezi, câmpurile sunt ale tale, nu ale ultimului răspuns `/me`.
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [editez, setEditez] = createSignal(false);
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);

  const data = p0.dataNasterii?.slice(0, 10).split("-") ?? [];
  const [f, setF] = createSignal({
    telefon: p0.telefon ?? "",
    luna: data[1] ? String(Number(data[1])) : "",
    an: data[0] ?? "",
    tara: p0.tara ?? "România",
    oras: p0.oras ?? "",
    judet: p0.judet ?? "",
    adresa: p0.adresa ?? "",
    gen: p0.gen ?? "",
  });
  const pune = (camp: keyof ReturnType<typeof f>, v: string) =>
    setF((x) => ({ ...x, [camp]: v }));

  // Telefonul: verificat prin SMS ÎNAINTE de salvare, ca pe site. Un număr schimbat pierde
  // „Artist verificat" până trece din nou prin cod.
  const [telVerificat, setTelVerificat] = createSignal(p0.phoneVerified);
  const telOriginal = p0.telefon ?? "";
  const telSchimbat = () => f().telefon.trim() !== telOriginal.trim();
  const cereVerificare = () =>
    Boolean(f().telefon.trim()) && (telSchimbat() || !telVerificat());

  const ani = Array.from({ length: 60 }, (_, i) =>
    String(new Date().getFullYear() - 10 - i),
  );
  const dataText = () =>
    f().luna && f().an ? `${LUNI[Number(f().luna) - 1]} ${f().an}` : "-";

  async function salveaza(e: SubmitEvent) {
    e.preventDefault();
    if (cereVerificare() && !telVerificat()) {
      setStare({
        tip: "err",
        text: "Verifică întâi numărul de telefon prin SMS.",
      });
      return;
    }
    setLucrez(true);
    setStare(null);
    try {
      const x = f();
      await cerereCont(sesiune(), "/api/public/participant/date-personale", {
        method: "PUT",
        body: JSON.stringify({
          telefon: x.telefon,
          dataNasterii:
            x.luna && x.an ? `${x.an}-${x.luna.padStart(2, "0")}-01` : null,
          tara: x.tara,
          oras: x.oras,
          judet: x.judet,
          adresa: x.adresa,
          gen: x.gen || null,
        }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
      setEditez(false);
      setStare({ tip: "ok", text: "Salvat." });
    } catch {
      setStare({ tip: "err", text: "Nu am putut salva. Încearcă din nou." });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Sectiune
      titlu="Date personale"
      actiune={{
        text: editez() ? "Anulează" : "Editează",
        laApasare: () => {
          setEditez((v) => !v);
          setStare(null);
        },
      }}
    >
      <Show
        when={editez()}
        fallback={
          <>
            <div style={{ "margin-top": "-9px" }}>
              <RandValoare eticheta="Telefon">{f().telefon || "-"}</RandValoare>
              <RandValoare eticheta="Data nașterii">{dataText()}</RandValoare>
              <RandValoare eticheta="Țara">{f().tara || "-"}</RandValoare>
              <RandValoare eticheta="Județ">{f().judet || "-"}</RandValoare>
              <RandValoare eticheta="Oraș">{f().oras || "-"}</RandValoare>
              <RandValoare eticheta="Stradă">{f().adresa || "-"}</RandValoare>
              <RandValoare eticheta="Gen">{f().gen || "-"}</RandValoare>
            </div>
            <div style={{ "margin-top": "8px" }}>
              <MesajSalvare stare={stare()} />
            </div>
          </>
        }
      >
        <form
          onSubmit={salveaza}
          style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
        >
          <CampText
            eticheta={
              <>
                Telefon{" "}
                <Show when={telVerificat() && !telSchimbat()}>
                  <span style={{ color: C.verde }}>· verificat</span>
                </Show>
              </>
            }
            tip="tel"
            autocomplete="tel"
            placeholder="+40712345678"
            valoare={f().telefon}
            laSchimbare={(v) => {
              pune("telefon", v);
              if (v.trim() !== telOriginal.trim()) setTelVerificat(false);
              else setTelVerificat(p0.phoneVerified);
            }}
          />
          <Show when={cereVerificare() && !telVerificat()}>
            <VerificareTelefon
              telefon={f().telefon}
              laVerificat={() => setTelVerificat(true)}
            />
          </Show>
          <div style={grila}>
            <div>
              <Eticheta2>Data nașterii</Eticheta2>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ "flex-grow": 1 }}>
                  <CampAlege
                    eticheta=""
                    valoare={f().luna}
                    laSchimbare={(v) => pune("luna", v)}
                    gol="Lună"
                    optiuni={LUNI.map((l, i) => ({
                      valoare: String(i + 1),
                      text: l,
                    }))}
                  />
                </div>
                <div style={{ width: "110px" }}>
                  <CampAlege
                    eticheta=""
                    valoare={f().an}
                    laSchimbare={(v) => pune("an", v)}
                    gol="An"
                    optiuni={ani}
                  />
                </div>
              </div>
            </div>
            <CampAlege
              eticheta="Țara"
              valoare={f().tara}
              laSchimbare={(v) => pune("tara", v)}
              optiuni={TARI}
            />
            <CampAlege
              eticheta="Județ"
              valoare={f().judet}
              laSchimbare={(v) => pune("judet", v)}
              gol="Alege județul"
              optiuni={JUDETE}
            />
            <CampText
              eticheta="Oraș"
              valoare={f().oras}
              laSchimbare={(v) => pune("oras", v)}
              placeholder="Cluj-Napoca"
            />
          </div>
          <CampText
            eticheta="Stradă"
            valoare={f().adresa}
            laSchimbare={(v) => pune("adresa", v)}
            placeholder="Str. Exemplu, nr. 1, ap. 2"
          />
          <div>
            <Eticheta2>Gen</Eticheta2>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              <For each={["Masculin", "Feminin", "Altul"]}>
                {(g) => (
                  <button
                    type="button"
                    aria-pressed={f().gen === g}
                    onClick={() => pune("gen", f().gen === g ? "" : g)}
                    style={{
                      height: "38px",
                      padding: "0 16px",
                      "border-radius": "999px",
                      border: `1px solid ${f().gen === g ? "transparent" : C.linie}`,
                      background:
                        f().gen === g
                          ? "rgba(255,255,255,0.14)"
                          : "transparent",
                      color: f().gen === g ? C.text : C.stins,
                      "font-family": "inherit",
                      "font-size": "13.5px",
                      "font-weight": 600,
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                )}
              </For>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
            }}
          >
            <ButonRoz
              tip="submit"
              dezactivat={lucrez() || (cereVerificare() && !telVerificat())}
            >
              {lucrez() ? "Se salvează…" : "Salvează"}
            </ButonRoz>
            <MesajSalvare stare={stare()} />
          </div>
        </form>
      </Show>
    </Sectiune>
  );
}

/** Codul prin SMS. Aceleași rute ca pe site: `auth/phone/send-otp` și `verify-otp`. */
function VerificareTelefon(props: {
  telefon: string;
  laVerificat: () => void;
}) {
  const sesiune = useSesiune();
  const [pas, setPas] = createSignal<"start" | "cod">("start");
  const [cod, setCod] = createSignal("");
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  const [secunde, setSecunde] = createSignal(0);
  let ceas: ReturnType<typeof setInterval> | undefined;
  onCleanup(() => clearInterval(ceas));

  async function trimite() {
    setLucrez(true);
    setEroare("");
    try {
      await cerereCont(sesiune(), "/api/public/auth/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ telefon: props.telefon }),
      });
      setPas("cod");
      setSecunde(60);
      clearInterval(ceas);
      ceas = setInterval(() => {
        setSecunde((s) => {
          if (s <= 1) clearInterval(ceas);
          return Math.max(0, s - 1);
        });
      }, 1000);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "SMS-ul n-a putut fi trimis.");
    } finally {
      setLucrez(false);
    }
  }

  async function verifica() {
    setLucrez(true);
    setEroare("");
    try {
      await cerereCont(sesiune(), "/api/public/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ otp: cod(), telefon: props.telefon }),
      });
      props.laVerificat();
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Cod incorect.");
    } finally {
      setLucrez(false);
    }
  }

  return (
    <div
      style={{
        padding: "14px",
        "border-radius": "12px",
        border: `1px solid ${C.linie}`,
        background: "rgba(255,255,255,0.03)",
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
      }}
    >
      <Show
        when={pas() === "cod"}
        fallback={
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              gap: "12px",
              "flex-wrap": "wrap",
            }}
          >
            <span style={{ color: C.stins, "font-size": "13.5px" }}>
              Verifică numărul <b style={{ color: C.text }}>{props.telefon}</b>{" "}
              prin SMS ca să poți salva.
            </span>
            <ButonContur onClick={trimite}>
              {lucrez() ? "Se trimite…" : "Trimite SMS"}
            </ButonContur>
          </div>
        }
      >
        <span style={{ color: C.stins, "font-size": "13.5px" }}>
          Scrie codul de 6 cifre trimis pe{" "}
          <b style={{ color: C.text }}>{props.telefon}</b>.
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ "flex-grow": 1 }}>
            <CampText
              eticheta=""
              valoare={cod()}
              laSchimbare={(v) => setCod(v.replace(/\D/g, "").slice(0, 6))}
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123456"
            />
          </div>
          <ButonRoz
            onClick={verifica}
            dezactivat={lucrez() || cod().length !== 6}
          >
            Verifică
          </ButonRoz>
        </div>
        <button
          type="button"
          disabled={secunde() > 0 || lucrez()}
          onClick={() => {
            setCod("");
            void trimite();
          }}
          style={{
            "align-self": "flex-start",
            border: "0",
            background: "transparent",
            color: secunde() > 0 ? C.slab : C.stins,
            "font-family": "inherit",
            "font-size": "12.5px",
            cursor: secunde() > 0 ? "default" : "pointer",
          }}
        >
          {secunde() > 0 ? `Retrimite (${secunde()}s)` : "Retrimite codul"}
        </button>
      </Show>
      <Show when={eroare()}>
        <span style={{ color: C.rosu, "font-size": "12.5px" }}>{eroare()}</span>
      </Show>
    </div>
  );
}

export function DateFacturare(props: { p: Participant }) {
  // Valorile de pornire, citite O dată: formularul se remontează la alt cont (`<Show keyed>`
  // din `Setari`), iar cât editezi, câmpurile sunt ale tale, nu ale ultimului răspuns `/me`.
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [editez, setEditez] = createSignal(false);
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);
  const [f, setF] = createSignal({
    tipPersoana: p0.tipPersoana === "PJ" ? "PJ" : "PF",
    denumireFacturare: p0.denumireFacturare ?? "",
    cuiFacturare: p0.cuiFacturare ?? "",
    nrRegCom: p0.nrRegCom ?? "",
    adresaFacturare: p0.adresaFacturare ?? "",
    judetFacturare: p0.judetFacturare ?? "",
    localitateFacturare: p0.localitateFacturare ?? "",
  });
  const pune = (camp: keyof ReturnType<typeof f>, v: string) =>
    setF((x) => ({ ...x, [camp]: v }));
  const pj = () => f().tipPersoana === "PJ";

  // Ce se scrie efectiv pe factură: aceeași ordine ca `clientFGODinParticipant` din admin.
  const judet = () => (pj() && f().judetFacturare) || p0.judet;
  const localitate = () => (pj() && f().localitateFacturare) || p0.oras;
  const lipsesteAdresa = () => !judet() || !localitate();
  const sediuPropriu = () =>
    pj() &&
    Boolean(
      f().judetFacturare || f().localitateFacturare || f().adresaFacturare,
    );

  async function salveaza(e: SubmitEvent) {
    e.preventDefault();
    if (pj() && !f().cuiFacturare.trim()) {
      setStare({
        tip: "err",
        text: "Fără CUI nu putem emite factura pe firmă.",
      });
      return;
    }
    if (pj() && !f().denumireFacturare.trim()) {
      setStare({
        tip: "err",
        text: "Scrie denumirea firmei, cum apare la Registrul Comerțului.",
      });
      return;
    }
    setLucrez(true);
    setStare(null);
    const x = f();
    try {
      await cerereCont(sesiune(), "/api/public/participant/date-personale", {
        method: "PUT",
        body: JSON.stringify({
          tipPersoana: x.tipPersoana,
          // Pe persoană fizică golim datele de firmă: altfel, la o comutare înapoi pe firmă,
          // factura ar pleca pe un CUI vechi pe care omul nu l-a mai văzut.
          denumireFacturare: pj() ? x.denumireFacturare : "",
          cuiFacturare: pj() ? x.cuiFacturare : "",
          nrRegCom: pj() ? x.nrRegCom : "",
          adresaFacturare: pj() ? x.adresaFacturare : "",
          judetFacturare: pj() ? x.judetFacturare : "",
          localitateFacturare: pj() ? x.localitateFacturare : "",
        }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
      setEditez(false);
      setStare({ tip: "ok", text: "Salvat." });
    } catch {
      setStare({ tip: "err", text: "Nu am putut salva. Încearcă din nou." });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Sectiune
      titlu="Date de facturare"
      actiune={{
        text: editez() ? "Anulează" : "Editează",
        laApasare: () => {
          setEditez((v) => !v);
          setStare(null);
        },
      }}
    >
      {/* ⚠️ Informare, NU avertisment chihlimbar. Adresa se poate scrie și la
          plată, în formularul Stripe, iar webhook-ul din admin o copiază în
          profil (`admin/lib/plati/adresaStripe.ts`). Același text ca pe site
          (`DateFacturareForm.tsx`), cerut de user pe 20 oct 2026. */}
      <Show when={lipsesteAdresa()}>
        <p
          style={{
            margin: "0 0 12px",
            color: C.stins,
            "font-size": "13px",
            "line-height": "1.45",
          }}
        >
          Adresa pentru factură o poți completa în Date personale sau la plată,
          în formularul Stripe. Dacă o scrii la plată, o salvăm noi în contul
          tău.
        </p>
      </Show>
      <Show
        when={editez()}
        fallback={
          <>
            <div style={{ "margin-top": "-9px" }}>
              <RandValoare eticheta="Facturez ca">
                {pj() ? "Firmă" : "Persoană fizică"}
              </RandValoare>
              <RandValoare eticheta={pj() ? "Denumire" : "Nume"}>
                {(pj() && f().denumireFacturare) || p0.numeComplet}
              </RandValoare>
              <Show when={pj()}>
                <RandValoare eticheta="CUI">
                  {f().cuiFacturare || "-"}
                </RandValoare>
                <RandValoare eticheta="Nr. Reg. Com.">
                  {f().nrRegCom || "-"}
                </RandValoare>
              </Show>
              <RandValoare eticheta={pj() ? "Sediu" : "Adresă"}>
                {sediuPropriu()
                  ? [f().adresaFacturare || p0.adresa, localitate(), judet()]
                      .filter(Boolean)
                      .join(", ")
                  : "Cea din Date personale"}
              </RandValoare>
            </div>
            <div style={{ "margin-top": "8px" }}>
              <MesajSalvare stare={stare()} />
            </div>
          </>
        }
      >
        <form
          onSubmit={salveaza}
          style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
        >
          <div
            style={{
              display: "grid",
              "grid-template-columns": "1fr 1fr",
              gap: "8px",
            }}
          >
            <For
              each={[
                { v: "PF", t: "Persoană fizică" },
                { v: "PJ", t: "Firmă" },
              ]}
            >
              {(o) => (
                <button
                  type="button"
                  aria-pressed={f().tipPersoana === o.v}
                  onClick={() => pune("tipPersoana", o.v)}
                  style={{
                    height: "42px",
                    "border-radius": "12px",
                    border: `1px solid ${f().tipPersoana === o.v ? "transparent" : C.linie}`,
                    background:
                      f().tipPersoana === o.v
                        ? "rgba(255,255,255,0.14)"
                        : "transparent",
                    color: f().tipPersoana === o.v ? C.text : C.stins,
                    "font-family": "inherit",
                    "font-size": "14px",
                    "font-weight": 600,
                    cursor: "pointer",
                  }}
                >
                  {o.t}
                </button>
              )}
            </For>
          </div>
          <Show
            when={pj()}
            fallback={
              <p
                style={{
                  margin: 0,
                  color: C.stins,
                  "font-size": "13.5px",
                  "line-height": "1.5",
                }}
              >
                Facturăm pe numele și adresa din Date personale. Nu ți le cerem
                încă o dată: dacă vrei altă adresă pe factură, schimb-o acolo.
              </p>
            }
          >
            <CampText
              eticheta="Denumire firmă"
              valoare={f().denumireFacturare}
              laSchimbare={(v) => pune("denumireFacturare", v)}
              placeholder="NUME FIRMĂ S.R.L."
            />
            <div style={grila}>
              <CampText
                eticheta="CUI"
                valoare={f().cuiFacturare}
                laSchimbare={(v) => pune("cuiFacturare", v)}
              />
              <CampText
                eticheta="Nr. Reg. Com."
                valoare={f().nrRegCom}
                laSchimbare={(v) => pune("nrRegCom", v)}
              />
              <CampAlege
                eticheta="Județ (sediu)"
                valoare={f().judetFacturare}
                laSchimbare={(v) => pune("judetFacturare", v)}
                gol="La fel ca adresa mea"
                optiuni={JUDETE}
              />
              <CampText
                eticheta="Localitate (sediu)"
                valoare={f().localitateFacturare}
                laSchimbare={(v) => pune("localitateFacturare", v)}
                placeholder="La fel ca adresa mea"
              />
            </div>
            <CampText
              eticheta="Stradă (sediu)"
              valoare={f().adresaFacturare}
              laSchimbare={(v) => pune("adresaFacturare", v)}
              placeholder="La fel ca adresa mea"
            />
          </Show>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
            }}
          >
            <ButonRoz tip="submit" dezactivat={lucrez()}>
              {lucrez() ? "Se salvează…" : "Salvează"}
            </ButonRoz>
            <MesajSalvare stare={stare()} />
          </div>
        </form>
      </Show>
    </Sectiune>
  );
}
