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

import { useClient, useClientLifecycle } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useAlunecare } from "../Alunecare";
import { BBT_SITE_URL } from "../config";
import { CERC_40, IconInapoi, UN_RAND } from "../telefon";

import { Administrare, poateAdministra } from "./Administrare";
import { useNotificari, useRapoarte } from "./date";
import { Diplome } from "./Diplome";
import { EditeazaProfil } from "./EditeazaProfil";
import { ExperientaTelefon } from "./Experienta";
import { Experiente } from "./Experiente";
import { ExperienteTelefon } from "./ExperienteTelefon";
import { Piese } from "./Piese";
import { Plati } from "./Plati";
import { ProfilDesktop } from "./ProfilDesktop";
import { ProfilTelefon } from "./ProfilTelefon";
import { Rapoarte } from "./Rapoarte";
import { NotificariCont } from "./Setari";
import { SetariTelefon } from "./SetariTelefon";
import { NotitaLive } from "./tabara/NotitaLive";
import { Tabara } from "./tabara/Tabara";
import { Buton, C, Fereastra, TITLU_COLT } from "./ui";
import { VoceVideo } from "./VoceVideo";
import { Wishlist } from "./Wishlist";

/**
 * BBT: „Contul meu" în hub, `/cont/:pagina`. Design: `2026-10-20-hub-standalone-cont-design.md` + macheta 23
 * (30 oct 2026).
 *
 * ⚠️ Adresele vechi (`/cont/mycamps`, `/cont/setari`…) duc în pagina nouă care le-a luat locul: cineva le are în
 * istoric sau într-un link primit.
 *
 * Peste tot: `/cont` = tab-ul Profil, `/cont/experiente` = tab-ul Experiențe, ca în aplicație. Până pe 31 oct, meniul stătea
 * lângă toate paginile, deci setările de profil apăreau și la Experiențe; userul: „nu prea face sens".
 *
 * 🔥 Varianta B (cererea userului, 31 oct 2026): Profil arată cine ești (piese, diplome), iar pe telefon rotița duce la Setări.
 * Pe telefon `/cont/setari` e o listă, cu „înapoi" sus.
 *
 * 🔥 Pe desktop și tabletă (cererea userului, 31 oct 2026): Profilul are meniul din dashboard-ul site-ului, cu My Camps și
 * restul, urmat de setări. Ține locul listei și începe cu „Profil", ca „Mesaje" lângă conversații. Experiențele n-au meniu.
 */

type Rand = { pagina: string; nume: string };

/** Numele din `website/src/lib/dashboardNavItems.ts`. Piesele există doar aici. */
const ACTIVITATE: Rand[] = [
  { pagina: "", nume: "Profilul meu" },
  { pagina: "mycamps", nume: "My Camps" },
  { pagina: "workshops", nume: "My Workshops" },
  { pagina: "cursuri", nume: "My Courses" },
  { pagina: "diplome", nume: "Diplomele mele" },
  { pagina: "piese", nume: "Piesele mele" },
];

const SETARI: Rand[] = [
  { pagina: "plati", nume: "Plăți și facturi" },
  { pagina: "profil", nume: "Editează profilul" },
  { pagina: "notificari", nume: "Notificări" },
  { pagina: "voce", nume: "Voce și video" },
  { pagina: "wishlist", nume: "Wishlist" },
];

/** Doar pentru cine are voie (`poateAdministra`, `useRapoarte`). */
const ADMINISTRARE: Rand = { pagina: "administrare", nume: "Administrare" };
const RAPOARTE: Rand = { pagina: "rapoarte", nume: "Rapoarte" };

const PAGINI_MENIU = [...ACTIVITATE, ...SETARI, ADMINISTRARE, RAPOARTE].map(
  (r) => r.pagina,
);

/** Ce deschide Setările de pe telefon, deci unde duce „înapoi" din antet. */
const PAGINI_SETARI = [
  ...SETARI.map((r) => r.pagina),
  ADMINISTRARE.pagina,
  RAPOARTE.pagina,
];

const PAGINI: Record<string, () => JSX.Element> = {
  experiente: () => <Experiente />,
  mycamps: () => <Experiente fel="camp" titlu="My Camps" />,
  workshops: () => <Experiente fel="workshop" titlu="My Workshops" />,
  cursuri: () => <Experiente fel="curs" titlu="My Courses" />,
  diplome: Diplome,
  plati: Plati,
  piese: Piese,
  notita: NotitaLive,
  profil: EditeazaProfil,
  notificari: NotificariCont,
  voce: VoceVideo,
  wishlist: Wishlist,
  setari: SetariTelefon,
  rapoarte: Rapoarte,
  administrare: Administrare,
};

/** Titlurile paginilor pe telefon, din antet. Tabăra n-are: numele ei stă deja mare în pagină. */
const TITLURI: Record<string, string> = {
  diplome: "Diplomele mele",
  plati: "Plăți și facturi",
  piese: "Piesele mele",
  notita: "Notița sesiunii",
  profil: "Editează profilul",
  notificari: "Notificări",
  rapoarte: "Rapoarte primite",
  administrare: "Administrare",
  voce: "Voce și video",
  wishlist: "Wishlist",
  setari: "Setări",
};

/** Adresele de dinainte de 23 → pagina care le-a luat locul. */
const ADRESE_VECHI: Record<string, string> = {
  date: "profil",
};

/** Pe telefon n-au meniu: Experiențe le ține pe toate. */
const ADRESE_TELEFON: Record<string, string> = {
  mycamps: "experiente",
  workshops: "experiente",
  cursuri: "experiente",
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

  // `/cont` simplu e tab-ul Profil. Lângă meniul de pe desktop, `/cont/setari` n-are ce liste: meniul e lista.
  const pagina = () => {
    const p = params.pagina;
    if (!p) return undefined;
    const noua =
      ADRESE_VECHI[p] ?? (telefon() ? ADRESE_TELEFON[p] : undefined) ?? p;
    return !telefon() && noua === "setari" ? "profil" : noua;
  };
  const componenta = () => PAGINI[pagina() ?? ""];
  // ⚠️ `keyed`, ca pagina să se schimbe la fiecare rând apăsat. Varianta veche citea `pagina()` o
  // singură dată, la montare, iar `<Match>` de mai jos nu se re-randează cât condiția rămâne
  // adevărată: din My Camps pe Plăți se schimba adresa și rândul activ, dar conținutul rămânea.
  const Pagina = () => (
    <Show when={componenta()} keyed>
      {(P) => <P />}
    </Show>
  );

  // BBT: Profil și, pe telefon, Experiențe sunt tab-uri, ca în aplicație: fără „înapoi", cu pastila de meniu jos pe telefon.
  const ecranTab = () =>
    !pagina() || (telefon() && pagina() === "experiente");
  // Detaliul experienței (20d) are „înapoi" în partea lui roz, deci nici antet, nici marginile paginilor.
  const ecranExperienta = () =>
    telefon() && pagina() === "experienta" && params.id;
  // Meniul e al Profilului. Experiențele ocupă toată lățimea, ca tab-ul din aplicație: conținutul începe din stânga foii.
  const cuMeniu = () => !telefon() && PAGINI_MENIU.includes(pagina() ?? "");

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
      <Show when={cuMeniu()}>
        <Meniu activ={pagina()} />
      </Show>
      <Show when={ecranTab()}>
        <Show
          when={pagina()}
          fallback={
            <Show when={telefon()} fallback={<ProfilDesktop />}>
              <ProfilTelefon />
            </Show>
          }
        >
          <ExperienteTelefon />
        </Show>
      </Show>
      <Show when={ecranExperienta()}>
        <ExperientaTelefon id={params.id!} />
      </Show>
      <Show when={pagina() && !ecranTab() && !ecranExperienta()}>
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
                pagina() === "notita"
                  ? navigate(-1)
                  : navigate(
                      pagina() === "tabara"
                        ? `/cont/experienta/${params.id}`
                        : PAGINI_SETARI.includes(pagina()!)
                          ? "/cont/setari"
                          : "/cont",
                    )
              }
            />
          </Show>
          <div
            class={
              pagina() === "piese"
                ? "bbt-pagina-cont bbt-pagina-piese"
                : "bbt-pagina-cont"
            }
            style={{
              "flex-grow": 1,
              "min-width": 0,
              "min-height": 0,
              "overflow-y": "auto",
              padding: telefon() ? "4px 16px 32px" : "16px 22px 48px",
            }}
          >
            {/* Pagina taberei are „‹ Experiențele mele" pe desktop (23e); pe telefon, „înapoi" stă în antet. */}
            <Show when={pagina() === "tabara" && !telefon()}>
              <Inapoi
                text="Experiențele mele"
                laApasare={() => navigate("/cont/experiente")}
              />
            </Show>
            <Show when={pagina() === "notita" && !telefon()}>
              <Inapoi text="Înapoi" laApasare={() => navigate(-1)} />
            </Show>
            <div
              style={{
                "max-width": cuMeniu() || telefon() ? "1100px" : undefined,
                margin: telefon() ? "0 auto" : undefined,
              }}
            >
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

const LINK_MENIU: JSX.CSSProperties = {
  display: "flex",
  "align-items": "center",
  width: "100%",
  "flex-shrink": 0,
  "min-height": "38px",
  padding: "0 12px",
  "box-sizing": "border-box",
  border: 0,
  background: "transparent",
  color: C.stins,
  "font-family": "inherit",
  "font-size": "14px",
  "font-weight": 600,
  "text-align": "left",
  "text-decoration": "none",
  cursor: "pointer",
};

function Meniu(props: { activ?: string }) {
  const navigate = useNavigate();
  const client = useClient();
  const rapoarte = useRapoarte();
  const notificari = useNotificari();
  const { logout } = useClientLifecycle();
  const [iesire, setIesire] = createSignal(false);
  const cifra = (pagina: string) =>
    pagina === "rapoarte"
      ? (rapoarte.data?.length ?? 0)
      : pagina === "notificari"
        ? (notificari.data?.necitite ?? 0)
        : 0;

  // ⚠️ Rapoartele intră în listă abia după răspunsul adminului, când există și rândul lor de măsurat.
  const administrare = () => [
    ...(poateAdministra(client().servers.toList()[0]) ? [ADMINISTRARE] : []),
    ...(rapoarte.data ? [RAPOARTE] : []),
  ];

  // Fundalul gri al rândului activ alunecă spre rândul nou, peste toate grupurile (`Alunecare.tsx`, 30 oct 2026).
  const alunecare = useAlunecare(() =>
    [...ACTIVITATE, ...SETARI, ...administrare()].findIndex(
      (r) => r.pagina === (props.activ ?? ""),
    ),
  );

  const Grup = (p: { randuri: Rand[]; dela: number }) => (
    <For each={p.randuri}>
      {(r, i) => {
        const activ = () => (props.activ ?? "") === r.pagina;
        return (
          <button
            ref={alunecare.rand(p.dela + i())}
            type="button"
            onClick={() => navigate(r.pagina ? `/cont/${r.pagina}` : "/cont")}
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
            <Show when={cifra(r.pagina)}>
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
                {cifra(r.pagina)}
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
      {/* Titlul ca „Mesaje" deasupra conversațiilor. Fără avatar și nume: omul apărea de patru ori pe ecran. */}
      <h1 style={{ ...TITLU_COLT, padding: "4px 10px 16px" }}>Profil</h1>
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
        <Grup randuri={SETARI} dela={ACTIVITATE.length} />
        <Show when={administrare().length}>
          <div
            style={{ margin: "8px 10px", "border-top": `1px solid ${C.linie}` }}
          />
          <Grup
            randuri={administrare()}
            dela={ACTIVITATE.length + SETARI.length}
          />
        </Show>
      </div>
      <div style={{ "flex-grow": 1, "min-height": "24px" }} />
      {/* Ca în Setările de pe telefon. Linkuri, nu rânduri din listă: nu sunt pagini din cont, deci nu primesc fundalul care alunecă. */}
      <a href="mailto:contact@beanbagtheory.ro" style={LINK_MENIU}>
        Ajutor și contact BBT
      </a>
      <a
        href={`${BBT_SITE_URL}/termeni`}
        target="_blank"
        rel="noopener"
        style={LINK_MENIU}
      >
        Termeni și confidențialitate
      </a>
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
