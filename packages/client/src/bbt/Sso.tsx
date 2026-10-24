import { Show, createEffect, createSignal, onMount } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

import { PanouLogin } from "./PanouLogin";
import { ZonaDeTras } from "./ZonaDeTras";
import { BBT_ADMIN_URL } from "./config";

/**
 * 🔴 **„Logat" la Stoat înseamnă CONECTAT, nu „am o sesiune".** `isLoggedIn` e adevărat doar în
 * `Connecting`/`Connected`/… — NU în `LoggingIn`, starea în care intră clientul imediat după
 * `LoginUncached`. Prima formă a paginii `/sso` naviga spre interfață chiar atunci; interfața vedea
 * „nelogat", trimitea la `/login`, iar `/login` (al nostru) trimitea la site → cod nou → `/sso` →
 * … la infinit. Local nu se vedea: conexiunea era instantanee. Pe server, da (5 oct 2026, prima
 * intrare reală). De-aia AMBELE pagini așteaptă starea, nu presupun nimic.
 */

/**
 * ⚠️ Până pe 20 oct 2026 aici era o plasă împotriva buclei site ↔ Community (la a treia trimitere
 * spre site în două minute, ne opream). Bucla era posibilă fiindcă `/login` și `/sso` fără cod
 * trimiteau SINGURE browserul pe site. Acum nu mai trimite nimic automat pe site: fără sesiune,
 * omul vede panoul de login din hub (`PanouLogin.tsx`). Site-ul se deschide doar la un clic.
 * Dacă reintroduci o trimitere automată spre site, pune și plasa înapoi.
 */
/**
 * Unde intră omul după SSO: `spre` din fragment, pus de admin când linkul de pe site cerea un loc
 * anume (mesajele, conversația cu cineva). Doar formele cunoscute — orice altceva = acasă, ca un
 * link măsluit să nu poată trimite nicăieri.
 */
let destinatie = "/";
function citesteDestinatia(fragment: URLSearchParams) {
  const spre = fragment.get("spre") ?? "";
  destinatie = /^\/(friends|bbt\/dm\/[0-9A-HJKMNP-TV-Z]{26})$/.test(spre)
    ? spre
    : "/";
}

function Ecran(props: { eroare: string | null; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "16px",
        height: "100%",
        "min-height": "100vh",
        padding: "16px",
        "text-align": "center",
      }}
    >
      <ZonaDeTras />
      <Show
        when={props.eroare}
        fallback={<p style={{ opacity: 0.8 }}>{props.text}</p>}
      >
        <p style={{ "max-width": "420px" }}>{props.eroare}</p>
        <a
          href="/login"
          style={{ color: "inherit", "text-decoration": "underline" }}
        >
          Încearcă din nou
        </a>
      </Show>
    </div>
  );
}

/**
 * `/sso#cod=…` — intrarea în BBT Community cu contul BBT, fără parolă.
 *
 * Fluxul (design BBT `2026-10-05-community-pe-stoat-design.md` §5.2): site-ul BBT verifică poarta
 * și trimite browserul aici cu un cod de unică folosință, valabil 60 de secunde. Pagina îl schimbă
 * la adminul BBT pe o sesiune Stoat și o folosește exact ca după login-ul lor
 * (`setSession` + `LoginUncached`, ca în `Controller.login`).
 *
 * ⚠️ Codul se scoate din bara de adrese ÎNAINTE de orice altceva.
 *
 * ⚠️ Clientul poate fi în orice stare când ajungem aici: conectat ca ALTCINEVA (calculator folosit
 * de doi oameni) → deconectare; blocat în `Error` sau `Onboarding` dintr-o încercare veche →
 * închis. Login-ul pornește DOAR din `Ready` (mașina de stări din `Controller.ts`).
 */
export default function Sso() {
  const state = useState();
  const navigate = useNavigate();
  const { lifecycle, isLoggedIn, logout } = useClientLifecycle();
  const [eroare, setEroare] = createSignal<string | null>(null);
  const [deIntrat, setDeIntrat] = createSignal<{
    _id: string;
    token: string;
    userId: string;
    valid: boolean;
  } | null>(null);
  const [astept, setAstept] = createSignal(false);

  // Pasul 2: din `Ready`, login. Stările intermediare (Dispose după o deconectare) se așteaptă.
  createEffect(() => {
    const sesiune = deIntrat();
    if (!sesiune) return;
    const s = lifecycle.state();
    if (s === State.Error) {
      lifecycle.transition({ type: TransitionType.Dismiss });
      return;
    }
    if (s === State.Onboarding) {
      lifecycle.transition({ type: TransitionType.Cancel });
      return;
    }
    if (s !== State.Ready) return;
    setDeIntrat(null);
    state.auth.setSession(sesiune);
    lifecycle.transition({
      type: TransitionType.LoginUncached,
      session: sesiune,
    });
    setAstept(true);
  });

  // Pasul 3: abia CONECTAT intră în interfață (vezi comentariul de sus — aici era bucla).
  createEffect(() => {
    if (!astept()) return;
    if (isLoggedIn()) {
      navigate(destinatie, { replace: true });
    } else if (lifecycle.state() === State.Error) {
      setAstept(false);
      setEroare(
        "Community nu s-a putut conecta. Încearcă din nou peste un minut.",
      );
    }
  });

  onMount(async () => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const cod = fragment.get("cod");
    citesteDestinatia(fragment);
    window.history.replaceState(null, "", "/sso");

    // Fără cod (adresă tastată, semn de carte) = la panoul de login, nu pe site.
    if (!cod) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const raspuns = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/schimb`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cod }),
      });

      if (raspuns.status === 401) {
        // Cod expirat sau deja folosit (ex. pagină reîncărcată): din panou, omul intră din nou.
        navigate("/login", { replace: true });
        return;
      }
      if (raspuns.status === 403) {
        setEroare("Contul tău BBT nu are acces la Community.");
        return;
      }
      if (raspuns.status === 503) {
        // Community închis până la lansare (adminul, `COMMUNITY_INCHIS_PANA_LA_LANSARE`).
        const corp = (await raspuns.json().catch(() => null)) as {
          inchis?: boolean;
        } | null;
        if (corp?.inchis) {
          setEroare(
            "Pregătim lansarea Community. Până atunci, accesul e închis. Anunțăm lansarea în curând.",
          );
          return;
        }
      }
      if (!raspuns.ok) {
        setEroare(
          "Community nu răspunde acum. Încearcă din nou peste un minut.",
        );
        return;
      }

      const s = (await raspuns.json()) as {
        token: string;
        userId: string;
        sessionId: string;
      };
      const sesiune = {
        _id: s.sessionId,
        token: s.token,
        userId: s.userId,
        valid: false,
      };
      const curenta = state.auth.getSession();

      if (curenta && isLoggedIn()) {
        if (curenta.userId === s.userId) {
          // Același om, deja conectat: sesiunea nouă e în plus, dar inofensivă. Intră direct.
          navigate(destinatie, { replace: true });
          return;
        }
        logout();
      }
      setDeIntrat(sesiune);
    } catch {
      setEroare(
        "Nu ne-am putut conecta. Verifică internetul și încearcă din nou.",
      );
    }
  });

  return <Ecran eroare={eroare()} text="Se deschide BBT Community…" />;
}

/**
 * Înlocuiește login-ul cu parolă al Stoat. Nu cere contul Stoat (ascuns, cu parola derivată în
 * admin), ci contul BBT: `PanouLogin.tsx` (20 oct 2026, cererea userului: hub-ul să meargă singur,
 * și în browser, și instalat).
 *
 * ⚠️ Panoul apare doar când e limpede că nu există sesiune (`Ready`) sau că cea existentă a picat
 * (`Error`). Interfața trimite la `/login` și cât timp clientul încă se CONECTEAZĂ cu o sesiune
 * bună (`LoggingIn`, la pornirea aplicației cu o sesiune salvată); acolo formularul ar clipi o
 * clipă peste un om deja logat. Dacă între timp se conectează, se întoarce în interfață.
 */
export function BbtLogin() {
  const navigate = useNavigate();
  const { lifecycle, isLoggedIn } = useClientLifecycle();

  createEffect(() => {
    if (isLoggedIn()) navigate("/", { replace: true });
  });

  const faraSesiune = () => {
    const s = lifecycle.state();
    return !isLoggedIn() && (s === State.Ready || s === State.Error);
  };

  return (
    <Show
      when={faraSesiune()}
      fallback={<Ecran eroare={null} text="Se conectează…" />}
    >
      <ZonaDeTras />
      <PanouLogin />
    </Show>
  );
}
