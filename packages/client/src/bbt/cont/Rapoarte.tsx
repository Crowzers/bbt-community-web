import { For, Match, Show, Switch, createSignal } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { type Raport, rezolvaRaportul, textMotiv } from "../raport";
import { UN_RAND } from "../telefon";

import { CHEIE_RAPOARTE, useRapoarte, useSesiune, zi } from "./date";
import {
  Buton,
  C,
  Fereastra,
  Incarcare,
  Mesaj,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: rapoartele din Community în hub, `/cont/rapoarte` (31 oct 2026), după „Rapoarte primite" din
 * `mobil/src/app/administrare.tsx`: până atunci se citeau doar în aplicație, iar un moderator de pe desktop nu le vedea.
 *
 * Doar rapoartele: canalele, amuțirile și interdicțiile din Administrare au deja locul lor în hub (setările serverului,
 * meniul de pe om).
 *
 * Rutele `/api/public/stoat/rapoarte` cer sesiunea Stoat și hotărăsc singure cine are voie. Măsurile nu se iau aici: de
 * la „Vezi omul" moderatorul ajunge la profil, cu meniul ⋮, iar raportul se închide separat.
 */
export function Rapoarte() {
  const rapoarte = useRapoarte();
  const [deschis, setDeschis] = createSignal<Raport | null>(null);

  return (
    <Switch fallback={<Incarcare />}>
      {/* Adresa scrisă de mână de cineva fără drept: la fel ca orice pagină necunoscută din cont. */}
      <Match when={rapoarte.data === null}>
        <p style={{ color: C.stins }}>Pagina asta nu există.</p>
      </Match>
      <Match when={rapoarte.isError}>
        <TitluPagina>Rapoarte primite</TitluPagina>
        <Mesaj fel="eroare">
          Rapoartele nu se încarcă acum. Încearcă din nou peste un minut.
        </Mesaj>
      </Match>
      <Match when={rapoarte.data}>
        {(lista) => (
          <>
            <TitluPagina>Rapoarte primite</TitluPagina>
            <div style={{ "max-width": "760px" }}>
              <Show
                when={lista().length}
                fallback={
                  <StareGoala
                    titlu="Niciun raport deschis"
                    text="Când cineva raportează un mesaj sau un om, apare aici."
                  />
                }
              >
                <div
                  style={{
                    overflow: "hidden",
                    "border-radius": "28px",
                    background: C.foaie,
                  }}
                >
                  <For each={lista()}>
                    {(r, i) => (
                      <RandRaport
                        raport={r}
                        ultim={i() === lista().length - 1}
                        laApasare={() => setDeschis(r)}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </div>
            <Show when={deschis()} keyed>
              {(r) => (
                <FereastraRaport
                  raport={r}
                  laInchidere={() => setDeschis(null)}
                />
              )}
            </Show>
          </>
        )}
      </Match>
    </Switch>
  );
}

function RandRaport(props: {
  raport: Raport;
  ultim: boolean;
  laApasare: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        width: "100%",
        padding: "13px 16px",
        "box-sizing": "border-box",
        border: 0,
        "border-bottom": props.ultim ? 0 : `0.5px solid ${C.linie}`,
        background: "transparent",
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{
            ...UN_RAND,
            display: "block",
            "font-size": "15px",
            "font-weight": 600,
          }}
        >
          {props.raport.tintaNume}
        </span>
        <span
          style={{
            ...UN_RAND,
            display: "block",
            "margin-top": "2px",
            color: C.stins,
            "font-size": "14px",
          }}
        >
          {textMotiv(props.raport.motiv)}
        </span>
      </span>
      <span style={{ color: C.slab, "font-size": "14px", "flex-shrink": 0 }}>
        {zi(props.raport.createdAt)}
      </span>
      <span style={{ display: "flex", color: C.slab }}>
        <Symbol size={16}>chevron_right</Symbol>
      </span>
    </button>
  );
}

/** Un raport deschis: ce s-a raportat și cine a raportat. */
function FereastraRaport(props: { raport: Raport; laInchidere: () => void }) {
  const client = useClient();
  const { openModal } = useModals();
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");

  const reincarca = () => qc.invalidateQueries({ queryKey: CHEIE_RAPOARTE });

  async function rezolva() {
    setEroare("");
    setLucrez(true);
    try {
      await rezolvaRaportul(sesiune(), props.raport.id);
      await reincarca();
      props.laInchidere();
    } catch (e) {
      setEroare((e as Error).message);
      setLucrez(false);
      // Raportul poate fi fost închis de alt moderator între timp: lista din spate rămâne la zi.
      void reincarca();
    }
  }

  async function veziOmul() {
    setEroare("");
    try {
      const om = await client().users.fetch(props.raport.tintaStoatId);
      // Cu `member`, meniul ⋮ din profil arată și măsurile. Cine a ieșit din server rămâne doar cu profilul.
      const membru = await client()
        .servers.toList()[0]
        ?.fetchMember(om)
        .catch(() => undefined);
      props.laInchidere();
      openModal({ type: "user_profile", user: om, member: membru });
    } catch {
      setEroare(
        "Nu putem deschide omul: a ieșit din Community sau contul lui nu mai există.",
      );
    }
  }

  const unde = () => {
    const canal = props.raport.canalNume;
    if (!canal) return null;
    return canal === "Mesaj direct" ? canal : `#${canal}`;
  };
  const cand = () =>
    new Date(props.raport.createdAt).toLocaleString("ro-RO", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Bucharest",
    });

  return (
    <Fereastra titlu={props.raport.tintaNume} laInchidere={props.laInchidere}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
        <p style={{ margin: 0, "font-size": "16px", "font-weight": 600 }}>
          {textMotiv(props.raport.motiv)}
        </p>
        <Show when={props.raport.continut}>
          <p
            style={{
              margin: 0,
              padding: "12px",
              "border-radius": "12px",
              background: C.foaie,
              "font-size": "16px",
              "line-height": "22px",
              "white-space": "pre-wrap",
              "overflow-wrap": "anywhere",
            }}
          >
            {props.raport.continut}
          </p>
        </Show>
        <Show when={props.raport.detalii}>
          <p
            style={{
              margin: 0,
              "font-size": "16px",
              "line-height": "22px",
              "white-space": "pre-wrap",
              "overflow-wrap": "anywhere",
            }}
          >
            {props.raport.detalii}
          </p>
        </Show>
        <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
          {[`De la ${props.raport.autorNume}`, unde(), cand()]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <Show when={eroare()}>
          <p
            role="alert"
            style={{ margin: 0, color: C.rosu, "font-size": "14px" }}
          >
            {eroare()}
          </p>
        </Show>
        <div
          style={{
            display: "flex",
            gap: "8px",
            "flex-wrap": "wrap",
            "margin-top": "6px",
          }}
        >
          <div style={{ flex: "1 1 180px" }}>
            <Buton piele="alb" lat onClick={() => void veziOmul()}>
              Vezi omul
            </Buton>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <Buton lat dezactivat={lucrez()} onClick={() => void rezolva()}>
              {lucrez() ? "Se închide…" : "Marchează rezolvat"}
            </Buton>
          </div>
        </div>
      </div>
    </Fereastra>
  );
}
