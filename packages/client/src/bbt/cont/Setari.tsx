import { For, Show, createSignal, untrack } from "solid-js";

import { useQuery, useQueryClient } from "@tanstack/solid-query";

import { useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_ADMIN_URL, BBT_SITE_URL } from "../config";
import { cerereCont, uitaTokenBbt } from "../tokenBbt";

import { comutaSunetele, sunetePornite } from "../sunete";
import { CHEIE_CONT, useCont, useSesiune } from "./date";

import { ListaNotificari } from "./Notificari";
import { DateFacturare, DatePersonale } from "./SetariDate";
import type { Participant } from "./tipuri";
import {
  Buton,
  C,
  CampText,
  DE_FONTE,
  Incarcare,
  Mesaj,
  MesajSalvare,
  NotaAdresa,
  RandValoare,
  Sectiune,
  TitluPagina,
  usernameBun,
} from "./ui";

/**
 * BBT: setările contului în hub, desfăcute în trei pagini (23f, 30 oct 2026): Profil public (ce văd ceilalți),
 * Date personale (ce trebuie pe contract și pe factură, plus parola) și Notificări. Până atunci erau o singură
 * pagină, „Setări cont", copia lui `website/src/app/dashboard/setari/page.tsx`; macheta le-a despărțit ca nimeni
 * să nu caute CNP-ul lângă poza de profil.
 *
 * Ce e altfel decât pe site, dinadins:
 * - Notificările deschid setările Community (`settings → notifications`), nu butonul de push al site-ului: în hub,
 *   notificările vin de la Community, cu setările lor.
 * - Parola se schimbă AICI, nu pe `/schimba-parola`: e același `auth/change-password`.
 * - „Deconectează de pe toate dispozitivele" închide și sesiunile din Community: o face adminul,
 *   în `deconecteazaDeTot` (`admin/lib/stoat/sesiuni.ts`), deci la fel și de pe site.
 */

type Stare = { tip: "ok" | "err"; text: string } | null;

/** Pagina cu datele contului încărcate; formularele se remontează doar la ALT cont (vezi `keyed`). */
export function CuCont(props: {
  children: (p: Participant) => import("solid-js").JSX.Element;
}) {
  const cont = useCont();
  return (
    <>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca datele tale. Încearcă din nou peste un minut.
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
          {(_id) => props.children(cont.data!)}
        </Show>
      </Show>
    </>
  );
}

const coloana = {
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
  "max-width": "760px",
} as const;

/* ── Profil public (23f) ─────────────────────────────────────────────────────────────────── */

/** Rețelele din 23f. Celelalte pe care le știe adminul (YouTube, TikTok, site) rămân cum sunt, nu se șterg la salvare. */
const RETELE = [
  {
    cheie: "spotify",
    nume: "Spotify",
    exemplu: "https://open.spotify.com/artist/…",
  },
  {
    cheie: "soundcloud",
    nume: "SoundCloud",
    exemplu: "https://soundcloud.com/…",
  },
  { cheie: "instagram", nume: "Instagram", exemplu: "https://instagram.com/…" },
] as const;

/**
 * Numele rolurilor și genurilor („sound_engineer" → „Sound Engineer"). În bază stau slug-urile; lista cu nume e în
 * admin, aceeași pe care o citesc onboardingul site-ului și aplicația de telefon.
 */
export function useEtichete() {
  return useQuery(() => ({
    queryKey: ["bbt-etichete-profil"],
    staleTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const lista = async (cale: string) => {
        const r = await fetch(`${BBT_ADMIN_URL}${cale}`);
        const d = (await r.json().catch(() => null)) as
          | { slug: string; label: string }[]
          | null;
        return Object.fromEntries(
          (Array.isArray(d) ? d : []).map((x) => [x.slug, x.label]),
        ) as Record<string, string>;
      };
      const [roluri, genuri] = await Promise.all([
        lista("/api/public/roluri"),
        lista("/api/public/genuri"),
      ]);
      return { roluri, genuri };
    },
  }));
}

export function ProfilPublic() {
  return <CuCont>{(p) => <FormularProfil p={p} />}</CuCont>;
}

function FormularProfil(props: { p: Participant }) {
  // Valorile de pornire, citite O dată: cât editezi, câmpurile sunt ale tale, nu ale ultimului răspuns `/me`.
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const etichete = useEtichete();
  const [numeScena, setNumeScena] = createSignal(p0.numeAfisat ?? "");
  const [username, setUsername] = createSignal(p0.username ?? "");
  const [bio, setBio] = createSignal(p0.bio ?? "");
  const [retele, setRetele] = createSignal<Record<string, string>>({
    ...(p0.socialLinks ?? {}),
  });
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);
  const usernameNou = () => username().trim().toLowerCase();
  const schimbat = () => usernameNou() !== (p0.username ?? "");
  // Regula apare abia după ce omul iese din câmp sau apasă „Salvează": altfel ar clipi la primele litere scrise.
  const [atins, setAtins] = createSignal(false);

  const rol = () =>
    props.p.mainRole
      ? (etichete.data?.roluri[props.p.mainRole] ?? props.p.mainRole)
      : null;
  const genuri = () =>
    (props.p.musicGenres ?? [])
      .map((g) => etichete.data?.genuri[g] ?? g)
      .join(", ");

  async function salveaza(e?: SubmitEvent) {
    e?.preventDefault();
    if (schimbat() && !usernameBun(usernameNou())) return void setAtins(true);
    setLucrez(true);
    setStare(null);
    try {
      await cerereCont(sesiune(), "/api/public/participant/profile", {
        method: "PUT",
        body: JSON.stringify({
          numeAfisat: numeScena(),
          username: usernameNou(),
          bio: bio(),
          // Rețelele golite se trimit ca text gol: adminul le șterge.
          socialLinks: retele(),
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
    <>
      <TitluPagina
        dreapta={
          <div
            style={{ display: "flex", "align-items": "center", gap: "12px" }}
          >
            <MesajSalvare stare={stare()} />
            <Buton mic onClick={() => void salveaza()} dezactivat={lucrez()}>
              {lucrez() ? "Se salvează…" : "Salvează"}
            </Buton>
          </div>
        }
      >
        Profil public
      </TitluPagina>
      {/* 23f: în stânga cardul de 320 cu poza și cum te văd ceilalți, în dreapta formularul pe alb, pe două
          coloane. Pe îngust, cardul urcă deasupra formularului. */}
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          gap: "24px",
          "align-items": "flex-start",
        }}
      >
        <div
          style={{
            flex: "0 1 320px",
            "min-width": 0,
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "10px",
            padding: "24px",
            "box-sizing": "border-box",
            "border-radius": "28px",
            background: C.foaie,
            "text-align": "center",
          }}
        >
          <SchimbaPoza p={props.p} />
          <p
            style={{
              ...DE_FONTE,
              margin: "4px 0 0",
              "font-size": "22px",
              "line-height": "1.1",
            }}
          >
            {props.p.numeAfisat ?? props.p.numeComplet}
          </p>
          <p style={{ margin: 0, color: C.stins, "font-size": "13px" }}>
            {[rol(), genuri(), props.p.oras].filter(Boolean).join(" · ")}
          </p>
          <Show when={props.p.phoneVerified}>
            <span
              style={{
                display: "inline-flex",
                padding: "5px 10px",
                "border-radius": "999px",
                background: C.verdeDeschis,
                "font-size": "12px",
                "font-weight": 800,
              }}
            >
              ✓ Artist verificat
            </span>
          </Show>
          <p style={{ margin: "4px 0 0", color: C.stins, "font-size": "12px" }}>
            Așa te văd ceilalți membri. Numele real, CNP-ul și adresa sunt în
            Date personale.
          </p>
          <Show when={props.p.username}>
            <Buton
              piele="alb"
              mic
              href={`${BBT_SITE_URL}/u/${props.p.username}`}
              target="_blank"
            >
              Vezi profilul ↗
            </Buton>
          </Show>
        </div>
        <form
          onSubmit={salveaza}
          style={{
            flex: "1 1 360px",
            "min-width": 0,
            display: "grid",
            "grid-template-columns":
              "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
            gap: "14px",
          }}
        >
          <CampText
            peAlb
            eticheta="Nume de scenă"
            valoare={numeScena()}
            laSchimbare={setNumeScena}
            maxim={40}
            placeholder={props.p.numeComplet}
          />
          <div>
            <CampText
              peAlb
              eticheta="Adresa profilului"
              inainte="/u/"
              valoare={username()}
              laSchimbare={(v) => setUsername(v.toLowerCase())}
              laIesire={() => setAtins(true)}
              placeholder="numele.tau"
            />
            <NotaAdresa
              username={usernameNou()}
              schimbat={schimbat()}
              atins={atins()}
            />
          </div>
          {/* Rolul și genurile se aleg la înscriere și n-au încă un editor nici pe site; aici doar se văd. */}
          <Show when={rol()}>
            <ValoareFixa eticheta="Rol" valoare={rol()!} />
          </Show>
          <Show when={genuri()}>
            <ValoareFixa eticheta="Genuri" valoare={genuri()} />
          </Show>
          {/* „Despre tine" pe toată lățimea, ca în 23f. */}
          <div style={{ "grid-column": "1 / -1" }}>
            <CampText
              peAlb
              eticheta="Despre tine"
              randuri={3}
              maxim={300}
              valoare={bio()}
              laSchimbare={setBio}
              placeholder="Două rânduri despre ce faci și ce cauți."
            />
          </div>
          <For each={RETELE}>
            {(r) => (
              <CampText
                peAlb
                eticheta={r.nume}
                tip="url"
                inputmode="url"
                valoare={retele()[r.cheie] ?? ""}
                laSchimbare={(v) => setRetele((x) => ({ ...x, [r.cheie]: v }))}
                placeholder={r.exemplu}
              />
            )}
          </For>
          {/* Enter dintr-un câmp salvează, ca butonul din titlu. */}
          <button type="submit" hidden />
        </form>
      </div>
    </>
  );
}

function ValoareFixa(props: { eticheta: string; valoare: string }) {
  return (
    <div>
      <span
        style={{
          display: "block",
          "margin-bottom": "6px",
          color: C.stins,
          "font-size": "12px",
          "font-weight": 700,
          "letter-spacing": "0.06em",
          "text-transform": "uppercase",
        }}
      >
        {props.eticheta}
      </span>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          height: "48px",
          padding: "0 18px",
          "border-radius": "999px",
          background: C.foaie,
          "font-size": "16px",
        }}
      >
        {props.valoare}
      </div>
    </div>
  );
}

/**
 * Poza de profil, schimbată din hub. Aceeași rută ca pe site și în aplicația de telefon (`participant/avatar`):
 * adminul o pune în cont și o trimite și în Community, deci avatarul din bara de sus se schimbă singur.
 *
 * ⚠️ Ruta primește cel mult 400 000 de caractere (~300 KB): poza se taie pătrat și se micșorează la 300 × 300
 * înainte, ca pe site.
 */
export function SchimbaPoza(props: { p: Participant }) {
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  let fisier: HTMLInputElement | undefined;

  async function urca(f: File) {
    setEroare("");
    setLucrez(true);
    try {
      const dataUrl = await micsoreaza(f);
      await cerereCont(sesiune(), "/api/public/participant/avatar", {
        method: "POST",
        body: JSON.stringify({ dataUrl }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
    } catch (e) {
      setEroare(
        e instanceof Error && e.message !== "Cererea n-a mers."
          ? e.message
          : "Poza nu s-a schimbat. Încearcă din nou.",
      );
    } finally {
      setLucrez(false);
      if (fisier) fisier.value = "";
    }
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        gap: "8px",
      }}
    >
      {/* Inelul roz din 23f, ca în meniul contului. */}
      <div
        style={{
          display: "flex",
          padding: "3px",
          "border-radius": "999px",
          background: C.roz,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "2px",
            "border-radius": "999px",
            background: C.fundal,
          }}
        >
          <Avatar
            src={props.p.avatarUrl ?? undefined}
            fallback={props.p.numeAfisat ?? props.p.numeComplet}
            fallbackBackground
            size={86}
          />
        </div>
      </div>
      <input
        ref={fisier}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) void urca(f);
        }}
      />
      {/* 23f: „Schimbă poza" e un link de 13 gros sub poză, nu un buton. */}
      <button
        type="button"
        onClick={() => fisier?.click()}
        disabled={lucrez()}
        style={{
          padding: 0,
          border: 0,
          background: "transparent",
          color: C.text,
          "font-family": "inherit",
          "font-size": "13px",
          "font-weight": 700,
          cursor: lucrez() ? "default" : "pointer",
        }}
      >
        {lucrez() ? "Se urcă…" : "Schimbă poza"}
      </button>
      <Show when={eroare()}>
        <p
          role="alert"
          style={{
            margin: 0,
            color: C.rosu,
            "font-size": "14px",
            "max-width": "180px",
            "text-align": "center",
          }}
        >
          {eroare()}
        </p>
      </Show>
    </div>
  );
}

/** Taie poza pătrat din mijloc și o micșorează la 300 × 300, JPEG. */
async function micsoreaza(f: File): Promise<string> {
  const bitmap = await createImageBitmap(f).catch(() => {
    throw new Error("Fișierul ăsta nu e o poză pe care s-o putem citi.");
  });
  const latura = Math.min(bitmap.width, bitmap.height);
  const panza = document.createElement("canvas");
  panza.width = 300;
  panza.height = 300;
  const ctx = panza.getContext("2d")!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - latura) / 2,
    (bitmap.height - latura) / 2,
    latura,
    latura,
    0,
    0,
    300,
    300,
  );
  bitmap.close();
  return panza.toDataURL("image/jpeg", 0.85);
}

/* ── Date personale ──────────────────────────────────────────────────────────────────────── */

function SectiuniDate(props: { p: Participant }) {
  return (
    <div style={coloana}>
      <p style={{ margin: 0, color: C.stins, "font-size": "14px" }}>
        Ce trece pe contract și pe factură. Nu apare pe profilul public.
      </p>
      <NumeReal p={props.p} />
      <DatePersonale p={props.p} />
      <DateFacturare p={props.p} />
      <DateCont p={props.p} />
      <ZonaDeRisc />
    </div>
  );
}

export function DatePersonaleCont() {
  return (
    <>
      <TitluPagina>Date personale</TitluPagina>
      <CuCont>{(p) => <SectiuniDate p={p} />}</CuCont>
    </>
  );
}

/** Numele real (apare pe factură). Numele de scenă și adresa profilului stau în Profil public. */
function NumeReal(props: { p: Participant }) {
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [prenume, setPrenume] = createSignal(p0.prenume ?? "");
  const [nume, setNume] = createSignal(p0.numeFamilie ?? "");
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<Stare>(null);

  async function salveaza(e: SubmitEvent) {
    e.preventDefault();
    setLucrez(true);
    setStare(null);
    try {
      await cerereCont(sesiune(), "/api/public/participant/profile", {
        method: "PUT",
        body: JSON.stringify({ prenume: prenume(), numeFamilie: nume() }),
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
    <Sectiune titlu="Numele real">
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
        <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
          <Buton tip="submit" mic dezactivat={lucrez()}>
            {lucrez() ? "Se salvează…" : "Salvează"}
          </Buton>
          <MesajSalvare stare={stare()} />
        </div>
      </form>
    </Sectiune>
  );
}

/* ── Notificări ──────────────────────────────────────────────────────────────────────────── */

export function NotificariCont() {
  const { openModal } = useModals();
  return (
    <>
      <TitluPagina>Notificări</TitluPagina>
      <div style={coloana}>
        <ListaNotificari />
        <Sectiune titlu="Sunete">
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
                color: C.stins,
                "font-size": "16px",
                "line-height": "1.45",
              }}
            >
              Note de marimba la reacții și la mesajele trimise.
            </span>
            <Buton piele="alb" mic onClick={comutaSunetele}>
              {sunetePornite() ? "Oprește" : "Pornește"}
            </Buton>
          </div>
        </Sectiune>
        <Sectiune titlu="Community">
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
                color: C.stins,
                "font-size": "16px",
                "line-height": "1.45",
              }}
            >
              Mesaje, mențiuni și canale: ce notificări primești de la
              Community, pe dispozitivul ăsta.
            </span>
            <Buton
              piele="alb"
              mic
              onClick={() =>
                openModal({
                  type: "settings",
                  config: "user",
                  context: { page: "notifications" },
                })
              }
            >
              <Symbol size={15}>notifications</Symbol> Setări notificări
            </Buton>
          </div>
        </Sectiune>
      </div>
    </>
  );
}

/* ── Date cont, parolă, zona de risc ─────────────────────────────────────────────────────── */

export function DateCont(props: { p: Participant; faraTelefon?: boolean }) {
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
        <Show when={props.p.telefon && !props.faraTelefon}>
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
              "font-size": "14px",
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
        <Buton tip="submit" mic dezactivat={lucrez() || !veche() || !noua()}>
          {lucrez() ? "Se schimbă…" : "Schimbă parola"}
        </Buton>
        <Buton piele="alb" mic onClick={props.laGata}>
          Renunță
        </Buton>
        <MesajSalvare stare={stare()} />
      </div>
    </form>
  );
}

export function ZonaDeRisc() {
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
                background: C.rosu,
                color: C.peNegru,
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
              "font-size": "16px",
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
              "font-size": "14px",
              "line-height": "1.5",
            }}
          >
            {confirm() === "peste-tot"
              ? "Ieși de pe site și din Community, pe toate dispozitivele. Intri din nou cu emailul și parola."
              : "Ieși de peste tot și nu mai poți intra până nu îl reactivezi. Te poți răzgândi oricând: când încerci să intri pe site, îți oferim reactivarea. Datele rămân neatinse."}
          </p>
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            <Buton piele="alb" mic onClick={() => setConfirm(null)}>
              Renunță
            </Buton>
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
                background: C.rosu,
                color: C.peNegru,
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
