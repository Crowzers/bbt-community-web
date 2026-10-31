import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import type { User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

import { C } from "./cont/ui";
import { trimiteCererea } from "./relatii";
import {
  AvatarOm,
  IconCautare,
  UN_RAND,
  deFonte,
  dupaNavigare,
} from "./telefon";

const LA_REZULTATE = 30;

/** „Ștefan" se găsește și scris „stefan": nimeni nu caută cu diacritice. */
function simplu(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * BBT: „+" din Mesaje, ca foaia `MesajNou` din `mobil/src/app/(tabs)/mesaje.tsx`, pe telefon și pe desktop: prietenii tăi, la
 * un click o conversație, iar dacă scrii ceva, și restul comunității, cu „Adaugă" (cererea userului, 31 oct).
 *
 * Cei din comunitate apar doar după ce începi să scrii: o listă cu toți ar arăta ca o invitație să-i adaugi pe toți. Rândul lor
 * nu deschide conversația: Stoat refuză DM-ul fără prietenie (403), deci singurul pas posibil e cererea. După ce o acceptă,
 * omul trece singur la prieteni. Blocații, în oricare sens, nu apar.
 */
export function MesajNou(props: { laInchidere: () => void }) {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const [eroare, setEroare] = createSignal("");
  const [cautare, setCautare] = createSignal("");
  const [lucreaza, setLucreaza] = createSignal<string>();
  // `undefined` = se încarcă. Semnal, nu `createResource`: acela ar suspenda toată pagina din spate.
  const [oameni, setOameni] = createSignal<User[]>();
  const [eroareComunitate, setEroareComunitate] = createSignal(false);

  onMount(() => {
    const server = client().servers.toList()[0];
    if (!server) return setEroareComunitate(true);
    server
      .fetchMembers()
      .then((r) =>
        setOameni(r.members.flatMap((m) => (m.user ? [m.user] : []))),
      )
      .catch(() => setEroareComunitate(true));
  });

  const cauta = () => simplu(cautare().trim());
  const potrivit = (u: User) =>
    simplu(u.displayName).includes(cauta()) ||
    simplu(u.username).includes(cauta());

  const prieteni = createMemo(() =>
    client()
      .users.toList()
      .filter((u) => u.relationship === "Friend" && potrivit(u))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "ro")),
  );

  const altii = createMemo(() => {
    if (!cauta()) return [];
    const eu = client().user?.id;
    return (oameni() ?? [])
      .filter(
        (u) =>
          u.id !== eu &&
          !u.bot &&
          !["Friend", "Blocked", "BlockedOther"].includes(u.relationship) &&
          potrivit(u),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "ro"))
      .slice(0, LA_REZULTATE);
  });

  async function scrie(om: User) {
    try {
      const dm = await om.openDM();
      props.laInchidere();
      navigate(`/channel/${dm.id}`);
      dupaNavigare(() => state.appDrawer()?.setShown(true));
    } catch {
      setEroare("Conversația nu se deschide acum. Încearcă din nou.");
    }
  }

  async function adauga(om: User) {
    setLucreaza(om.id);
    await trimiteCererea(client(), om);
    setLucreaza(undefined);
  }

  const gol = () => prieteni().length === 0 && altii().length === 0;
  const notaGol = () => {
    if (!cauta())
      return "Încă n-ai prieteni aici. Scrie un nume mai sus și trimite-i o cerere de prietenie.";
    if (eroareComunitate())
      return "Comunitatea nu se încarcă acum. Încearcă din nou.";
    return oameni()
      ? "Nu găsim pe nimeni cu numele ăsta."
      : "Căutăm în comunitate…";
  };

  return (
    <Portal>
      <div
        onClick={() => props.laInchidere()}
        style={{
          position: "fixed",
          inset: 0,
          "z-index": 1000,
          display: "flex",
          "align-items": telefon() ? "flex-end" : "center",
          "justify-content": "center",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mesaj nou"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            "flex-direction": "column",
            width: telefon() ? "100%" : "440px",
            height: "80%",
            "max-height": telefon() ? "80%" : "620px",
            padding: "8px 0 calc(env(safe-area-inset-bottom) + 12px)",
            "box-sizing": "border-box",
            "border-radius": telefon() ? "18px 18px 0 0" : "24px",
            background: C.fundal,
            color: C.text,
            "font-family": "Inter, sans-serif",
          }}
        >
          <Show when={telefon()}>
            <div
              style={{
                width: "40px",
                height: "4px",
                margin: "0 auto 8px",
                "flex-shrink": 0,
                "border-radius": "2px",
                background: C.foaie,
              }}
            />
          </Show>
          <h2 style={{ ...deFonte(20), margin: 0, padding: "4px 18px 8px" }}>
            Mesaj nou
          </h2>
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              "flex-shrink": 0,
              height: "42px",
              margin: "0 16px 6px",
              padding: "0 14px",
              "box-sizing": "border-box",
              "border-radius": "999px",
              background: C.foaie,
              color: C.slab,
            }}
          >
            <IconCautare />
            {/* 16, nu mai puțin: sub atât Safari mărește pagina la focus. */}
            <input
              type="search"
              placeholder="Caută pe cineva din comunitate"
              value={cautare()}
              onInput={(e) => setCautare(e.currentTarget.value)}
              style={{
                flex: 1,
                "min-width": 0,
                border: 0,
                outline: 0,
                background: "transparent",
                color: C.text,
                "font-family": "inherit",
                "font-size": "16px",
              }}
            />
          </label>
          <Show when={eroare()}>
            <p
              style={{
                margin: 0,
                padding: "8px 18px",
                color: C.rosu,
                "font-size": "14px",
              }}
            >
              {eroare()}
            </p>
          </Show>
          <div style={{ flex: 1, "min-height": 0, "overflow-y": "auto" }}>
            <Show when={gol()}>
              <p style={NOTA}>{notaGol()}</p>
            </Show>
            <Show when={prieteni().length > 0}>
              <h3 style={GRUPA}>PRIETENII TĂI</h3>
              <For each={prieteni()}>
                {(om) => (
                  <button
                    type="button"
                    onClick={() => void scrie(om)}
                    style={{
                      ...RAND,
                      width: "calc(100% - 16px)",
                      "box-sizing": "border-box",
                      border: 0,
                      background: "transparent",
                      "font-family": "inherit",
                      "text-align": "left",
                      cursor: "pointer",
                    }}
                  >
                    <AvatarOm om={om} marime={36} />
                    <span style={{ ...NUME, flex: 1 }}>{om.displayName}</span>
                  </button>
                )}
              </For>
            </Show>
            <Show when={altii().length > 0}>
              <h3 style={GRUPA}>DIN COMUNITATE</h3>
              <For each={altii()}>
                {(om) => (
                  <div style={RAND}>
                    <AvatarOm om={om} marime={36} />
                    <span style={{ flex: 1, "min-width": 0 }}>
                      <span style={{ ...NUME, display: "block" }}>
                        {om.displayName}
                      </span>
                      <span
                        style={{
                          ...UN_RAND,
                          display: "block",
                          color: C.stins,
                          "font-size": "13px",
                        }}
                      >
                        @{om.username}
                      </span>
                    </span>
                    <Show
                      when={om.relationship !== "Outgoing"}
                      fallback={
                        <span
                          style={{
                            color: C.slab,
                            "font-size": "13px",
                            "font-weight": 600,
                          }}
                        >
                          Cerere trimisă
                        </span>
                      }
                    >
                      <button
                        type="button"
                        class="bbt-moale"
                        disabled={lucreaza() === om.id}
                        onClick={() => void adauga(om)}
                        style={{
                          padding: "7px 12px",
                          border: 0,
                          "border-radius": "999px",
                          background: C.negru,
                          color: C.peNegru,
                          "font-family": "inherit",
                          "font-size": "14px",
                          "font-weight": 700,
                          cursor: "pointer",
                        }}
                      >
                        {om.relationship === "Incoming" ? "Acceptă" : "Adaugă"}
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const RAND = {
  display: "flex",
  "align-items": "center",
  gap: "12px",
  margin: "0 8px",
  padding: "8px 12px",
  "border-radius": "18px",
  color: C.text,
} as const;

const NUME = {
  ...UN_RAND,
  "font-size": "15px",
  "font-weight": 800,
} as const;

const NOTA = {
  margin: 0,
  padding: "16px 28px",
  color: C.slab,
  "font-size": "14px",
  "line-height": "20px",
  "text-align": "center",
} as const;

const GRUPA = {
  margin: 0,
  padding: "16px 16px 6px",
  color: C.slab,
  "font-size": "12px",
  "font-weight": 700,
  "letter-spacing": "0.6px",
} as const;
