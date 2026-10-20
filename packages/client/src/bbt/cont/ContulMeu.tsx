import { For, JSX, Match, Show, Switch, createEffect, on } from "solid-js";

import { useDevice } from "@revolt/common";
import { useNavigate, useParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";

import { useCont } from "./date";
import { Diplome } from "./Diplome";
import { MyCamps } from "./MyCamps";
import { MyCourses } from "./MyCourses";
import { MyWorkshops } from "./MyWorkshops";
import { Plati } from "./Plati";
import { Setari } from "./Setari";
import { Tabara } from "./tabara/Tabara";
import { C } from "./ui";
import { Wishlist } from "./Wishlist";

/**
 * BBT: „Contul meu" în hub, `/cont/:pagina`. Design: `2026-10-20-hub-standalone-cont-design.md`.
 *
 * Aceleași rânduri și aceeași ordine ca meniul de cont al site-ului
 * (`website/src/lib/dashboardNavItems.ts`): omul care știe site-ul nu trebuie să caute nimic.
 *
 * Paginile încă nerescrise în hub (`siteUrl` pe rând) se deschid pe site, în browser, cu săgeata
 * de „pleacă din aplicație" lângă ele. Ies din listă pe măsură ce fazele din design le aduc aici.
 *
 * Telefon: `/cont` = lista, `/cont/<pagina>` = pagina cu „înapoi" sus. Desktop: meniul stă mereu
 * în stânga, iar `/cont` simplu deschide My Camps, ca dashboardul site-ului.
 */

type Rand = {
  pagina: string;
  nume: string;
  simbol: string;
  /** Încă nerescrisă în hub: pagina de pe site, deschisă în browser. */
  siteUrl?: string;
};

const ACTIVITATE: Rand[] = [
  { pagina: "mycamps", nume: "My Camps", simbol: "camping" },
  { pagina: "workshops", nume: "My Workshops", simbol: "bolt" },
  { pagina: "cursuri", nume: "My Courses", simbol: "school" },
  {
    pagina: "diplome",
    nume: "Diplomele mele",
    simbol: "workspace_premium",
  },
];

const CONT: Rand[] = [
  {
    pagina: "plati",
    nume: "Plățile mele",
    simbol: "payments",
  },
  {
    pagina: "wishlist",
    nume: "Wishlist",
    simbol: "favorite",
  },
  {
    pagina: "setari",
    nume: "Setări cont",
    simbol: "settings",
  },
];

const PAGINI: Record<string, () => JSX.Element> = {
  mycamps: MyCamps,
  workshops: MyWorkshops,
  cursuri: MyCourses,
  plati: Plati,
  wishlist: Wishlist,
  diplome: Diplome,
  setari: Setari,
};

/** Paginile deja rescrise în hub. Meniul de cont din `BaraSus` le deschide aici, restul pe site. */
export const PAGINI_IN_HUB = new Set(Object.keys(PAGINI));

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

  // Pe desktop `/cont` simplu = My Camps; pe telefon = lista (vezi antetul).
  const pagina = () => params.pagina ?? (telefon() ? undefined : "mycamps");
  // ⚠️ `keyed`, ca pagina să se schimbe la fiecare rând apăsat. Varianta veche citea `pagina()` o
  // singură dată, la montare, iar `<Match>` de mai jos nu se re-randează cât condiția rămâne
  // adevărată: din My Camps pe Plăți se schimba adresa și rândul activ, dar conținutul rămânea.
  const Pagina = () => (
    <Show when={PAGINI[pagina() ?? ""]} keyed>
      {(P) => <P />}
    </Show>
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        "min-height": 0,
        background: C.fundal,
        color: C.text,
      }}
    >
      <Show when={!telefon() || !pagina()}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            width: telefon() ? "100%" : undefined,
          }}
        >
          <Show when={telefon()}>
            <Inapoi
              text="Înapoi"
              laApasare={() => state.appDrawer()?.setShown(false)}
            />
          </Show>
          <Meniu
            activ={pagina() === "tabara" ? "mycamps" : pagina()}
            lat={telefon()}
          />
        </div>
      </Show>
      <Show when={pagina()}>
        <div
          style={{
            "flex-grow": 1,
            "min-width": 0,
            "overflow-y": "auto",
            padding: telefon() ? "12px 16px 32px" : "28px 32px 48px",
          }}
        >
          <Show when={telefon()}>
            <Show
              when={pagina() === "tabara"}
              fallback={
                <Inapoi text="Contul meu" laApasare={() => navigate("/cont")} />
              }
            >
              <Inapoi
                text="My Camps"
                laApasare={() => navigate("/cont/mycamps")}
              />
            </Show>
          </Show>
          <div style={{ "max-width": "1100px" }}>
            <Switch>
              {/* `/cont/tabara/:id` = pagina unei tabere (Faza 7), sub My Camps. */}
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

function Meniu(props: { activ?: string; lat: boolean }) {
  const navigate = useNavigate();
  const cont = useCont();

  const Grup = (p: { randuri: Rand[] }) => (
    <For each={p.randuri}>
      {(r) => {
        const activ = () => props.activ === r.pagina;
        const stil = (): JSX.CSSProperties => ({
          display: "flex",
          "align-items": "center",
          gap: "10px",
          width: "100%",
          height: props.lat ? "48px" : "38px",
          padding: "0 12px",
          "box-sizing": "border-box",
          "border-radius": "10px",
          border: "0",
          background: activ() ? "rgba(255,255,255,0.08)" : "transparent",
          color: activ() ? C.text : "rgba(255,255,255,0.75)",
          "font-family": "inherit",
          "font-size": props.lat ? "15px" : "14px",
          "font-weight": activ() ? 700 : 500,
          "text-decoration": "none",
          "text-align": "left",
          cursor: "pointer",
        });
        return (
          <Show
            when={r.siteUrl}
            fallback={
              <button
                type="button"
                onClick={() => navigate(`/cont/${r.pagina}`)}
                aria-current={activ() ? "page" : undefined}
                style={stil()}
              >
                <Symbol size={18}>{r.simbol}</Symbol>
                <span style={{ "flex-grow": 1 }}>{r.nume}</span>
                <Show when={props.lat}>
                  <span style={{ color: C.slab, display: "flex" }}>
                    <Symbol size={16}>chevron_right</Symbol>
                  </span>
                </Show>
              </button>
            }
          >
            <a
              href={`${BBT_SITE_URL}${r.siteUrl}`}
              target="_blank"
              rel="noopener"
              style={stil()}
            >
              <Symbol size={18}>{r.simbol}</Symbol>
              <span style={{ "flex-grow": 1 }}>{r.nume}</span>
              <span
                style={{ color: C.slab, display: "flex" }}
                title="Se deschide pe site"
              >
                <Symbol size={14}>open_in_new</Symbol>
              </span>
            </a>
          </Show>
        );
      }}
    </For>
  );

  return (
    <nav
      aria-label="Contul meu"
      style={{
        width: props.lat ? "100%" : "240px",
        "flex-shrink": 0,
        "overflow-y": "auto",
        padding: props.lat ? "16px" : "20px 12px",
        "box-sizing": "border-box",
        "border-right": props.lat ? "0" : `1px solid ${C.linie}`,
        display: "flex",
        "flex-direction": "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          padding: "4px 8px 16px",
          "margin-bottom": "8px",
          "border-bottom": `1px solid ${C.linie}`,
        }}
      >
        <Avatar
          src={cont.data?.avatarUrl ?? undefined}
          fallback={cont.data?.numeComplet ?? "?"}
          fallbackBackground
          size={40}
        />
        <div style={{ "min-width": 0, "line-height": "1.3" }}>
          <div
            style={{
              "font-weight": 700,
              "font-size": "14.5px",
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {cont.data?.numeComplet ?? "Contul meu"}
          </div>
          <div
            style={{
              color: cont.data?.phoneVerified ? C.verde : C.chihlimbar,
              "font-size": "12px",
              "font-weight": 600,
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
      <Grup randuri={ACTIVITATE} />
      <div
        style={{ margin: "6px 4px", "border-top": `1px solid ${C.linie}` }}
      />
      <Grup randuri={CONT} />
    </nav>
  );
}
