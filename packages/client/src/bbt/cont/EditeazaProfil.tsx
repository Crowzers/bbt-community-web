import { For, Show, createSignal, onCleanup, untrack } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { useDevice } from "@revolt/common";
import { useBeforeLeave } from "@revolt/routing";

import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, useSesiune } from "./date";
import { CuCont, DateCont, SchimbaPoza, ZonaDeRisc, useEtichete } from "./Setari";
import { JUDETE, LUNI, TARI, VerificareTelefon } from "./SetariDate";
import type { Participant } from "./tipuri";
import {
  Buton,
  C,
  CampAlege,
  CampText,
  Eticheta,
  Eticheta2,
  MesajSalvare,
  NotaAdresa,
  Sectiune,
  TitluPagina,
  usernameBun,
} from "./ui";

/** Rețelele pe care le primește ruta, ca în aplicație și pe profilul public de pe site. */
const RETELE = [
  { cheie: "instagram", nume: "Instagram", exemplu: "@numele.tau" },
  { cheie: "spotify", nume: "Spotify", exemplu: "https://open.spotify.com/..." },
  { cheie: "youtube", nume: "YouTube", exemplu: "@numele.tau" },
  { cheie: "soundcloud", nume: "SoundCloud", exemplu: "numele-tau" },
  { cheie: "tiktok", nume: "TikTok", exemplu: "@numele.tau" },
  { cheie: "website", nume: "Website", exemplu: "https://..." },
];

/** Rețelele unde omul scrie numele, nu adresa. */
const PROFILURI: Record<string, (nume: string) => string> = {
  instagram: (n) => `https://instagram.com/${n}`,
  tiktok: (n) => `https://www.tiktok.com/@${n}`,
  youtube: (n) => `https://www.youtube.com/@${n}`,
  soundcloud: (n) => `https://soundcloud.com/${n}`,
};

const FACTURARE = [
  "tipPersoana",
  "denumireFacturare",
  "cuiFacturare",
  "nrRegCom",
  "adresaFacturare",
  "judetFacturare",
  "localitateFacturare",
] as const;

const ANI = Array.from({ length: 60 }, (_, i) =>
  String(new Date().getFullYear() - 10 - i),
);

function primulPrincipal(lista: string[], principal?: string | null) {
  return principal && lista.includes(principal)
    ? [principal, ...lista.filter((x) => x !== principal)]
    : lista;
}

function formularDin(p: Participant) {
  const [an, luna] = p.dataNasterii?.slice(0, 10).split("-") ?? [];
  return {
    numeAfisat: p.numeAfisat ?? "",
    bio: p.bio ?? "",
    username: p.username ?? "",
    // Cel principal primul: așa se trimite înapoi, fără un al doilea selector pentru „principal".
    roluri: primulPrincipal(p.roles ?? [], p.mainRole),
    genuri: primulPrincipal(p.musicGenres ?? [], p.mainGenre),
    linkuri: { ...(p.socialLinks ?? {}) } as Record<string, string>,
    prenume: p.prenume ?? "",
    numeFamilie: p.numeFamilie ?? "",
    telefon: p.telefon ?? "",
    luna: luna ? String(Number(luna)) : "",
    an: an ?? "",
    gen: p.gen ?? "",
    tara: p.tara ?? "",
    judet: p.judet ?? "",
    oras: p.oras ?? "",
    adresa: p.adresa ?? "",
    tipPersoana: p.tipPersoana === "PJ" ? "PJ" : "PF",
    denumireFacturare: p.denumireFacturare ?? "",
    cuiFacturare: p.cuiFacturare ?? "",
    nrRegCom: p.nrRegCom ?? "",
    adresaFacturare: p.adresaFacturare ?? "",
    judetFacturare: p.judetFacturare ?? "",
    localitateFacturare: p.localitateFacturare ?? "",
  };
}

type Formular = ReturnType<typeof formularDin>;

/**
 * Ruta cere o adresă întreagă, dar nimeni nu scrie „https://" de mână. ⚠️ „@andrei" ajungea `https://@andrei`: ruta îl primea ca
 * adresă validă, iar linkul de pe profil nu ducea nicăieri. La rețelele cu nume de utilizator, numele devine adresa profilului.
 */
function adresaRetea(cheie: string, text: string) {
  const t = text.trim();
  if (!t || /^https?:\/\//i.test(t)) return t;
  return cheie in PROFILURI && /^@?[\w.-]+$/.test(t)
    ? PROFILURI[cheie](t.replace(/^@/, ""))
    : `https://${t}`;
}

/**
 * BBT: „Editează profilul", copia ecranului `mobil/src/app/editeaza-profil.tsx`: tot contul pe un singur ecran, cu
 * un singur „Salvează" (cererea userului, 31 oct: erau două pagini care păreau același lucru). Din varianta B (31 oct) e
 * la fel și pe desktop și tabletă, unde până atunci stăteau „Profil public" și „Date personale". Față de aplicație are și
 * poza sus: aici nu se schimbă din Profil.
 *
 * Trei lucruri făcute dinadins altfel decât pe site:
 * - Pleacă doar ce s-a schimbat. Pe site ziua din `dataNasterii` se pierde la fiecare salvare (formularul are doar lună și
 *   an, deci scrie ziua 1), iar un cont vechi, fără prenume, nu poate salva deloc.
 * - Un număr nou se verifică mereu prin SMS, chiar dacă cel vechi era verificat.
 * - Numărul nu trece prin „Salvează": îl scrie în cont verificarea.
 *
 * Pe desktop și tabletă, două coloane (varianta B, aleasă de user pe 1 nov 2026): ce văd ceilalți și ce ține doar de tine și de
 * facturi. „Salvează" stă în bara de jos, la vedere cât ai modificări.
 */
export function EditeazaProfil() {
  const { layout } = useDevice();
  return (
    <CuCont>
      {(p) => (
        <div
          style={{
            ...COLOANA,
            "max-width": layout() === "phone" ? "640px" : undefined,
          }}
        >
          <Show when={layout() !== "phone"}>
            <TitluPagina>Editează profilul</TitluPagina>
          </Show>
          <Formular p={p} />
          {/* ⚠️ În afara formularului: parola are `<form>` propriu, iar trimiterea lui ar urca și în „Salvează". */}
          <div style={DOUA_COLOANE}>
            <DateCont p={p} faraTelefon />
            <ZonaDeRisc />
          </div>
        </div>
      )}
    </CuCont>
  );
}

function Formular(props: { p: Participant }) {
  const p0 = untrack(() => props.p);
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const etichete = useEtichete();
  const [baza, setBaza] = createSignal(formularDin(p0));
  const [f, setF] = createSignal(formularDin(p0));
  const [telVerificat, setTelVerificat] = createSignal(p0.phoneVerified);
  const [lucrez, setLucrez] = createSignal(false);
  const [stare, setStare] = createSignal<{
    tip: "ok" | "err";
    text: string;
  } | null>(null);

  function schimba(parte: Partial<Formular>) {
    setF((x) => ({ ...x, ...parte }));
    setStare(null);
  }

  const pj = () => f().tipPersoana === "PJ";
  const usernameNou = () => f().username.trim().toLowerCase();
  const usernameSchimbat = () => usernameNou() !== baza().username;
  // Regula apare abia după ce omul iese din câmp sau apasă „Salvează": altfel ar clipi la primele litere scrise.
  const [atins, setAtins] = createSignal(false);
  const telefon = () => f().telefon.trim();
  const telSchimbat = () => telefon() !== baza().telefon;
  // Numărul se compară separat: se scrie prin verificare, nu prin „Salvează".
  const schimbat = () =>
    JSON.stringify({ ...f(), telefon: "" }) !==
    JSON.stringify({ ...baza(), telefon: "" });

  // Modificările nesalvate nu dispar pe tăcute: nici la schimbarea paginii, nici la închiderea tab-ului.
  useBeforeLeave((e) => {
    if (e.defaultPrevented || !schimbat()) return;
    if (!window.confirm("Ai modificări nesalvate. Ieși fără să le salvezi?"))
      e.preventDefault();
  });
  const laInchidere = (e: BeforeUnloadEvent) => {
    if (schimbat()) e.preventDefault();
  };
  window.addEventListener("beforeunload", laInchidere);
  onCleanup(() => window.removeEventListener("beforeunload", laInchidere));

  const comuta = (lista: string[], x: string) =>
    lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x];

  async function salveaza(e?: SubmitEvent) {
    e?.preventDefault();
    if (usernameSchimbat() && !usernameBun(usernameNou()))
      return void setAtins(true);
    const x = f();
    const b = baza();
    const prenume = x.prenume.trim();
    const numeFamilie = x.numeFamilie.trim();
    const numeSchimbat = prenume !== b.prenume || numeFamilie !== b.numeFamilie;
    const eroare = telSchimbat()
      ? "Verifică întâi numărul de telefon."
      : !x.roluri.length && b.roluri.length
        ? "Alege cel puțin un rol."
      : // Un cont vechi n-are numele despărțit: cu doar o parte scrisă, ruta ar recompune numele de pe factură fără cealaltă.
        numeSchimbat && (!prenume || !numeFamilie)
        ? "Scrie și prenumele, și numele de familie."
        : pj() && !x.cuiFacturare.trim()
          ? "Fără CUI nu putem emite factura pe firmă."
          : pj() && !x.denumireFacturare.trim()
            ? "Scrie denumirea firmei, așa cum apare la Registrul Comerțului."
            : undefined;
    if (eroare) return setStare({ tip: "err", text: eroare });

    setLucrez(true);
    setStare(null);
    try {
      const linkuri = Object.fromEntries(
        RETELE.map(({ cheie }) => [
          cheie,
          adresaRetea(cheie, x.linkuri[cheie] ?? ""),
        ]).filter(([, url]) => url),
      );
      // Doar ce s-a schimbat: ruta verifică username-ul și sincronizează Community la fiecare câmp primit.
      const profil = {
        ...(x.numeAfisat !== b.numeAfisat && { numeAfisat: x.numeAfisat }),
        ...(x.bio !== b.bio && { bio: x.bio }),
        ...(usernameNou() !== b.username && { username: usernameNou() }),
        ...(JSON.stringify(x.linkuri) !== JSON.stringify(b.linkuri) && {
          socialLinks: linkuri,
        }),
        ...(numeSchimbat && { prenume, numeFamilie }),
        // Ruta le primește împreună, iar rolurile nu pot rămâne goale.
        ...(x.roluri.length &&
          JSON.stringify([x.roluri, x.genuri]) !==
            JSON.stringify([b.roluri, b.genuri]) && {
            roles: x.roluri,
            mainRole: x.roluri[0],
            musicGenres: x.genuri,
            mainGenre: x.genuri[0],
          }),
      };
      if (Object.keys(profil).length)
        await cerereCont(sesiune(), "/api/public/participant/profile", {
          method: "PUT",
          body: JSON.stringify(profil),
        });

      const personale: Record<string, string | null> = {};
      for (const c of ["tara", "judet", "oras", "adresa"] as const)
        if (x[c] !== b[c]) personale[c] = x[c];
      if (x.gen !== b.gen) personale.gen = x.gen || null;
      if ((x.luna !== b.luna || x.an !== b.an) && x.luna && x.an)
        personale.dataNasterii = `${x.an}-${x.luna.padStart(2, "0")}-01`;
      if (FACTURARE.some((c) => x[c] !== b[c])) {
        // Pe persoană fizică golim datele de firmă: altfel rămân în bază și, la o comutare înapoi, factura pleacă pe un CUI vechi.
        personale.tipPersoana = x.tipPersoana;
        for (const c of FACTURARE.slice(1)) personale[c] = pj() ? x[c] : "";
      }
      if (Object.keys(personale).length)
        await cerereCont(sesiune(), "/api/public/participant/date-personale", {
          method: "PUT",
          body: JSON.stringify(personale),
        });

      const nou = {
        ...x,
        username: usernameNou(),
        linkuri,
        prenume,
        numeFamilie,
      };
      setF(nou);
      setBaza({ ...nou, telefon: b.telefon });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
      setStare({ tip: "ok", text: "Salvat." });
    } catch (err) {
      setStare({
        tip: "err",
        text:
          err instanceof Error && err.message !== "Cererea n-a mers."
            ? err.message
            : "Nu am putut salva. Încearcă din nou.",
      });
    } finally {
      setLucrez(false);
    }
  }

  return (
    <form
      onSubmit={salveaza}
      style={{ display: "flex", "flex-direction": "column", gap: "14px" }}
    >
      <div style={DOUA_COLOANE}>
        <div style={COLOANA}>
          <Eticheta>Ce văd ceilalți</Eticheta>
          <div style={{ display: "flex", "justify-content": "center" }}>
            <SchimbaPoza p={props.p} />
          </div>

          <Sectiune titlu="Profilul public">
            <div style={COLOANA}>
              <CampText
                eticheta="Nume de scenă"
                valoare={f().numeAfisat}
                laSchimbare={(numeAfisat) => schimba({ numeAfisat })}
                maxim={40}
                placeholder="Numele tău de scenă"
              />
              <CampText
                eticheta="Despre tine"
                randuri={3}
                maxim={300}
                valoare={f().bio}
                laSchimbare={(bio) => schimba({ bio })}
                placeholder="Câteva cuvinte despre tine și muzica ta"
              />
              <div>
                <CampText
                  eticheta="Adresa profilului"
                  inainte="/u/"
                  valoare={f().username}
                  laSchimbare={(v) => schimba({ username: v.toLowerCase() })}
                  laIesire={() => setAtins(true)}
                  maxim={30}
                  placeholder="numele.tau"
                />
                <NotaAdresa
                  username={usernameNou()}
                  schimbat={usernameSchimbat()}
                  atins={atins()}
                />
              </div>
            </div>
          </Sectiune>

          <Sectiune titlu="Rol și genuri">
            <div style={COLOANA}>
              <div>
                <Eticheta2>Rol</Eticheta2>
                <Cipuri
                  toate={etichete.data?.roluri ?? {}}
                  alese={f().roluri}
                  laApasare={(r) => schimba({ roluri: comuta(f().roluri, r) })}
                />
              </div>
              <div>
                <Eticheta2>Genuri</Eticheta2>
                <Cipuri
                  toate={etichete.data?.genuri ?? {}}
                  alese={f().genuri}
                  laApasare={(g) => schimba({ genuri: comuta(f().genuri, g) })}
                />
              </div>
              <p style={NOTA}>Primul ales apare primul pe profil.</p>
            </div>
          </Sectiune>

          <Sectiune titlu="Linkuri">
            <div style={COLOANA}>
              <For each={RETELE}>
                {(r) => (
                  <CampText
                    eticheta={r.nume}
                    inputmode="url"
                    maxim={200}
                    valoare={f().linkuri[r.cheie] ?? ""}
                    laSchimbare={(url) =>
                      schimba({ linkuri: { ...f().linkuri, [r.cheie]: url } })
                    }
                    placeholder={r.exemplu}
                  />
                )}
              </For>
            </div>
          </Sectiune>
        </div>
        <div style={COLOANA}>
          <Eticheta>Doar pentru tine și pentru facturi</Eticheta>
          <Sectiune titlu="Numele real">
            <div style={COLOANA}>
              <CampText
                eticheta="Prenume"
                valoare={f().prenume}
                laSchimbare={(prenume) => schimba({ prenume })}
                maxim={60}
                placeholder="Ion"
              />
              <CampText
                eticheta="Nume de familie"
                valoare={f().numeFamilie}
                laSchimbare={(numeFamilie) => schimba({ numeFamilie })}
                maxim={60}
                placeholder="Popescu"
              />
              <p style={NOTA}>
                Așa apare pe factură. Pe profilul public apare numele tău de scenă.
              </p>
            </div>
          </Sectiune>

          <Sectiune titlu="Contact">
            <div style={COLOANA}>
              <CampText
                eticheta={
                  telVerificat() && !telSchimbat()
                    ? "Telefon · verificat"
                    : "Telefon"
                }
                tip="tel"
                autocomplete="tel"
                valoare={f().telefon}
                laSchimbare={(t) => schimba({ telefon: t })}
                placeholder="+40712345678"
              />
              <Show when={telefon() && (telSchimbat() || !telVerificat())}>
                <VerificareTelefon
                  telefon={telefon()}
                  laVerificat={() => {
                    // Aceeași regulă ca în `auth/phone/verify-otp`: asta e forma pe care o scrie ruta în cont.
                    const e164 = telefon().startsWith("+")
                      ? telefon()
                      : `+4${telefon()}`;
                    setTelVerificat(true);
                    setF((x) => ({ ...x, telefon: e164 }));
                    setBaza((x) => ({ ...x, telefon: e164 }));
                    void qc.invalidateQueries({ queryKey: CHEIE_CONT });
                  }}
                />
              </Show>
            </div>
          </Sectiune>

          <Sectiune titlu="Date personale">
            <div style={COLOANA}>
              <div>
                <Eticheta2>Data nașterii</Eticheta2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ "flex-grow": 1 }}>
                    <CampAlege
                      eticheta=""
                      valoare={f().luna}
                      laSchimbare={(luna) => schimba({ luna })}
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
                      laSchimbare={(an) => schimba({ an })}
                      gol="An"
                      optiuni={ANI}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Eticheta2>Gen</Eticheta2>
                <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                  <For each={["Masculin", "Feminin", "Altul"]}>
                    {(g) => (
                      <Comutator
                        activ={f().gen === g}
                        // Apăsat din nou, genul se scoate, ca pe site.
                        laApasare={() => schimba({ gen: f().gen === g ? "" : g })}
                      >
                        {g}
                      </Comutator>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Sectiune>

          <Sectiune titlu="Adresă">
            <div style={COLOANA}>
              <CampAlege
                eticheta="Țara"
                valoare={f().tara}
                laSchimbare={(tara) => schimba({ tara })}
                optiuni={TARI}
              />
              <CampAlege
                eticheta="Județ"
                valoare={f().judet}
                laSchimbare={(judet) => schimba({ judet })}
                gol="Alege județul"
                optiuni={JUDETE}
              />
              <CampText
                eticheta="Oraș"
                valoare={f().oras}
                laSchimbare={(oras) => schimba({ oras })}
                placeholder="Cluj-Napoca"
              />
              <CampText
                eticheta="Stradă"
                valoare={f().adresa}
                laSchimbare={(adresa) => schimba({ adresa })}
                placeholder="Str. Exemplu, nr. 1, ap. 2"
              />
            </div>
          </Sectiune>

          <Sectiune titlu="Facturare">
            <div style={COLOANA}>
              <div style={{ display: "flex", gap: "8px" }}>
                <Comutator
                  activ={!pj()}
                  laApasare={() => schimba({ tipPersoana: "PF" })}
                >
                  Persoană fizică
                </Comutator>
                <Comutator
                  activ={pj()}
                  laApasare={() => schimba({ tipPersoana: "PJ" })}
                >
                  Firmă
                </Comutator>
              </div>
              <Show
                when={pj()}
                fallback={
                  <p style={NOTA}>Facturăm pe numele și adresa de mai sus.</p>
                }
              >
                <CampText
                  eticheta="Denumire firmă"
                  valoare={f().denumireFacturare}
                  laSchimbare={(denumireFacturare) =>
                    schimba({ denumireFacturare })
                  }
                  placeholder="Numele firmei S.R.L."
                />
                <CampText
                  eticheta="CUI"
                  inputmode="numeric"
                  valoare={f().cuiFacturare}
                  laSchimbare={(cuiFacturare) => schimba({ cuiFacturare })}
                  placeholder="50461809"
                />
                <CampText
                  eticheta="Nr. Reg. Com."
                  valoare={f().nrRegCom}
                  laSchimbare={(nrRegCom) => schimba({ nrRegCom })}
                  placeholder="J2024017413008"
                />
                <CampAlege
                  eticheta="Județ (sediu)"
                  valoare={f().judetFacturare}
                  laSchimbare={(judetFacturare) => schimba({ judetFacturare })}
                  gol="La fel ca adresa mea"
                  optiuni={JUDETE}
                />
                <CampText
                  eticheta="Localitate (sediu)"
                  valoare={f().localitateFacturare}
                  laSchimbare={(localitateFacturare) =>
                    schimba({ localitateFacturare })
                  }
                  placeholder="La fel ca adresa mea"
                />
                <CampText
                  eticheta="Stradă (sediu)"
                  valoare={f().adresaFacturare}
                  laSchimbare={(adresaFacturare) => schimba({ adresaFacturare })}
                  placeholder="La fel ca adresa mea"
                />
                <p style={NOTA}>
                  Sediul îl scrii doar dacă diferă de adresa ta. Lăsat gol, folosim
                  adresa de mai sus.
                </p>
              </Show>
            </div>
          </Sectiune>
        </div>
      </div>

      <Show when={schimbat() || stare()}>
        <div
          style={{
            position: "sticky",
            bottom: "12px",
            "z-index": 5,
            display: "flex",
            "align-items": "center",
            "justify-content": "space-between",
            gap: "12px",
            padding: "8px 8px 8px 18px",
            "border-radius": "999px",
            border: `1px solid ${C.linie}`,
            background: C.fundal,
            "box-shadow": "0 16px 48px rgba(10,10,11,0.14)",
          }}
        >
          <Show
            when={stare()}
            fallback={
              <span style={{ color: C.stins, "font-size": "14px" }}>
                Ai modificări nesalvate
              </span>
            }
          >
            <MesajSalvare stare={stare()} />
          </Show>
          <Show when={schimbat()}>
            <Buton mic tip="submit" dezactivat={lucrez()}>
              {lucrez() ? "Se salvează…" : "Salvează"}
            </Buton>
          </Show>
        </div>
      </Show>
    </form>
  );
}

const COLOANA = {
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
} as const;

/** Pe lat, două coloane; pe îngust, una singură, fără vreo regulă de lățime în plus. */
const DOUA_COLOANE = {
  display: "grid",
  "grid-template-columns": "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
  gap: "16px",
  "align-items": "start",
} as const;

const NOTA = {
  margin: 0,
  color: C.stins,
  "font-size": "14px",
  "line-height": "1.45",
} as const;

function Cipuri(props: {
  toate: Record<string, string>;
  alese: string[];
  laApasare: (slug: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
      <For each={Object.entries(props.toate)}>
        {([slug, nume]) => (
          <Comutator
            activ={props.alese.includes(slug)}
            laApasare={() => props.laApasare(slug)}
          >
            {nume}
          </Comutator>
        )}
      </For>
    </div>
  );
}

function Comutator(props: {
  activ: boolean;
  laApasare: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.activ}
      onClick={props.laApasare}
      style={{
        height: "38px",
        padding: "0 16px",
        "border-radius": "999px",
        border: `1px solid ${props.activ ? "transparent" : C.linie}`,
        background: props.activ ? C.negru : "transparent",
        color: props.activ ? C.peNegru : C.stins,
        "font-family": "inherit",
        "font-size": "14px",
        "font-weight": 600,
        cursor: "pointer",
      }}
    >
      {props.children}
    </button>
  );
}
