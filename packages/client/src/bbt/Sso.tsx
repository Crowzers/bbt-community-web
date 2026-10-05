import { Show, createEffect, createSignal, onMount } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

import { BBT_ADMIN_URL, BBT_INTRARE } from "./config";

/**
 * `/sso#cod=…` — intrarea în BBT Community cu contul BBT, fără parolă.
 *
 * Fluxul (design BBT `2026-10-05-community-pe-stoat-design.md` §5.2): site-ul BBT verifică poarta
 * și trimite browserul aici cu un cod de unică folosință, valabil 60 de secunde. Pagina îl schimbă
 * la adminul BBT pe o sesiune Stoat și o folosește exact ca după login-ul lor
 * (`setSession` + `LoginUncached`, ca în `Controller.login`).
 *
 * ⚠️ Codul se scoate din bara de adrese ÎNAINTE de orice altceva: o captură de ecran sau un link
 * copiat după intrare n-au voie să-l conțină (chiar dacă e deja consumat, nu are ce căuta acolo).
 *
 * ⚠️ Dacă pe browser e deja logat ALTCINEVA (calculator folosit de doi oameni), întâi deconectare,
 * apoi login — altfel noua sesiune s-ar fi suprapus peste un client conectat ca altă persoană.
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

  // Login-ul pornește doar din starea `Ready` (vezi mașina de stări din `Controller.ts`). După o
  // deconectare, starea trece prin `Dispose` înapoi în `Ready` — de-aia așteptăm, nu forțăm.
  createEffect(() => {
    const sesiune = deIntrat();
    if (!sesiune || lifecycle.state() !== State.Ready) return;
    setDeIntrat(null);
    state.auth.setSession(sesiune);
    lifecycle.transition({ type: TransitionType.LoginUncached, session: sesiune });
    navigate("/", { replace: true });
  });

  onMount(async () => {
    const cod = new URLSearchParams(window.location.hash.slice(1)).get("cod");
    window.history.replaceState(null, "", "/sso");

    if (!cod) {
      window.location.replace(BBT_INTRARE);
      return;
    }

    try {
      const raspuns = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/schimb`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cod }),
      });

      if (raspuns.status === 401) {
        // Cod expirat sau deja folosit (ex. pagină reîncărcată): o intrare nouă îl rezolvă singură.
        window.location.replace(BBT_INTRARE);
        return;
      }
      if (raspuns.status === 403) {
        setEroare("Contul tău BBT nu are acces la Community.");
        return;
      }
      if (!raspuns.ok) {
        setEroare("Community nu răspunde acum. Încearcă din nou peste un minut.");
        return;
      }

      const s = (await raspuns.json()) as { token: string; userId: string; sessionId: string };
      const sesiune = { _id: s.sessionId, token: s.token, userId: s.userId, valid: false };
      const curenta = state.auth.getSession();

      if (curenta && isLoggedIn()) {
        if (curenta.userId === s.userId) {
          // Același om, deja înăuntru: sesiunea nouă e în plus, dar inofensivă. Intră direct.
          navigate("/", { replace: true });
          return;
        }
        logout();
      }
      setDeIntrat(sesiune);
    } catch {
      setEroare("Nu ne-am putut conecta. Verifică internetul și încearcă din nou.");
    }
  });

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
        "font-family": "inherit",
      }}
    >
      <Show
        when={eroare()}
        fallback={<p style={{ opacity: 0.8 }}>Se deschide BBT Community…</p>}
      >
        <p>{eroare()}</p>
        <a href={BBT_INTRARE} style={{ color: "inherit", "text-decoration": "underline" }}>
          Încearcă din nou
        </a>
      </Show>
    </div>
  );
}

/**
 * Înlocuiește login-ul cu parolă al Stoat: aici nu există parole (conturile sunt create și
 * deschise de podul BBT). Oricine ajunge la `/login` — sesiune expirată, deconectare, link vechi —
 * pleacă spre intrarea de pe site, care verifică poarta și îl aduce înapoi logat.
 */
export function BbtLogin() {
  onMount(() => window.location.replace(BBT_INTRARE));
  return null;
}
