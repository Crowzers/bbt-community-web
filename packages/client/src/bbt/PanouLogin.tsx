import { For, JSX, Match, Show, Switch, createSignal } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";

import { BBT_ADMIN_URL, BBT_INTRARE, BBT_SITE_URL } from "./config";

/**
 * BBT: panoul de login al Community, în hub (20 oct 2026).
 *
 * Cererea userului: hub-ul, deschis în browser sau instalat ca aplicație, să meargă singur. Cine
 * se deconectează rămâne aici, la un formular, nu e trimis pe site. Până acum `/login` arunca
 * omul pe `beanbagtheory.ro/hub`. Iar dacă era încă logat pe site, de acolo îl băga înapoi pe loc,
 * deci „Deconectare" nici nu deconecta.
 *
 * Login-ul e cu contul BBT (email + parola de pe site), NU cu un cont Stoat. Contul Stoat rămâne
 * ascuns, cu parola derivată din admin (decizia #7 din `2026-10-05-community-pe-stoat-design.md`).
 * Formularul doar compune trei rute care existau deja în admin, fără nimic nou pe server:
 *
 * 1. `POST /api/public/auth/login` → perechea de token-uri a participantului (ruta aplicațiilor
 *    native, cu limita ei de încercări).
 * 2. `POST /api/public/participant/comunitate/stoat/intrare` cu acel token → poarta (403 = n-are
 *    acces) și codul de unică folosință, exact ca butonul „Community" de pe site.
 * 3. `/sso#cod=…`, pagina care merge deja: schimbă codul pe sesiunea Stoat.
 *
 * ⚠️ Refresh token-ul primit la pasul 1 se REVOCĂ imediat (`/auth/logout`). Hub-ul n-are ce face
 * cu el: din clipa în care are sesiunea Stoat, nu mai vorbește cu adminul ca participant. Păstrat,
 * ar fi fost o sesiune BBT de 30 de zile, uitată într-o variabilă, la fiecare login.
 *
 * ⚠️ Cine și-a făcut contul cu Google n-are parolă: `auth/login` îi răspunde ca la o parolă
 * greșită. De-aia există „Intră prin beanbagtheory.ro", vechiul drum prin site, care știe Google.
 */

type Ecran = "formular" | "fara-acces" | "inchis" | "indisponibil";

const LINIE = "#E5E5E5";
const FOAIE = "#FFFFFF";
const ROZ = "#FFB3D9";
const STINS = "#6C6C6D";

/** Drumurile spre acces, în ordinea de pe site. Se deschid în browser, nu în locul hub-ului. */
const PRODUSE = [
  { href: "/camps", nume: "Tabere", simbol: "camping" },
  { href: "/workshops", nume: "Workshopuri", simbol: "bolt" },
  { href: "/cursuri", nume: "Cursuri", simbol: "school" },
];

async function eroareDinRaspuns(r: Response): Promise<string> {
  if (r.status === 401) return "Email sau parolă greșită.";
  if (r.status === 429) {
    return "Prea multe încercări. Mai încearcă peste câteva minute.";
  }
  if (r.status === 403) {
    const corp = (await r.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (corp?.error === "ACCOUNT_DEACTIVATED") {
      return "Contul tău e dezactivat. Scrie-ne la contact@beanbagtheory.ro.";
    }
    return "Contul nu e activat încă. Caută emailul de confirmare de la noi și apasă linkul din el.";
  }
  return "Nu am putut intra acum. Încearcă din nou peste un minut.";
}

export function PanouLogin() {
  const [ecran, setEcran] = createSignal<Ecran>("formular");
  const [email, setEmail] = createSignal("");
  const [parola, setParola] = createSignal("");
  const [eroare, setEroare] = createSignal<string | null>(null);
  const [lucrez, setLucrez] = createSignal(false);

  async function intra(e: SubmitEvent) {
    e.preventDefault();
    if (lucrez()) return;
    setEroare(null);
    setLucrez(true);
    try {
      const login = await fetch(`${BBT_ADMIN_URL}/api/public/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email().trim(), password: parola() }),
      });
      if (!login.ok) {
        setEroare(await eroareDinRaspuns(login));
        return;
      }
      const { accessToken, refreshToken } = (await login.json()) as {
        accessToken: string;
        refreshToken?: string;
      };

      const intrare = await fetch(
        `${BBT_ADMIN_URL}/api/public/participant/comunitate/stoat/intrare`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: "{}",
        },
      );

      // Vezi comentariul de sus: sesiunea BBT nu mai trebuie nimănui, oricum s-a terminat poarta.
      if (refreshToken) {
        void fetch(`${BBT_ADMIN_URL}/api/public/auth/logout`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          keepalive: true,
        }).catch(() => undefined);
      }

      if (intrare.status === 403) {
        setParola("");
        setEcran("fara-acces");
        return;
      }
      if (intrare.status === 503) {
        // `inchis` = Community închis până la lansare (adminul, `COMMUNITY_INCHIS_PANA_LA_LANSARE`).
        const corp = (await intrare.json().catch(() => null)) as {
          inchis?: boolean;
        } | null;
        setParola("");
        setEcran(corp?.inchis ? "inchis" : "indisponibil");
        return;
      }
      if (!intrare.ok) {
        setEroare("Nu am putut intra acum. Încearcă din nou peste un minut.");
        return;
      }

      const { url } = (await intrare.json()) as { url: string };
      // ⚠️ Doar fragmentul (`#cod=…`), pe originea pe care suntem deja. Adresa întreagă vine din
      // configul adminului (`config.app`); pe o instanță de test poate diferi de cea din bara de
      // adrese, iar aplicația instalată ar fi plecat din fereastra ei.
      window.location.replace(`/sso${new URL(url).hash}`);
    } catch {
      setEroare(
        "Nu ne-am putut conecta. Verifică internetul și încearcă din nou.",
      );
    } finally {
      setLucrez(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "min-height": "100%",
        height: "100%",
        "overflow-y": "auto",
        padding: "24px 16px",
        "box-sizing": "border-box",
        background: "#FFFFFF",
        color: "#0A0A0B",
      }}
    >
      <div style={{ width: "100%", "max-width": "380px" }}>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            gap: "12px",
            "margin-bottom": "28px",
          }}
        >
          <Wordmark
            aria-label="BBT"
            style={{ height: "30px", width: "auto", color: "#0A0A0B" }}
          />
          <span
            style={{
              "font-size": "15px",
              "font-weight": 700,
              "letter-spacing": "0.18em",
              "text-transform": "uppercase",
            }}
          >
            Community
          </span>
        </div>

        <div
          style={{
            padding: "28px 24px",
            "border-radius": "20px",
            border: `1px solid ${LINIE}`,
            background: FOAIE,
          }}
        >
          <Switch>
            <Match when={ecran() === "formular"}>
              <Formular
                email={email()}
                parola={parola()}
                eroare={eroare()}
                lucrez={lucrez()}
                laEmail={setEmail}
                laParola={setParola}
                laTrimitere={intra}
              />
            </Match>
            <Match when={ecran() === "fara-acces"}>
              <FaraAcces
                laAltCont={() => {
                  setEcran("formular");
                  setEroare(null);
                }}
              />
            </Match>
            <Match when={ecran() === "inchis"}>
              <Titlu>Pregătim lansarea Community</Titlu>
              <Text>
                Până atunci, accesul e închis. Anunțăm lansarea în curând.
              </Text>
              <ButonSecundar onClick={() => setEcran("formular")}>
                Înapoi
              </ButonSecundar>
            </Match>
            <Match when={ecran() === "indisponibil"}>
              <Titlu>Community se pregătește</Titlu>
              <Text>Revino în câteva minute. Contul tău e în regulă.</Text>
              <ButonSecundar onClick={() => setEcran("formular")}>
                Înapoi
              </ButonSecundar>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
}

function Formular(props: {
  email: string;
  parola: string;
  eroare: string | null;
  lucrez: boolean;
  laEmail: (v: string) => void;
  laParola: (v: string) => void;
  laTrimitere: (e: SubmitEvent) => void;
}) {
  return (
    <form onSubmit={(e) => props.laTrimitere(e)}>
      <Titlu>Intră în Community</Titlu>
      <Text>Cu emailul și parola contului tău BBT.</Text>

      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "12px",
          "margin-top": "20px",
        }}
      >
        <Camp
          eticheta="Email"
          tip="email"
          autocomplete="email"
          valoare={props.email}
          laSchimbare={props.laEmail}
        />
        <Camp
          eticheta="Parolă"
          tip="password"
          autocomplete="current-password"
          valoare={props.parola}
          laSchimbare={props.laParola}
        />
      </div>

      <Show when={props.eroare}>
        <p
          role="alert"
          style={{
            margin: "12px 0 0",
            color: "#CA1A38",
            "font-size": "13.5px",
            "line-height": "1.45",
          }}
        >
          {props.eroare}
        </p>
      </Show>

      <button
        type="submit"
        disabled={props.lucrez}
        style={{
          width: "100%",
          height: "46px",
          "margin-top": "20px",
          "border-radius": "999px",
          border: "0",
          background: ROZ,
          color: "#000",
          "font-family": "inherit",
          "font-size": "15px",
          "font-weight": 700,
          cursor: props.lucrez ? "default" : "pointer",
          opacity: props.lucrez ? 0.6 : 1,
        }}
      >
        {props.lucrez ? "Se verifică…" : "Intră"}
      </button>

      <a
        href={`${BBT_SITE_URL}/forgot-password`}
        target="_blank"
        rel="noopener"
        style={{
          display: "block",
          "margin-top": "14px",
          "text-align": "center",
          color: STINS,
          "font-size": "13px",
        }}
      >
        Ai uitat parola?
      </a>

      <div
        style={{
          margin: "20px 0 16px",
          "border-top": `1px solid ${LINIE}`,
        }}
      />

      {/* Conturile făcute cu Google n-au parolă. Vezi comentariul de la `PanouLogin`. */}
      <ButonSecundar href={BBT_INTRARE}>
        Ai cont cu Google? Intră prin site
      </ButonSecundar>
      <p
        style={{
          margin: "14px 0 0",
          "text-align": "center",
          color: STINS,
          "font-size": "13px",
        }}
      >
        N-ai cont?{" "}
        <a
          href={`${BBT_SITE_URL}/register`}
          target="_blank"
          rel="noopener"
          style={{ color: "#0A0A0B" }}
        >
          Fă-ți unul pe beanbagtheory.ro
        </a>
      </p>
    </form>
  );
}

/**
 * Contul e bun, dar poarta e închisă: n-a cumpărat încă nimic. Aceeași regulă ca pe site
 * (`website/src/app/hub/page.tsx`, starea „fara-acces"), cu drumurile spre cumpărare.
 */
function FaraAcces(props: { laAltCont: () => void }) {
  return (
    <>
      <Titlu>Încă n-ai acces la Community</Titlu>
      <Text>
        Community e pentru cei din tabere, workshopuri și cursuri. Primești
        acces singur, pe contul ăsta, imediat după prima înscriere.
      </Text>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "8px",
          "margin-top": "20px",
        }}
      >
        <For each={PRODUSE}>
          {(p) => (
            <a
              href={`${BBT_SITE_URL}${p.href}`}
              target="_blank"
              rel="noopener"
              style={{
                display: "flex",
                "align-items": "center",
                gap: "12px",
                height: "48px",
                padding: "0 16px",
                "border-radius": "12px",
                border: `1px solid ${LINIE}`,
                background: "#F2F2F3",
                color: "#0A0A0B",
                "text-decoration": "none",
                "font-size": "14.5px",
                "font-weight": 600,
              }}
            >
              <Symbol size={20}>{p.simbol}</Symbol>
              <span style={{ "flex-grow": 1 }}>{p.nume}</span>
              <Symbol size={18}>open_in_new</Symbol>
            </a>
          )}
        </For>
      </div>
      <div style={{ "margin-top": "16px" }}>
        <ButonSecundar onClick={props.laAltCont}>
          Intră cu alt cont
        </ButonSecundar>
      </div>
    </>
  );
}

function Titlu(props: { children: JSX.Element }) {
  return (
    <h1
      style={{
        margin: 0,
        "font-size": "20px",
        "font-weight": 700,
        "text-align": "center",
      }}
    >
      {props.children}
    </h1>
  );
}

function Text(props: { children: JSX.Element }) {
  return (
    <p
      style={{
        margin: "8px 0 0",
        color: STINS,
        "font-size": "14px",
        "line-height": "1.5",
        "text-align": "center",
      }}
    >
      {props.children}
    </p>
  );
}

function Camp(props: {
  eticheta: string;
  tip: string;
  autocomplete: string;
  valoare: string;
  laSchimbare: (v: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          "margin-bottom": "6px",
          color: STINS,
          "font-size": "12.5px",
          "font-weight": 600,
        }}
      >
        {props.eticheta}
      </span>
      <input
        type={props.tip}
        autocomplete={props.autocomplete}
        required
        value={props.valoare}
        onInput={(e) => props.laSchimbare(e.currentTarget.value)}
        style={{
          width: "100%",
          height: "44px",
          padding: "0 14px",
          "box-sizing": "border-box",
          "border-radius": "10px",
          border: `1px solid ${LINIE}`,
          background: "#FFFFFF",
          color: "#0A0A0B",
          outline: "none",
          "font-family": "inherit",
          "font-size": "15px",
        }}
      />
    </label>
  );
}

function ButonSecundar(props: {
  children: JSX.Element;
  href?: string;
  onClick?: () => void;
}) {
  const stil = {
    display: "flex",
    "align-items": "center",
    "justify-content": "center",
    width: "100%",
    height: "44px",
    "box-sizing": "border-box" as const,
    "border-radius": "999px",
    border: `1px solid ${LINIE}`,
    background: "transparent",
    color: "#0A0A0B",
    "font-family": "inherit",
    "font-size": "14px",
    "font-weight": 600,
    "text-decoration": "none",
    cursor: "pointer",
  };
  return (
    <Show
      when={props.href}
      fallback={
        <button type="button" onClick={() => props.onClick?.()} style={stil}>
          {props.children}
        </button>
      }
    >
      <a href={props.href} style={stil}>
        {props.children}
      </a>
    </Show>
  );
}
