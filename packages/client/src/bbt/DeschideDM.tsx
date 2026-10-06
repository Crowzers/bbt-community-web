import { createEffect, createSignal, Match, Show, Switch } from "solid-js";

import type { User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useNavigate, useParams } from "@revolt/routing";

/**
 * `/bbt/dm/:userId` — deschide conversația directă cu un om și intră în ea.
 *
 * E destinația butonului „Mesaj" de pe profilul public de pe site (6 oct 2026, la ștergerea
 * Community-ului vechi): site-ul → `/hub` → adminul pune `spre=/bbt/dm/<id Stoat>` → `Sso.tsx` aduce
 * aici. `openDM` refolosește conversația existentă sau o creează (`GET /users/:id/dm`).
 *
 * 🔴 **În Stoat scrii doar PRIETENILOR** (serverul lor, `calculate_user_permissions`: fără prietenie,
 * un membru comun primește doar „vezi profilul", nu „trimite mesaj" → `MissingPermission
 * SendMessage`). Serverul Rust nu se atinge (decizia de design), deci pagina face pasul firesc: îți
 * oferă cererea de prietenie — sau acceptarea, dacă ți-a trimis-o el — și abia apoi conversația.
 *
 * Așteaptă clientul conectat: imediat după SSO, lista de utilizatori poate fi încă goală.
 */
type Stare =
  | { tip: "incarc" }
  | { tip: "cerere"; om: User } // nu sunteți prieteni — poți trimite cererea
  | { tip: "de-acceptat"; om: User } // ți-a trimis el cererea
  | { tip: "trimisa"; om: User } // cererea ta așteaptă
  | { tip: "blocat" }
  | { tip: "eroare" };

export function DeschideDM() {
  const client = useClient();
  const navigate = useNavigate();
  const params = useParams<{ userId: string }>();
  const [stare, setStare] = createSignal<Stare>({ tip: "incarc" });
  const [lucrez, setLucrez] = createSignal(false);
  let pornit = false;

  async function intra(om: User) {
    const dm = await om.openDM();
    navigate(`/channel/${dm.id}`, { replace: true });
  }

  /** De ce nu se poate scrie încă, după relația cu omul. */
  function fara(om: User): Stare {
    switch (om.relationship) {
      case "Incoming":
        return { tip: "de-acceptat", om };
      case "Outgoing":
        return { tip: "trimisa", om };
      case "Blocked":
      case "BlockedOther":
        return { tip: "blocat" };
      default:
        return { tip: "cerere", om };
    }
  }

  createEffect(() => {
    const c = client();
    if (!c?.user || pornit) return;
    pornit = true;
    (async () => {
      let om: User;
      try {
        om = await c.users.fetch(params.userId);
      } catch {
        return setStare({ tip: "eroare" });
      }
      try {
        await intra(om);
      } catch {
        setStare(om.relationship === "Friend" ? { tip: "eroare" } : fara(om));
      }
    })();
  });

  async function trimiteCererea(om: User) {
    setLucrez(true);
    try {
      await om.addFriend();
      setStare({ tip: "trimisa", om });
    } catch {
      setStare({ tip: "eroare" });
    } finally {
      setLucrez(false);
    }
  }

  async function accepta(om: User) {
    setLucrez(true);
    try {
      // `PUT /users/:id/friend` = acceptă cererea primită.
      await client().api.put(`/users/${om.id as ""}/friend`);
      await intra(om);
    } catch {
      setStare({ tip: "eroare" });
    } finally {
      setLucrez(false);
    }
  }

  const nume = (om: User) => om.displayName ?? om.username;

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "14px",
        "flex-grow": 1,
        padding: "24px",
        "text-align": "center",
        color: "rgba(255,255,255,0.7)",
        "font-size": "14px",
        "line-height": "1.5",
      }}
    >
      <Switch>
        <Match when={stare().tip === "incarc"}>Se deschide conversația…</Match>
        <Match when={stare().tip === "cerere" && (stare() as { om: User }).om}>
          {(om) => (
            <>
              <span>
                Ca să-i scrii lui{" "}
                <strong style={{ color: "#fff" }}>{nume(om())}</strong> în
                Community, trebuie să fiți prieteni.
              </span>
              <Buton
                principal
                onClick={() => trimiteCererea(om())}
                lucrez={lucrez()}
              >
                Trimite cerere de prietenie
              </Buton>
            </>
          )}
        </Match>
        <Match
          when={stare().tip === "de-acceptat" && (stare() as { om: User }).om}
        >
          {(om) => (
            <>
              <span>
                <strong style={{ color: "#fff" }}>{nume(om())}</strong> ți-a
                trimis o cerere de prietenie.
              </span>
              <Buton principal onClick={() => accepta(om())} lucrez={lucrez()}>
                Acceptă și scrie-i
              </Buton>
            </>
          )}
        </Match>
        <Match when={stare().tip === "trimisa" && (stare() as { om: User }).om}>
          {(om) => (
            <span>
              Cererea de prietenie către{" "}
              <strong style={{ color: "#fff" }}>{nume(om())}</strong> a plecat.
              Conversația se deschide după ce o acceptă.
            </span>
          )}
        </Match>
        <Match when={stare().tip === "blocat"}>Nu poți scrie acestui om.</Match>
        <Match when={stare().tip === "eroare"}>
          Conversația nu s-a putut deschide.
        </Match>
      </Switch>
      <Show when={stare().tip !== "incarc"}>
        <Buton onClick={() => navigate("/friends", { replace: true })}>
          Mergi la mesaje
        </Buton>
      </Show>
    </div>
  );
}

function Buton(props: {
  onClick: () => void;
  principal?: boolean;
  lucrez?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={props.lucrez}
      onClick={() => props.onClick()}
      style={{
        border: 0,
        "border-radius": "8px",
        padding: "10px 16px",
        background: props.principal ? "#ffa8cd" : "rgba(255,255,255,0.1)",
        color: props.principal ? "#000" : "#fff",
        font: "inherit",
        "font-weight": 600,
        cursor: "pointer",
        opacity: props.lucrez ? 0.5 : 1,
      }}
    >
      {props.children}
    </button>
  );
}
