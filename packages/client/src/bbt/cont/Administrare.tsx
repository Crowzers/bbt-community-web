import { For, JSX, Show, createEffect, createSignal, on } from "solid-js";

import { useQuery, useQueryClient } from "@tanstack/solid-query";
import type { Channel, Emoji, Server } from "stoat.js";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { useNavigate, useParams } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { AlegeBeanbag } from "../AlegeBeanbag";
import { AvatarCanal } from "../AvatarCanal";
import { type Alegere, type Catalog, fisierBeanbag } from "../beanbagCanale";

import { ora, zi } from "./date";
import {
  Buton,
  C,
  CampAlege,
  CampText,
  Fereastra,
  Incarcare,
  Mesaj,
  MesajSalvare,
  Sectiune,
  TitluPagina,
} from "./ui";

/**
 * BBT: Administrarea Community, `/cont/administrare` (cererea userului, 31 oct 2026: „nu-mi place panoul lor"), după
 * `mobil/src/app/administrare.tsx`: ce e esențial din setările serverului, cu aspectul nostru. Fiecare bucată apare doar cu
 * permisiunea reală din Stoat. `/cont/administrare/<id canal>` deschide direct canalul, de la rotița din listă.
 *
 * Rămân în panoul lor, în spatele rândului „Roluri și invitații", doar pentru cine are dreptul:
 *   · Rolurile: vin din BBT (`admin/lib/stoat/roluri.ts`) și botul le-ar pune la loc.
 *   · Invitațiile: podul intră pe invitația permanentă a serverului; ștearsă din greșeală, nimeni nou n-ar mai putea intra.
 *   · Permisiunile canalelor și ștergerea lor (dovezile din rapoarte).
 *
 * Rapoartele au pagina lor (`Rapoarte.tsx`), iar măsurile pe un om stau în mini-profil.
 */

/** Pentru rândul „Administrare" din meniu. Ca în aplicație, plus ce există în plus aici. */
export function poateAdministra(server: Server | undefined) {
  return (
    !!server &&
    (server.havePermission("ManageChannel") ||
      server.havePermission("ManageServer") ||
      server.havePermission("ManageCustomisation") ||
      server.havePermission("TimeoutMembers") ||
      server.havePermission("BanMembers"))
  );
}

const COLOANA: JSX.CSSProperties = {
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
  "min-width": 0,
};

const DOUA_COLOANE: JSX.CSSProperties = {
  display: "grid",
  "grid-template-columns": "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
  gap: "16px",
  "align-items": "start",
};

const eAmutit = (timeout: Date | undefined) =>
  !!timeout && +timeout > Date.now();

export function Administrare() {
  const client = useClient();
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { openModal, showError } = useModals();
  const server = () => client().servers.toList()[0];

  const [deschis, setDeschis] = createSignal<Channel | null>(null);
  createEffect(
    on(
      () => params.id,
      (id) => {
        const canal = id ? client().channels.get(id) : undefined;
        if (canal) setDeschis(canal);
      },
    ),
  );
  const inchide = () => {
    setDeschis(null);
    if (params.id) navigate("/cont/administrare", { replace: true });
  };

  return (
    <>
      <TitluPagina>Administrare</TitluPagina>
      <Show
        when={server() && poateAdministra(server())}
        fallback={<p style={{ color: C.stins }}>Pagina asta nu există.</p>}
      >
        <div style={DOUA_COLOANE}>
          <div style={COLOANA}>
            <Show when={server().havePermission("ManageServer")}>
              <Descriere server={server()} />
            </Show>

            <Show when={server().havePermission("ManageChannel")}>
              <Sectiune titlu="Canale">
                <Grup>
                  <For each={server().orderedChannels}>
                    {(categorie) => (
                      <For each={categorie.channels}>
                        {(canal) => (
                          <RandApasat
                            inainte={<AvatarCanal canal={canal} marime={28} />}
                            text={`#${canal.name}`}
                            detaliu={
                              categorie.id === "default"
                                ? undefined
                                : categorie.title
                            }
                            laApasare={() => setDeschis(canal)}
                          />
                        )}
                      </For>
                    )}
                  </For>
                </Grup>
                <div style={{ "margin-top": "12px" }}>
                  <Buton
                    mic
                    onClick={() =>
                      openModal({ type: "create_channel", server: server() })
                    }
                  >
                    Canal nou
                  </Buton>
                </div>
              </Sectiune>
            </Show>
          </div>

          <div style={COLOANA}>
            <Show when={server().havePermission("TimeoutMembers")}>
              <Amutiti server={server()} laEroare={showError} />
            </Show>
            <Show when={server().havePermission("BanMembers")}>
              <Interzisi server={server()} laEroare={showError} />
            </Show>
            <Show when={server().havePermission("ManageCustomisation")}>
              <Emojiuri server={server()} />
            </Show>

            <Show
              when={
                server().havePermission("ManageRole") ||
                server().havePermission("ManagePermissions")
              }
            >
              <Sectiune titlu="Avansat">
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    gap: "12px",
                    "flex-wrap": "wrap",
                  }}
                >
                  <span
                    style={{
                      flex: "1 1 240px",
                      color: C.stins,
                      "font-size": "14px",
                      "line-height": "1.4",
                    }}
                  >
                    Rolurile vin din BBT și se pun singure. Schimbă de aici doar
                    dacă știi sigur ce faci.
                  </span>
                  <Buton
                    piele="alb"
                    mic
                    onClick={() =>
                      openModal({
                        type: "settings",
                        config: "server",
                        context: server(),
                      })
                    }
                  >
                    Roluri și invitații
                  </Buton>
                </div>
              </Sectiune>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={deschis()} keyed>
        {(canal) => (
          <FereastraCanal
            server={server()}
            canal={canal}
            laInchidere={inchide}
          />
        )}
      </Show>
    </>
  );
}

function Grup(props: { children: JSX.Element }) {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
      {props.children}
    </div>
  );
}

function RandApasat(props: {
  inainte?: JSX.Element;
  text: string;
  detaliu?: string;
  actiune?: string;
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
        "min-height": "40px",
        padding: "8px 0",
        "box-sizing": "border-box",
        border: 0,
        background: "transparent",
        color: C.text,
        "font-family": "inherit",
        "font-size": "15px",
        "font-weight": 600,
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      {props.inainte}
      <span
        style={{
          flex: 1,
          "min-width": 0,
          overflow: "hidden",
          "text-overflow": "ellipsis",
          "white-space": "nowrap",
        }}
      >
        {props.text}
      </span>
      <Show when={props.detaliu}>
        <span
          style={{ color: C.stins, "font-size": "14px", "font-weight": 400 }}
        >
          {props.detaliu}
        </span>
      </Show>
      <Show
        when={props.actiune}
        fallback={
          <span style={{ display: "flex", color: C.slab }}>
            <Symbol size={16}>chevron_right</Symbol>
          </span>
        }
      >
        <span style={{ "font-size": "14px", "font-weight": 800 }}>
          {props.actiune}
        </span>
      </Show>
    </button>
  );
}

/** O listă care vine de la server: fără asta, o cerere picată rămânea la nesfârșit pe „Se încarcă". */
function Lista<T>(props: {
  date: { data?: T[]; isError: boolean; refetch: () => unknown };
  gol: string;
  children: (lista: T[]) => JSX.Element;
}) {
  return (
    <Show
      when={props.date.data}
      fallback={
        <Show when={props.date.isError} fallback={<Incarcare />}>
          <Mesaj fel="eroare">Lista nu se încarcă acum.</Mesaj>
          <div style={{ "margin-top": "10px" }}>
            <Buton piele="alb" mic onClick={() => void props.date.refetch()}>
              Încearcă din nou
            </Buton>
          </div>
        </Show>
      }
    >
      {(lista) => (
        <Show when={lista().length} fallback={<Gol>{props.gol}</Gol>}>
          {props.children(lista())}
        </Show>
      )}
    </Show>
  );
}

function Gol(props: { children: JSX.Element }) {
  return (
    <p style={{ margin: 0, color: C.stins, "font-size": "15px" }}>
      {props.children}
    </p>
  );
}

function Descriere(props: { server: Server }) {
  const [text, setText] = createSignal(props.server.description ?? "");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<{
    tip: "ok" | "err";
    text: string;
  } | null>(null);

  const schimbat = () => text().trim() !== (props.server.description ?? "");

  async function salveaza() {
    setLucrez(true);
    setStare(null);
    try {
      const t = text().trim();
      await props.server.edit(
        t ? { description: t } : { remove: ["Description"] },
      );
      setStare({ tip: "ok", text: "Salvat." });
    } catch {
      setStare({ tip: "err", text: "Nu am putut salva." });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Sectiune titlu="Descrierea comunității">
      <CampText
        eticheta="Ce vede omul când apasă pe „Canale”"
        valoare={text()}
        laSchimbare={setText}
        maxim={1024}
        randuri={3}
      />
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          "margin-top": "12px",
        }}
      >
        <Buton
          mic
          onClick={() => void salveaza()}
          dezactivat={lucrez() || !schimbat()}
        >
          {lucrez() ? "Se salvează…" : "Salvează"}
        </Buton>
        <MesajSalvare stare={stare()} />
      </div>
    </Sectiune>
  );
}

function Amutiti(props: { server: Server; laEroare: (e: unknown) => void }) {
  const qc = useQueryClient();
  const cheie = () => ["bbt-amutiti", props.server.id];
  const lista = useQuery(() => ({
    queryKey: cheie(),
    queryFn: async () =>
      (await props.server.fetchMembers()).members.filter((m) =>
        eAmutit(m.timeout),
      ),
  }));

  return (
    <Sectiune titlu="Oameni amuțiți">
      <Lista date={lista} gol="Nimeni nu e amuțit.">
        {(oameni) => (
          <Grup>
            <For each={oameni}>
              {(om) => (
                <RandApasat
                  text={om.displayName ?? om.id.user}
                  detaliu={`până ${zi(om.timeout!.toISOString())}, ${ora(om.timeout!.toISOString())}`}
                  actiune="Ridică"
                  laApasare={() =>
                    void om
                      .edit({ remove: ["Timeout"] })
                      .then(() => qc.invalidateQueries({ queryKey: cheie() }))
                      .catch(props.laEroare)
                  }
                />
              )}
            </For>
          </Grup>
        )}
      </Lista>
    </Sectiune>
  );
}

function Interzisi(props: { server: Server; laEroare: (e: unknown) => void }) {
  const qc = useQueryClient();
  const cheie = () => ["bans", props.server.id];
  const lista = useQuery(() => ({
    queryKey: cheie(),
    queryFn: () => props.server.fetchBans(),
  }));
  const [deRidicat, setDeRidicat] = createSignal<string | null>(null);

  return (
    <Sectiune titlu="Oameni interziși">
      <Lista date={lista} gol="Nimeni nu e interzis.">
        {(oameni) => (
          <Grup>
            <For each={oameni}>
              {(ban) => (
                <RandApasat
                  text={ban.user?.username ?? ban.id.user}
                  detaliu={ban.reason ?? undefined}
                  actiune="Ridică"
                  laApasare={() => setDeRidicat(ban.id.user)}
                />
              )}
            </For>
          </Grup>
        )}
      </Lista>
      <Show when={deRidicat()}>
        {(id) => (
          <Fereastra
            titlu="Ridici interdicția?"
            laInchidere={() => setDeRidicat(null)}
            latime={400}
          >
            <p style={{ margin: "0 0 18px", color: C.stins }}>
              Omul va putea intra din nou în Community.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Buton piele="alb" lat onClick={() => setDeRidicat(null)}>
                Renunță
              </Buton>
              <Buton
                lat
                onClick={() => {
                  void props.server
                    .unbanUser(id())
                    .then(() => qc.invalidateQueries({ queryKey: cheie() }))
                    .catch(props.laEroare);
                  setDeRidicat(null);
                }}
              >
                Ridică
              </Buton>
            </div>
          </Fereastra>
        )}
      </Show>
    </Sectiune>
  );
}

/** Numele din `:nume:`: litere mici, cifre și liniuță de jos, ca pe server. */
const numeEmoji = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

function Emojiuri(props: { server: Server }) {
  const client = useClient();
  const instance = useInstance();
  const { showError } = useModals();
  const [nume, setNume] = createSignal("");
  const [fisier, setFisier] = createSignal<File | null>(null);
  const [lucrez, setLucrez] = createSignal(false);
  const [deSters, setDeSters] = createSignal<Emoji | null>(null);

  async function adauga() {
    const f = fisier();
    const n = numeEmoji(nume());
    if (!f || !n) return;
    setLucrez(true);
    try {
      const body = new FormData();
      body.append("file", f);
      const [cheie, valoare] = client().authenticationHeader;
      const r = await fetch(`${instance.mediaUrl}/emojis`, {
        method: "POST",
        body,
        headers: { [cheie]: valoare },
      });
      if (!r.ok) throw new Error(String(r.status));
      const { id } = (await r.json()) as { id: string };
      await props.server.createEmoji(id, { name: n });
      setNume("");
      setFisier(null);
    } catch (e) {
      showError(e);
    } finally {
      setLucrez(false);
    }
  }

  const ramase = () =>
    instance.globalLimits.server_emoji - props.server.emojis.length;

  return (
    <Sectiune titlu="Emoji-urile comunității">
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          gap: "12px",
          "align-items": "flex-end",
        }}
      >
        <div style={{ flex: "1 1 200px", "min-width": 0 }}>
          <CampText
            eticheta="Nume"
            valoare={nume()}
            laSchimbare={setNume}
            maxim={32}
            placeholder="bbt_inima"
          />
        </div>
        <label style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0] ?? null;
              setFisier(f);
              if (f && !nume())
                setNume(numeEmoji(f.name.replace(/\.\w+$/, "")));
            }}
          />
          <span
            style={{
              display: "inline-flex",
              "align-items": "center",
              height: "40px",
              padding: "0 16px",
              "border-radius": "999px",
              background: C.fundal,
              "font-size": "14px",
              "font-weight": 700,
            }}
          >
            {fisier() ? "Altă poză" : "Alege poza"}
          </span>
        </label>
        <Buton
          mic
          onClick={() => void adauga()}
          dezactivat={
            lucrez() || !fisier() || !numeEmoji(nume()) || ramase() <= 0
          }
        >
          {lucrez() ? "Se urcă…" : "Adaugă"}
        </Buton>
      </div>
      <p style={{ margin: "10px 0 0", color: C.stins, "font-size": "14px" }}>
        Mai încap {Math.max(0, ramase())}. Poza trebuie să fie pătrată.
      </p>
      <Show when={props.server.emojis.length}>
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "4px 12px",
            "margin-top": "12px",
          }}
        >
          <For each={props.server.emojis}>
            {(e) => (
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "min-width": 0,
                  height: "40px",
                }}
              >
                <img
                  src={e.url}
                  alt=""
                  style={{
                    width: "28px",
                    height: "28px",
                    "object-fit": "contain",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    "min-width": 0,
                    overflow: "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap",
                    "font-size": "14px",
                  }}
                >
                  :{e.name}:
                </span>
                <button
                  type="button"
                  aria-label={`Șterge :${e.name}:`}
                  onClick={() => setDeSters(e)}
                  style={{
                    display: "flex",
                    padding: "4px",
                    border: 0,
                    background: "transparent",
                    color: C.stins,
                    cursor: "pointer",
                  }}
                >
                  <Symbol size={18}>delete</Symbol>
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={deSters()} keyed>
        {(e) => (
          <Fereastra
            titlu={`Ștergi :${e.name}:?`}
            laInchidere={() => setDeSters(null)}
            latime={400}
          >
            <p style={{ margin: "0 0 18px", color: C.stins }}>
              Dispare și din mesajele în care a fost folosit.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Buton piele="alb" lat onClick={() => setDeSters(null)}>
                Renunță
              </Buton>
              <Buton
                lat
                onClick={() => {
                  void e.delete().catch(showError);
                  setDeSters(null);
                }}
              >
                Șterge
              </Buton>
            </div>
          </Fereastra>
        )}
      </Show>
    </Sectiune>
  );
}

/** Editarea unui canal. Canalul nou are deja fereastra lui (`CreateChannel.tsx`). */
function FereastraCanal(props: {
  server: Server;
  canal: Channel;
  laInchidere: () => void;
}) {
  const client = useClient();
  const instance = useInstance();
  const categorieActuala =
    (props.server.categories ?? []).find((c) =>
      c.channels.includes(props.canal.id),
    )?.id ?? "";
  const [nume, setNume] = createSignal(props.canal.name ?? "");
  const [descriere, setDescriere] = createSignal(props.canal.description ?? "");
  const [categorie, setCategorie] = createSignal(categorieActuala);
  const [avatar, setAvatar] = createSignal<{
    alegere: Alegere;
    catalog: Catalog;
  } | null>(null);
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");

  async function iconNou() {
    const ales = avatar();
    if (!ales) return undefined;
    const body = new FormData();
    body.append("file", await fisierBeanbag(ales.catalog, ales.alegere));
    const [cheie, valoare] = client().authenticationHeader;
    const r = await fetch(`${instance.mediaUrl}/icons`, {
      method: "POST",
      body,
      headers: { [cheie]: valoare },
    });
    if (!r.ok) throw new Error(String(r.status));
    return ((await r.json()) as { id: string }).id;
  }

  async function salveaza() {
    const n = nume().trim();
    if (!n) return setEroare("Canalul are nevoie de un nume.");
    setEroare("");
    setLucrez(true);
    try {
      const d = descriere().trim();
      const icon = await iconNou();
      await props.canal.edit({
        name: n,
        ...(d ? { description: d } : { remove: ["Description" as const] }),
        ...(icon ? { icon } : {}),
      });
      // Categoria stă pe server, nu pe canal.
      if (categorie() !== categorieActuala) {
        await props.server.edit({
          categories: (props.server.categories ?? []).map((c) => ({
            ...c,
            channels: [
              ...c.channels.filter((id) => id !== props.canal.id),
              ...(c.id === categorie() ? [props.canal.id] : []),
            ],
          })),
        });
      }
      props.laInchidere();
    } catch {
      setEroare("Canalul nu s-a salvat. Încearcă din nou.");
      setLucrez(false);
    }
  }

  return (
    <Fereastra
      titlu={`#${props.canal.name}`}
      laInchidere={() => props.laInchidere()}
      latime={480}
    >
      <div style={{ display: "grid", gap: "14px" }}>
        <CampText
          eticheta="Nume"
          valoare={nume()}
          laSchimbare={setNume}
          maxim={32}
        />
        <CampText
          eticheta="Descriere"
          valoare={descriere()}
          laSchimbare={setDescriere}
          maxim={1024}
          randuri={2}
        />
        <Show when={props.server.categories?.length}>
          <CampAlege
            eticheta="Categorie"
            valoare={categorie()}
            laSchimbare={setCategorie}
            gol="Fără categorie"
            optiuni={(props.server.categories ?? []).map((c) => ({
              valoare: c.id,
              text: c.title,
            }))}
          />
        </Show>
        <AlegeBeanbag
          laSchimbare={(alegere, catalog) => setAvatar({ alegere, catalog })}
        />
        <Show when={eroare()}>
          <Mesaj fel="eroare">{eroare()}</Mesaj>
        </Show>
        <div style={{ display: "flex", gap: "8px" }}>
          <Buton piele="alb" lat onClick={() => props.laInchidere()}>
            Renunță
          </Buton>
          <Buton lat onClick={() => void salveaza()} dezactivat={lucrez()}>
            {lucrez() ? "Se salvează…" : "Salvează"}
          </Buton>
        </div>
      </div>
    </Fereastra>
  );
}
