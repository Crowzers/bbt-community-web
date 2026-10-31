import {
  For,
  JSX,
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  on,
} from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useAlunecare } from "../Alunecare";
import { CERC_40, IconInapoi, UN_RAND } from "../telefon";

import { useCont, useExperiente } from "./date";
import { Diplome } from "./Diplome";
import { Experiente } from "./Experiente";
import { ExperienteTelefon } from "./ExperienteTelefon";
import { Plati } from "./Plati";
import { ProfilTelefon } from "./ProfilTelefon";
import {
  DatePersonaleCont,
  EditeazaProfilTelefon,
  NotificariCont,
  ProfilPublic,
} from "./Setari";
import { Tabara } from "./tabara/Tabara";
import { Buton, C, Fereastra } from "./ui";

/**
 * BBT: „Contul meu" în hub, `/cont/:pagina`. Design: `2026-10-20-hub-standalone-cont-design.md` + macheta 23
 * (30 oct 2026).
 *
 * 🔥 **Meniul din 23**, nu cel al site-ului: My Camps, My Workshops și My Courses au devenit un singur „Experiențele
 * mele" (același card pentru toate, ca în aplicația de telefon); „Setări cont" s-a desfăcut în Profil public / Date
 * personale / Notificări, ca nimeni să nu caute CNP-ul lângă poza de profil. Wishlist a ieșit: nu se cumpără din hub,
 * deci lista de dorințe stă pe site.
 *
 * ⚠️ Adresele vechi (`/cont/mycamps`, `/cont/setari`…) duc în pagina nouă care le-a luat locul: cineva le are în
 * istoric sau într-un link primit.
 *
 * Telefon: `/cont` = tab-ul Profil, `/cont/experiente` = tab-ul Experiențe, ca în aplicație; restul paginilor, cu
 * „înapoi" sus. Desktop: meniul stă mereu în stânga, iar `/cont` simplu deschide Experiențele mele.
 */

type Rand = { pagina: string; nume: string };

const ACTIVITATE: Rand[] = [
  { pagina: "experiente", nume: "Experiențele mele" },
  { pagina: "diplome", nume: "Diplome" },
  { pagina: "plati", nume: "Plăți" },
];

const CONT: Rand[] = [
  { pagina: "profil", nume: "Profil public" },
  { pagina: "date", nume: "Date personale" },
  { pagina: "notificari", nume: "Notificări" },
];

const PAGINI: Record<string, () => JSX.Element> = {
  experiente: Experiente,
  diplome: Diplome,
  plati: Plati,
  profil: ProfilPublic,
  date: DatePersonaleCont,
  notificari: NotificariCont,
};

/** Titlurile paginilor pe telefon, din antet. Tabăra n-are: numele ei stă deja mare în pagină. */
const TITLURI: Record<string, string> = {
  diplome: "Diplome",
  plati: "Plăți",
  profil: "Editează profilul",
  notificari: "Notificări",
};

/** Adresele de dinainte de 23 → pagina care le-a luat locul. */
const ADRESE_VECHI: Record<string, string> = {
  mycamps: "experiente",
  workshops: "experiente",
  cursuri: "experiente",
  wishlist: "experiente",
  setari: "profil",
};

export function ContulMeu() {
  const params = useParams<{ pagina?: string; id?: string }>();
  const navigate = useNavigate();
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const state = useState();

  // Pe telefon aplicația stă pe lista de conversații (SlideDrawer, `continutLaInceput`), iar
  // conținutul glisează peste ea doar la un canal apăsat. Aici omul a cerut contul, deci glisăm
  // direct în el. Altfel `/cont` se deschidea SUB listă și părea că nu s-a întâmplat nimic.
  // ⚠️ Efect pe `appDrawer()`, nu `onMount`: la o pornire direct pe `/cont`, `Interface.tsx` pune
  // drawer-ul abia după un `setTimeout`, deci la montare încă nu există. Și se cheamă o singură dată
  // pe drawer, ca „înapoi" de mai jos (care îl închide) să nu fie anulat pe loc.
  createEffect(
    on(
      () => state.appDrawer(),
      (drawer) => drawer?.setShown(true),
    ),
  );

  // Pe desktop `/cont` simplu = Experiențele mele; pe telefon = Profil (vezi antetul).
  const pagina = () => {
    const p = params.pagina;
    if (!p) return telefon() ? undefined : "experiente";
    const noua = ADRESE_VECHI[p] ?? p;
    // Pe telefon datele personale stau în „Editează profilul", ca în aplicație.
    return telefon() && noua === "date" ? "profil" : noua;
  };
  const componenta = () =>
    telefon() && pagina() === "profil"
      ? EditeazaProfilTelefon
      : PAGINI[pagina() ?? ""];
  // ⚠️ `keyed`, ca pagina să se schimbe la fiecare rând apăsat. Varianta veche citea `pagina()` o
  // singură dată, la montare, iar `<Match>` de mai jos nu se re-randează cât condiția rămâne
  // adevărată: din My Camps pe Plăți se schimba adresa și rândul activ, dar conținutul rămânea.
  const Pagina = () => (
    <Show when={componenta()} keyed>
      {(P) => <P />}
    </Show>
  );

  // BBT: pe telefon, Profil și Experiențe sunt tab-uri, ca în aplicație: fără „înapoi", cu pastila de meniu jos.
  const ecranTab = () => telefon() && (!pagina() || pagina() === "experiente");

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        "min-height": 0,
        background: C.fundal,
        color: C.text,
        "font-family": "Inter, sans-serif",
      }}
    >
      <Show when={ecranTab()}>
        <Show when={pagina()} fallback={<ProfilTelefon />}>
          <ExperienteTelefon />
        </Show>
      </Show>
      <Show when={!telefon()}>
        <Meniu activ={pagina() === "tabara" ? "experiente" : pagina()} />
      </Show>
      <Show when={pagina() && !ecranTab()}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "flex-grow": 1,
            "min-width": 0,
            "min-height": 0,
          }}
        >
          <Show when={telefon()}>
            <AntetPagina
              titlu={TITLURI[pagina()!]}
              laInapoi={() =>
                navigate(pagina() === "tabara" ? "/cont/experiente" : "/cont")
              }
            />
          </Show>
          <div
            class="bbt-pagina-cont"
            style={{
              "flex-grow": 1,
              "min-width": 0,
              "min-height": 0,
              "overflow-y": "auto",
              padding: telefon() ? "4px 16px 32px" : "32px 40px 48px",
            }}
          >
            {/* Pagina taberei are „‹ Experiențele mele" pe desktop (23e); pe telefon, „înapoi" stă în antet. */}
            <Show when={pagina() === "tabara" && !telefon()}>
              <Inapoi
                text="Experiențele mele"
                laApasare={() => navigate("/cont/experiente")}
              />
            </Show>
            <div style={{ "max-width": "1100px" }}>
              <Switch>
                {/* `/cont/tabara/:id` = pagina unei tabere (23e), sub Experiențele mele. */}
                <Match when={pagina() === "tabara" && params.id}>
                  <Tabara id={params.id!} />
                </Match>
                <Match when={PAGINI[pagina()!]}>
                  <Pagina />
                </Match>
                <Match when={true}>
                  <p style={{ color: C.stins }}>Pagina asta nu există.</p>
                </Match>
              </Switch>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

/**
 * Antetul paginilor din cont pe telefon, ca în aplicație la „Piesele mele": cerc de înapoi 44 și titlul nativ, fin, în
 * mijloc: fontul sistemului, 17 semibold, nu De Fonte (cererea userului, 31 oct). Titlul e centrat pe ecran, nu în
 * spațiul rămas lângă buton.
 */
function AntetPagina(props: { titlu?: string; laInapoi: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        "align-items": "center",
        "flex-shrink": 0,
        "min-height": "44px",
        padding: "calc(env(safe-area-inset-top) + 6px) 16px 10px",
      }}
    >
      <button
        type="button"
        aria-label="Înapoi"
        onClick={() => props.laInapoi()}
        style={{ ...CERC_40, width: "44px", height: "44px" }}
      >
        <IconInapoi />
      </button>
      <Show when={props.titlu}>
        <span
          style={{
            ...UN_RAND,
            position: "absolute",
            left: "72px",
            right: "72px",
            "text-align": "center",
            "font-family":
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            "font-size": "17px",
            "font-weight": 600,
            color: C.text,
          }}
        >
          {props.titlu}
        </span>
      </Show>
    </div>
  );
}

function Inapoi(props: { text: string; laApasare: () => void }) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "inline-flex",
        "align-items": "center",
        "align-self": "flex-start",
        gap: "6px",
        height: "40px",
        padding: "0 12px",
        border: "0",
        background: "transparent",
        color: C.stins,
        "font-family": "inherit",
        "font-size": "14px",
        cursor: "pointer",
      }}
    >
      <Symbol size={18}>arrow_back</Symbol> {props.text}
    </button>
  );
}

function Meniu(props: { activ?: string }) {
  const navigate = useNavigate();
  const cont = useCont();
  const experiente = useExperiente();
  const { logout } = useClientLifecycle();
  const [iesire, setIesire] = createSignal(false);
  // Cifra roz de lângă „Experiențele mele" (23b): câte au ceva de făcut acum (o plată sau o semnătură).
  const deFacut = () =>
    (experiente.data?.active ?? []).filter((e) => e.plata).length;

  // Fundalul gri al rândului activ alunecă spre rândul nou, peste ambele grupuri (`Alunecare.tsx`, 30 oct 2026).
  const alunecare = useAlunecare(() =>
    [...ACTIVITATE, ...CONT].findIndex((r) => r.pagina === props.activ),
  );

  const Grup = (p: { randuri: Rand[]; dela: number }) => (
    <For each={p.randuri}>
      {(r, i) => {
        const activ = () => props.activ === r.pagina;
        return (
          <button
            ref={alunecare.rand(p.dela + i())}
            type="button"
            onClick={() => navigate(`/cont/${r.pagina}`)}
            aria-current={activ() ? "page" : undefined}
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              width: "100%",
              height: "38px",
              padding: "0 12px",
              "box-sizing": "border-box",
              "border-radius": "14px",
              border: "0",
              background: "transparent",
              position: "relative",
              "z-index": 1,
              transition: "color 200ms ease",
              color: activ() ? C.text : C.stins,
              "font-family": "inherit",
              "font-size": "14px",
              "font-weight": activ() ? 800 : 600,
              "text-align": "left",
              cursor: "pointer",
            }}
          >
            <span style={{ "flex-grow": 1 }}>{r.nume}</span>
            <Show when={r.pagina === "experiente" && deFacut()}>
              <span
                style={{
                  "min-width": "22px",
                  height: "22px",
                  padding: "0 6px",
                  "box-sizing": "border-box",
                  display: "inline-flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "border-radius": "999px",
                  background: C.roz,
                  color: C.text,
                  "font-size": "12px",
                  "font-weight": 700,
                }}
              >
                {deFacut()}
              </span>
            </Show>
          </button>
        );
      }}
    </For>
  );

  return (
    <nav
      aria-label="Contul meu"
      class="bbt-meniu-cont"
      style={{
        width: "260px",
        height: "100%",
        "flex-shrink": 0,
        "overflow-y": "auto",
        padding: "16px 12px",
        "box-sizing": "border-box",
        "border-right": `1px solid ${C.linie}`,
        display: "flex",
        "flex-direction": "column",
        gap: "2px",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          padding: "6px 10px 14px",
        }}
      >
        {/* Inelul roz din 23, ca în aplicația de telefon. */}
        <div
          style={{
            padding: "3px",
            "border-radius": "999px",
            background: C.roz,
            display: "flex",
          }}
        >
          <div
            style={{
              padding: "2px",
              "border-radius": "999px",
              background: C.fundal,
              display: "flex",
            }}
          >
            <Avatar
              src={cont.data?.avatarUrl ?? undefined}
              fallback={cont.data?.numeAfisat ?? cont.data?.numeComplet ?? "?"}
              fallbackBackground
              size={40}
            />
          </div>
        </div>
        <div style={{ "min-width": 0, "line-height": "1.3" }}>
          <div
            style={{
              "font-weight": 800,
              "font-size": "15px",
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {cont.data?.numeAfisat ?? cont.data?.numeComplet ?? "Contul meu"}
          </div>
          <div
            style={{
              color: cont.data?.phoneVerified ? C.verde : C.chihlimbar,
              "font-size": "12px",
              "font-weight": 700,
            }}
          >
            {cont.data
              ? cont.data.phoneVerified
                ? "Artist verificat"
                : "Completează profilul"
              : ""}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          "flex-direction": "column",
          gap: "2px",
        }}
      >
        <alunecare.Strat culoare={C.foaie} raza="14px" />
        <Grup randuri={ACTIVITATE} dela={0} />
        <div
          style={{ margin: "8px 10px", "border-top": `1px solid ${C.linie}` }}
        />
        <Grup randuri={CONT} dela={ACTIVITATE.length} />
      </div>
      <div style={{ "flex-grow": 1, "min-height": "24px" }} />
      <button
        type="button"
        onClick={() => setIesire(true)}
        style={{
          height: "38px",
          padding: "0 12px",
          border: "0",
          background: "transparent",
          color: C.rosu,
          "font-family": "inherit",
          "font-size": "14px",
          "font-weight": 800,
          "text-align": "left",
          cursor: "pointer",
        }}
      >
        Ieși din cont
      </button>
      <Show when={iesire()}>
        <Fereastra
          titlu="Ieși din cont?"
          laInchidere={() => setIesire(false)}
          latime={400}
        >
          <p
            style={{
              margin: "0 0 18px",
              color: C.stins,
              "font-size": "16px",
              "line-height": "1.45",
            }}
          >
            Te deconectezi de pe dispozitivul ăsta. Intri din nou cu emailul și
            parola contului BBT.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <Buton piele="alb" lat onClick={() => setIesire(false)}>
              Rămân
            </Buton>
            <Buton lat onClick={() => logout()}>
              Ieși din cont
            </Buton>
          </div>
        </Fereastra>
      </Show>
    </nav>
  );
}
