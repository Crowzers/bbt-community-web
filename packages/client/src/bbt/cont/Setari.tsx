import { Show, createSignal, untrack } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont, uitaTokenBbt } from "../tokenBbt";

import { CHEIE_CONT, useCont, useSesiune } from "./date";
import { Incarcare } from "./MyCamps";
import { DateFacturare, DatePersonale } from "./SetariDate";
import type { Participant } from "./tipuri";
import {
  ButonContur,
  ButonRoz,
  C,
  CampText,
  Mesaj,
  MesajSalvare,
  RandValoare,
  Sectiune,
  TitluPagina,
} from "./ui";

/**
 * BBT: „Setări cont" în hub. Copia lui `website/src/app/dashboard/setari/page.tsx` și a
 * formularelor de lângă ea.
 *
 * Ce e altfel decât pe site, dinadins:
 * - Notificările deschid setările Community (`settings → notifications`), nu butonul de push al
 *   site-ului: în hub, notificările vin de la Community, cu setările lor.
 * - Parola se schimbă AICI, nu pe `/schimba-parola`: e același `auth/change-password`.
 * - „Deconectează de pe toate dispozitivele" închide și sesiunile din Community: o face adminul,
 *   în `deconecteazaDeTot` (`admin/lib/stoat/sesiuni.ts`), deci la fel și de pe site.
 */
export function Setari() {
  const cont = useCont();
  return (
    <>
      <TitluPagina>Setări cont</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca setările tale. Încearcă din nou peste un minut.
        </Mesaj>
      </Show>
      <Show
        when={cont.data}
        fallback={
          <Show when={!cont.isError}>
            <Incarcare />
          </Show>
        }
      >
        {/* Formularele își iau valorile o singură dată, la montare. `keyed` pe ID-ul contului le
            remontează doar când vine ALT cont (după o deconectare nu rămân datele omului de
            dinainte). ⚠️ Nu pe `cont.data`: obiectul se schimbă la fiecare `/me` recitit după o
            salvare, iar remontarea ștergea „Salvat." și ce scria omul în celelalte formulare. */}
        <Show when={cont.data?.id} keyed>
          {(_id) => {
            return (
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "14px",
                  "max-width": "760px",
                }}
              >
                <NumeSiUsername p={cont.data!} />
                <Notificari />
                <DatePersonale p={cont.data!} />
                <DateFacturare p={cont.data!} />
                <DateCont p={cont.data!} />
                <ZonaDeRisc />
              </div>
            );
          }}
        </Show>
      </Show>
    </>
  );
}

type Stare = { tip: "ok" | "err"; text: string } | null;

/**
 * Numele real (apare pe factură) și adresa profilului. ⚠️ Schimbarea username-ului rupe URL-ul
 * profilului și orice link dat mai departe, de-aia avertismentul apare cât timp e schimbat.
 */
function NumeSiUsername(props: { p: Participant }) {
  // Valorile de pornire, citite O dată: formularul se remontează la alt cont (`<Show keyed>`
  // din `Setari`), iar cât editezi, câmpurile sunt ale tale, nu ale ultimului răspuns `/me`.
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [prenume, setPrenume] = createSignal(p0.prenume ?? "");
  const [nume, setNume] = createSignal(p0.numeFamilie ?? "");
  const [username, setUsername] = createSignal(p0.username ?? "");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);
  const schimbat = () =>
    username().trim().toLowerCase() !== (p0.username ?? "");

  async function salveaza(e: SubmitEvent) {
    e.preventDefault();
    setLucrez(true);
    setStare(null);
    try {
      await cerereCont(sesiune(), "/api/public/participant/profile", {
        method: "PUT",
        body: JSON.stringify({
          prenume: prenume(),
          numeFamilie: nume(),
          username: username().trim().toLowerCase(),
        }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
      setStare({ tip: "ok", text: "Salvat." });
    } catch (err) {
      setStare({
        tip: "err",
        text:
          err instanceof Error && err.message !== "Cererea n-a mers."
            ? err.message
            : "Nu am putut salva.",
      });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Sectiune titlu="Nume și adresă de profil">
      <form
        onSubmit={salveaza}
        style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
      >
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          <CampText
            eticheta="Prenume"
            valoare={prenume()}
            laSchimbare={setPrenume}
            maxim={60}
            placeholder="Ion"
          />
          <CampText
            eticheta="Nume de familie"
            valoare={nume()}
            laSchimbare={setNume}
            maxim={60}
            placeholder="Popescu"
          />
        </div>
        <p style={{ margin: "-6px 0 0", color: C.slab, "font-size": "12.5px" }}>
          Numele real, cum apare pe factură. Pe profilul public apare numele tău
          de scenă.
        </p>
        <div>
          <CampText
            eticheta="Adresa profilului"
            inainte="/u/"
            valoare={username()}
            laSchimbare={(v) => setUsername(v.toLowerCase())}
            placeholder="numele.tau"
          />
          <p
            style={{
              margin: "6px 0 0",
              color: schimbat() ? C.chihlimbar : C.slab,
              "font-size": "12.5px",
            }}
          >
            {schimbat()
              ? "Dacă schimbi adresa, linkurile vechi spre profilul tău nu mai merg."
              : "Litere mici, cifre, punct și underscore. Între 3 și 30 de caractere."}
          </p>
        </div>
        <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
          <ButonRoz tip="submit" dezactivat={lucrez()}>
            {lucrez() ? "Se salvează…" : "Salvează"}
          </ButonRoz>
          <MesajSalvare stare={stare()} />
        </div>
      </form>
    </Sectiune>
  );
}

function Notificari() {
  const { openModal } = useModals();
  return (
    <Sectiune titlu="Notificări">
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
          Ce notificări primești de la Community, pe dispozitivul ăsta.
        </span>
        <ButonContur
          onClick={() =>
            openModal({
              type: "settings",
              config: "user",
              context: { page: "notifications" },
            })
          }
        >
          <Symbol size={15}>notifications</Symbol> Setări notificări
        </ButonContur>
      </div>
    </Sectiune>
  );
}

function DateCont(props: { p: Participant }) {
  const [parola, setParola] = createSignal(false);
  return (
    <Sectiune titlu="Date cont">
      <div style={{ "margin-top": "-9px" }}>
        <RandValoare eticheta="Email">
          {props.p.email}
          <Show when={props.p.emailVerified}>
            <span style={{ color: C.verde, "margin-left": "6px" }}>
              · verificat
            </span>
          </Show>
        </RandValoare>
        <Show when={props.p.telefon}>
          <RandValoare eticheta="Telefon">
            {props.p.telefon}
            <span
              style={{
                color: props.p.phoneVerified ? C.verde : C.chihlimbar,
                "margin-left": "6px",
              }}
            >
              · {props.p.phoneVerified ? "verificat" : "neverificat"}
            </span>
          </RandValoare>
        </Show>
        <RandValoare eticheta="Parolă">
          <button
            type="button"
            onClick={() => setParola((v) => !v)}
            style={{
              border: "0",
              background: "transparent",
              color: C.text,
              "font-family": "inherit",
              "font-size": "13.5px",
              "font-weight": 600,
              cursor: "pointer",
            }}
          >
            {parola() ? "Renunță" : "Schimbă"}
          </button>
        </RandValoare>
      </div>
      <Show when={parola()}>
        <SchimbaParola laGata={() => setParola(false)} />
      </Show>
    </Sectiune>
  );
}

/**
 * ⚠️ Schimbarea parolei îl deconectează pe om de PESTE TOT (`deconecteazaDeTot` în admin), inclusiv
 * din hub-ul ăsta: așa se închide orice sesiune a cuiva care i-ar fi aflat parola veche. De-aia,
 * după succes, deconectăm și aici, cu un mesaj, în loc să lăsăm aplicația să cadă singură la
 * prima cerere.
 */
function SchimbaParola(props: { laGata: () => void }) {
  const sesiune = useSesiune();
  const { logout } = useClientLifecycle();
  const [veche, setVeche] = createSignal("");
  const [noua, setNoua] = createSignal("");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);

  async function schimba(e: SubmitEvent) {
    e.preventDefault();
    if (
      noua().length < 8 ||
      !/[a-zA-Z]/.test(noua()) ||
      !/[0-9]/.test(noua())
    ) {
      setStare({
        tip: "err",
        text: "Parola nouă: minim 8 caractere, cel puțin o literă și o cifră.",
      });
      return;
    }
    setLucrez(true);
    setStare(null);
    try {
      await cerereCont(sesiune(), "/api/public/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ parolaVeche: veche(), parolaNoua: noua() }),
      });
      setStare({
        tip: "ok",
        text: "Parola s-a schimbat. Intră din nou, cu parola nouă.",
      });
      setTimeout(() => {
        uitaTokenBbt();
        logout();
      }, 1500);
    } catch (err) {
      setStare({
        tip: "err",
        text:
          err instanceof Error && err.message !== "Cererea n-a mers."
            ? err.message
            : "Parola n-a putut fi schimbată.",
      });
      setLucrez(false);
    }
  }

  return (
    <form
      onSubmit={schimba}
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "12px",
        "margin-top": "12px",
      }}
    >
      <CampText
        eticheta="Parola actuală"
        tip="password"
        autocomplete="current-password"
        valoare={veche()}
        laSchimbare={setVeche}
      />
      <CampText
        eticheta="Parola nouă"
        tip="password"
        autocomplete="new-password"
        valoare={noua()}
        laSchimbare={setNoua}
      />
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          "flex-wrap": "wrap",
        }}
      >
        <ButonRoz tip="submit" dezactivat={lucrez() || !veche() || !noua()}>
          {lucrez() ? "Se schimbă…" : "Schimbă parola"}
        </ButonRoz>
        <ButonContur onClick={props.laGata}>Renunță</ButonContur>
        <MesajSalvare stare={stare()} />
      </div>
    </form>
  );
}

function ZonaDeRisc() {
  const sesiune = useSesiune();
  const { logout } = useClientLifecycle();
  const [confirm, setConfirm] = createSignal<
    "peste-tot" | "dezactivare" | null
  >(null);
  const [lucrez, setLucrez] = createSignal(false);

  /**
   * Ambele drumuri închid sesiunea din hub la final, chiar dacă cererea a picat: omul a cerut să
   * iasă, iar o ieșire care depinde de rețea l-ar lăsa logat pe un calculator pe care voia să-l
   * părăsească. Același „best-effort, apoi delogare locală" ca pe site.
   */
  async function executa(cale: string) {
    setLucrez(true);
    try {
      await cerereCont(sesiune(), cale, { method: "POST" });
    } catch {
      // vezi comentariul de sus
    } finally {
      uitaTokenBbt();
      logout();
    }
  }

  const stilRosu = {
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    gap: "8px",
    height: "42px",
    padding: "0 18px",
    "border-radius": "999px",
    "font-family": "inherit",
    "font-size": "14px",
    "font-weight": 700,
    cursor: "pointer",
  };

  return (
    <Sectiune titlu="Zonă de risc" pericol>
      <Show
        when={confirm()}
        fallback={
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <button
              type="button"
              onClick={() => setConfirm("peste-tot")}
              style={{
                ...stilRosu,
                border: `1px solid ${C.linie}`,
                background: "transparent",
                color: C.text,
              }}
            >
              <Symbol size={15}>logout</Symbol> Deconectează de pe toate
              dispozitivele
            </button>
            <button
              type="button"
              onClick={() => setConfirm("dezactivare")}
              style={{
                ...stilRosu,
                border: "0",
                background: "#E5484D",
                color: "#fff",
              }}
            >
              <Symbol size={15}>block</Symbol> Dezactivează contul
            </button>
          </div>
        }
      >
        <div
          style={{ display: "flex", "flex-direction": "column", gap: "10px" }}
        >
          <p
            style={{
              margin: 0,
              color: C.text,
              "font-weight": 700,
              "font-size": "14.5px",
            }}
          >
            {confirm() === "peste-tot"
              ? "Te deconectăm de peste tot?"
              : "Sigur vrei să dezactivezi contul?"}
          </p>
          <p
            style={{
              margin: 0,
              color: C.stins,
              "font-size": "13.5px",
              "line-height": "1.5",
            }}
          >
            {confirm() === "peste-tot"
              ? "Ieși de pe site și din Community, pe toate dispozitivele. Intri din nou cu emailul și parola."
              : "Ieși de peste tot și nu mai poți intra până nu îl reactivezi. Te poți răzgândi oricând: când încerci să intri pe site, îți oferim reactivarea. Datele rămân neatinse."}
          </p>
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            <ButonContur onClick={() => setConfirm(null)}>Renunță</ButonContur>
            <button
              type="button"
              disabled={lucrez()}
              onClick={() =>
                executa(
                  confirm() === "peste-tot"
                    ? "/api/public/auth/logout-all"
                    : "/api/public/participant/deactivate-account",
                )
              }
              style={{
                ...stilRosu,
                border: "0",
                background: "#E5484D",
                color: "#fff",
                opacity: lucrez() ? 0.6 : 1,
              }}
            >
              {lucrez()
                ? "Un moment…"
                : confirm() === "peste-tot"
                  ? "Da, deconectează-mă"
                  : "Da, dezactivează"}
            </button>
          </div>
        </div>
      </Show>
    </Sectiune>
  );
}
