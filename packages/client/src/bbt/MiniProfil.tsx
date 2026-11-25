import { useQuery } from "@tanstack/solid-query";
import { For, JSX, Match, Show, Switch, createSignal } from "solid-js";
import type { ServerMember, User } from "stoat.js";

import { UserContextMenu } from "@revolt/app/menus/UserContextMenu";
import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar, IconButton } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_ADMIN_URL } from "./config";
import { HartaNivele } from "./HartaNivele";
import { InelNivel } from "./InelNivel";
import { formatXp, nivelPentruScor } from "./nivele";
import { type UltimaPiesa, PiesaProfil } from "./PiesaProfil";
import { trimiteCererea } from "./relatii";

/**
 * Cardul de profil BBT — ce apare la click pe un om (popover pe desktop, foaie pe telefon).
 *
 * Cererea userului (5 oct 2026): „să arate cum ne arăta pe Community-ul vechi, înainte de Stoat —
 * mini profile". Modelul e `website/src/app/community/MiniProfil.tsx`: copertă, avatar pe copertă,
 * nume + bifa de verificat, @username, bio pe 3 rânduri, rolurile muzicale, Power și „Din <lună>",
 * apoi „Vezi profilul" (roz) și „Mesaj".
 *
 * Datele vin din adminul BBT (`/api/public/stoat/profil/<id Stoat>`, sesiunea Stoat ca dovadă);
 * avatarul și numele, din Stoat (sunt copia celor din BBT). Fără profil BBT (botul, contul
 * proprietarului, un profil nepublic) se arată cardul Stoat de dinainte — `fallback`.
 */

type ProfilBBT = {
  nume: string;
  username: string;
  bio: string | null;
  coverUrl: string | null;
  /**
   * Încadrarea copertei aleasă pe site, prin tragere (25 nov 2026): procente, ca `background-position`. Lipsă sau
   * `null` = mijlocul (copertele vechi, un admin vechi).
   */
  coverPozX?: number | null;
  coverPozY?: number | null;
  roles: string[];
  mainRole: string | null;
  powerScore: number;
  /**
   * Echipa BBT (cont de admin legat și activ): inelul unic, „∞" în loc de scor și fără hartă (design
   * `2026-11-18-inel-nivel`, deciziile 8-10). Opțional cât hub-ul poate ajunge înaintea adminului care îl trimite.
   */
  echipa?: boolean;
  nrBangere: number;
  membruDin: string | null;
  verificat: boolean;
  eu: boolean;
  profilUrl: string;
  // Opționale cât timp hub-ul poate ajunge înaintea adminului care le trimite: cardul rămâne pe Power, nu cade.
  stats?: { tabere: number; piese: number; bangere: number };
  ultimaPiesa?: UltimaPiesa | null;
};

/** Aceleași etichete ca pe site (`website/src/app/u/[username]/stil.ts`): `other` = „Explorer". */
const ROLURI: Record<string, string> = {
  producer: "Producer",
  dj: "DJ",
  beatmaker: "Beatmaker",
  vocalist: "Vocalist",
  songwriter: "Songwriter",
  instrumentist: "Instrumentist",
  sound_engineer: "Sound Engineer",
  other: "Explorer",
};

/**
 * Culoarea fiecărui rol, aceeași ca pe site (`CULORI_ROL` din `website/src/app/[limba]/u/[username]/stil.ts`): pastelul
 * paletei ca fundal, treapta închisă ca text. Familiile sunt cele din lista de membri (`admin/lib/stoat/roluri.ts`).
 * 19 nov 2026, userul: „să fim coerenți în culorile pastilelor de roluri”; până atunci pastilele erau gri aici, albe
 * pe site. Foaia e albă (`FUNDAL`), deci valorile de zi, fără variantă de noapte.
 * ⚠️ 25 nov 2026, userul: „fiecare să fie unic”, apoi rolurile în afara verdelui, galbenului și roșului (culori de
 * alertă), fără portocaliu, cu contrast bun pe alb și pe negru. Treptele `-deschis` / `-inchis` din
 * `website/src/app/tokens.css` (textul ≥6:1), aceleași ca în `cont/CardOm.tsx`.
 */
const CULORI_ROL: Record<string, { fundal: string; text: string }> = {
  vocalist: { fundal: "#FEE7F5", text: "#942E79" },
  producer: { fundal: "#D4F6F8", text: "#0C6468" },
  dj: { fundal: "#E2F1FE", text: "#025C93" },
  beatmaker: { fundal: "#E9EEFE", text: "#3D4CBF" },
  songwriter: { fundal: "#EEECFF", text: "#633CC5" },
  instrumentist: { fundal: "#E8EFF9", text: "#4B596C" },
  sound_engineer: { fundal: "#FBECDE", text: "#6D543B" },
  other: { fundal: "#F9E8FE", text: "#87319F" },
};
const CULOARE_ROL_IMPLICITA = { fundal: "#F2F4F7", text: "#475467" };

const luna = new Intl.DateTimeFormat("ro-RO", {
  month: "long",
  year: "numeric",
});

const ROZ = "#FFA8CD";
const ROZ_DESCHIS = "#FEDCEC";
const FUNDAL = "#FFFFFF"; // foaia din tema BBT (src/bbt/tema.ts, alb 8% pe negru)
const LINIE = "#E5E5E5";

export function MiniProfilBBT(props: {
  user: User;
  member?: ServerMember;
  onClose: () => void;
  fallback: JSX.Element;
  /** În foaia de pe telefon, rama o desenează dialogul — fără a doua rotunjire înăuntru. */
  inFoaie?: boolean;
}) {
  const state = useState();
  const navigate = useNavigate();

  const profil = useQuery(() => ({
    queryKey: ["bbt-profil", props.user.id],
    retry: false,
    staleTime: 60_000,
    queryFn: async (): Promise<ProfilBBT | null> => {
      const r = await fetch(
        `${BBT_ADMIN_URL}/api/public/stoat/profil/${props.user.id}`,
        {
          headers: { "X-Session-Token": state.auth.getSession()?.token ?? "" },
        },
      );
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
  }));

  function mesaj() {
    props.user.openDM().then((canal) => navigate(canal.path));
    props.onClose();
  }

  function editeaza() {
    navigate("/cont/profil");
    props.onClose();
  }

  const nume = () =>
    props.member?.displayName ?? props.user.displayName ?? profil.data?.nume;

  // Harta nivelelor ia locul cardului, în același popover / aceeași foaie (vezi `HartaNivele.tsx`).
  const [vedeHarta, setVedeHarta] = createSignal(false);

  return (
    <Switch>
      {/* Eroare (admin căzut) sau fără profil BBT: cardul Stoat — mai bine el decât un card gol. */}
      <Match when={profil.isError || profil.data === null}>
        {props.fallback}
      </Match>
      <Match when={profil.isLoading}>
        <div
          style={{
            width: props.inFoaie ? "100%" : "320px",
            padding: "32px 20px",
            "text-align": "center",
            color: "#6C6C6D",
            background: FUNDAL,
            "border-radius": props.inFoaie ? undefined : "16px",
            "font-size": "13px",
          }}
        >
          Se încarcă…
        </div>
      </Match>
      <Match when={profil.data}>
        {(p) => (
          <div
            on:pointerdown={(e) => e.stopPropagation()}
            style={{
              width: props.inFoaie ? "100%" : "320px",
              overflow: "hidden",
              background: FUNDAL,
              color: "#0A0A0B",
              "border-radius": props.inFoaie ? undefined : "16px",
              border: props.inFoaie ? undefined : `1px solid ${LINIE}`,
              "box-shadow": props.inFoaie
                ? undefined
                : "0 16px 48px rgb(0 0 0 / 60%)",
            }}
          >
            <Show when={vedeHarta()}>
              <HartaNivele
                scor={p().powerScore}
                onInapoi={() => setVedeHarta(false)}
              />
            </Show>
            {/* Profilul rămâne montat sub hartă, doar ascuns: la întoarcere inelul nu se mai animă încă o dată
                (animația e pentru deschidere și atingerea pozei, nu pentru „‹"). */}
            <div style={{ display: vedeHarta() ? "none" : undefined }}>
              {/* Coperta. Fără imagine: o bandă în rozul Slush — un dreptunghi gri ar fi arătat ca o
                imagine care n-a reușit să se încarce. */}
              <div
                style={{
                  position: "relative",
                  height: "76px",
                  background: p().coverUrl
                    ? `${p().coverPozX ?? 50}% ${p().coverPozY ?? 50}% / cover no-repeat url("${p().coverUrl}")`
                    : ROZ_DESCHIS,
                }}
              />

              <div style={{ position: "relative", padding: "0 16px 16px" }}>
                {/* Inelul de nivel: AICI, și doar aici, animat o dată la deschidere și la atingerea pozei (în liste e
                  static). Cutia are 96 = 64 × 1,5; `-52` = vechiul `-36` minus banda de 16, ca poza să stea tot unde
                  stătea pe copertă. Discul alb ia locul bordurii de 4 px: inelul stă pe alb, nu pe fotografia de copertă. */}
                <InelNivel
                  cheie={
                    p().echipa
                      ? "echipa"
                      : nivelPentruScor(p().powerScore).curent.cheie
                  }
                  poza={64}
                  animat
                  disc
                  fundal={FUNDAL}
                  style={{
                    "margin-top": "-52px",
                    "margin-left": "-10px",
                    // Nu −8, ca să rămână 8 px sub poză până la nume. Din 19 nov (inelul subțire, varianta B)
                    // decorul nu mai coboară sub `R2 + 2`, deci nici scânteile, nici punctatul nu mai ating numele.
                    cursor: "pointer",
                  }}
                >
                  <Avatar
                    src={props.user.animatedAvatarURL}
                    fallback={nume()}
                    fallbackBackground
                    size={64}
                  />
                </InelNivel>

                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "6px",
                    "flex-wrap": "wrap",
                  }}
                >
                  <span style={{ "font-size": "17px", "font-weight": 700 }}>
                    {nume()}
                  </span>
                  <Show when={p().verificat}>
                    <span
                      title="Email și telefon confirmate"
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        "justify-content": "center",
                        width: "18px",
                        height: "18px",
                        "border-radius": "50%",
                        background: "#4DA2FF",
                        color: "#0A0A0B",
                        "font-size": "12px",
                      }}
                    >
                      <Symbol size={12}>check</Symbol>
                    </span>
                  </Show>
                </div>
                <div style={{ "font-size": "13px", color: "#6C6C6D" }}>
                  @{p().username}
                  <Show when={p().membruDin}>
                    {" · "}Din {luna.format(new Date(p().membruDin!))}
                  </Show>
                </div>

                <Show when={p().bio}>
                  <p
                    style={{
                      margin: "8px 0 0",
                      "font-size": "14px",
                      "line-height": 1.5,
                      color: "#0A0A0B",
                      "white-space": "pre-line",
                      display: "-webkit-box",
                      "-webkit-line-clamp": 3,
                      "-webkit-box-orient": "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p().bio}
                  </p>
                </Show>

                <Show when={p().roles.length > 0}>
                  <div
                    style={{
                      display: "flex",
                      "flex-wrap": "wrap",
                      gap: "6px",
                      "margin-top": "10px",
                    }}
                  >
                    <For each={p().roles.slice(0, 4)}>
                      {(rol) => (
                        <span
                          style={{
                            "border-radius": "999px",
                            padding: "4px 10px",
                            "font-size": "12px",
                            "font-weight": 600,
                            background: (
                              CULORI_ROL[rol] ?? CULOARE_ROL_IMPLICITA
                            ).fundal,
                            color: (CULORI_ROL[rol] ?? CULOARE_ROL_IMPLICITA)
                              .text,
                          }}
                        >
                          {ROLURI[rol] ?? rol}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Cifrele și ultima piesă, ca în aplicație (`mobil/src/fir/ProfilScurt.tsx`). */}
                <div
                  style={{ display: "flex", gap: "6px", "margin-top": "12px" }}
                >
                  {/* Eticheta e numele nivelului (decizia 12: în listă nu-l scriem, aici da). Echipa: „∞", fără „?". */}
                  <Show
                    when={!p().echipa}
                    fallback={<Cifra valoare="∞" eticheta="Echipa BBT" lat />}
                  >
                    <Cifra
                      valoare={formatXp(p().powerScore)}
                      eticheta={nivelPentruScor(p().powerScore).curent.nume}
                      lat
                      intrebare={() => setVedeHarta(true)}
                    />
                  </Show>
                  <Show when={p().stats}>
                    {(s) => (
                      <>
                        <Cifra valoare={s().tabere} eticheta="Tabere" />
                        <Cifra valoare={s().piese} eticheta="Piese" />
                        <Cifra valoare={s().bangere} eticheta="Bangere" />
                      </>
                    )}
                  </Show>
                </div>
                <Show when={p().ultimaPiesa}>
                  {(piesa) => (
                    <PiesaProfil
                      piesa={piesa()}
                      total={p().stats?.piese ?? 1}
                      profilUrl={p().profilUrl}
                    />
                  )}
                </Show>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    "margin-top": "12px",
                    "align-items": "center",
                  }}
                >
                  <a
                    href={p().profilUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      height: "36px",
                      "border-radius": "10px",
                      background: ROZ,
                      color: "#000",
                      "font-size": "13px",
                      "font-weight": 600,
                      "text-decoration": "none",
                    }}
                  >
                    Vezi profilul
                  </a>
                  <Show
                    when={!p().eu}
                    fallback={
                      <ButonSecundar onClick={editeaza}>Editează</ButonSecundar>
                    }
                  >
                    <ButonRelatie user={props.user} onMesaj={mesaj} />
                  </Show>
                  {/* Restul acțiunilor Stoat (prieten, blocare, moderare) — meniul lor, neschimbat. */}
                  <IconButton
                    size="sm"
                    use:floating={{
                      contextMenu: () => (
                        <UserContextMenu
                          user={props.user}
                          member={props.member}
                          onClose={props.onClose}
                        />
                      ),
                      contextMenuHandler: "click",
                    }}
                  >
                    <Symbol>more_vert</Symbol>
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </Match>
    </Switch>
  );
}

function Cifra(props: {
  valoare: number | string;
  eticheta: string;
  /** Power: mai lată, ca „Professional" și „12.345 ?" să încapă lângă celelalte trei. */
  lat?: boolean;
  /** „?" de lângă cifră: deschide harta nivelelor. */
  intrebare?: () => void;
}) {
  return (
    <div
      style={{
        flex: props.lat ? 1.6 : 1,
        "min-width": 0,
        padding: "8px 0",
        "text-align": "center",
        "border-radius": "12px",
        background: "#F2F2F3",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          gap: "2px",
          "font-size": "16px",
          "font-weight": 700,
        }}
      >
        {props.valoare}
        <Show when={props.intrebare}>
          {/* Ținta e 28 de px (lângă un text de 16), cât încape în rând fără să-l înalțe: pe telefon tot se nimerește. */}
          <button
            type="button"
            aria-label="Ce înseamnă nivelele"
            onClick={(e) => {
              e.stopPropagation();
              props.intrebare!();
            }}
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              width: "28px",
              height: "22px",
              "margin-right": "-14px",
              padding: 0,
              border: 0,
              background: "transparent",
              color: "#6C6C6D",
              cursor: "pointer",
            }}
          >
            <Symbol size={16}>help</Symbol>
          </button>
        </Show>
      </div>
      <div
        style={{
          "font-size": "12px",
          color: "#6C6C6D",
          "white-space": "nowrap",
          overflow: "hidden",
          "text-overflow": "ellipsis",
          padding: "0 4px",
        }}
      >
        {props.eticheta}
      </div>
    </div>
  );
}

/**
 * Butonul de lângă „Vezi profilul", după relația cu omul.
 *
 * 🔴 În Stoat scrii doar PRIETENILOR (serverul lor refuză conversația altfel — vezi `DeschideDM.tsx`).
 * „Mesaj" pe un om care nu-ți e prieten „nu face nimic" (8 oct 2026): `openDM` pica, iar promisiunea
 * căzută nu ajungea nicăieri. Acum butonul e drumul care chiar există: cererea de prietenie, apoi
 * acceptarea ei, și abia între prieteni „Mesaj". `relationship` e reactiv — când celălalt acceptă,
 * butonul devine „Mesaj" singur, fără reîncărcare.
 */
function ButonRelatie(props: { user: User; onMesaj: () => void }) {
  const client = useClient();
  const [lucrez, setLucrez] = createSignal(false);

  async function fa(actiune: () => Promise<unknown>) {
    if (lucrez()) return;
    setLucrez(true);
    try {
      await actiune();
    } catch (e) {
      console.error("[bbt] relația n-a putut fi schimbată", e);
    } finally {
      setLucrez(false);
    }
  }

  return (
    <Switch>
      <Match when={props.user.relationship === "Friend" || props.user.bot}>
        <ButonSecundar onClick={props.onMesaj}>Mesaj</ButonSecundar>
      </Match>
      <Match when={props.user.relationship === "Incoming"}>
        <ButonSecundar
          plin
          onClick={() => fa(() => trimiteCererea(client(), props.user))}
        >
          Acceptă prietenia
        </ButonSecundar>
      </Match>
      <Match when={props.user.relationship === "Outgoing"}>
        <ButonSecundar onClick={() => fa(() => props.user.removeFriend())}>
          Anulează cererea
        </ButonSecundar>
      </Match>
      <Match when={props.user.relationship === "None"}>
        <ButonSecundar
          onClick={() => fa(() => trimiteCererea(client(), props.user))}
        >
          Adaugă la prieteni
        </ButonSecundar>
      </Match>
      {/* Blocat (de tine sau de el): nimic aici — deblocarea stă în meniul cu trei puncte. */}
    </Switch>
  );
}

function ButonSecundar(props: {
  onClick: () => void;
  children: JSX.Element;
  /** Acțiunea care se așteaptă de la om (acceptarea): albă, ca să nu se piardă lângă roz. */
  plin?: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      style={{
        height: "36px",
        padding: "0 14px",
        "border-radius": "10px",
        border: props.plin ? "none" : `1px solid ${LINIE}`,
        background: props.plin ? "#0A0A0B" : "transparent",
        color: props.plin ? "#FFFFFF" : "#0A0A0B",
        "white-space": "nowrap",
        "font-size": "13px",
        "font-weight": 600,
        cursor: "pointer",
      }}
    >
      {props.children}
    </button>
  );
}
