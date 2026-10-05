import { Show, createEffect } from "solid-js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";

import { BBT_SITE_URL } from "./config";

/**
 * Pagina de start din BBT Community: duce direct în serverul BBT.
 *
 * BBT Community e O SINGURĂ comunitate (decizia userului, 5 oct: un server, categorii pe roluri —
 * design §2 decizia 12). Pagina „Acasă" a lor era făcută pentru omul cu zeci de servere și arăta
 * gol la noi: „Creează un server", „Donează pentru Stoat", „Feedback pentru Stoat". Așa că `/`
 * nu mai are conținut propriu — e o ușă spre server. Mesajele directe rămân la „Mesaje" (`/friends`).
 *
 * Fără server (podul n-a apucat să-l bage pe om, invitația serverului lipsește din admin), spune
 * asta în loc să arate o pagină goală.
 */
export function Acasa() {
  const client = useClient();
  const navigate = useNavigate();

  const primulServer = () => client().servers.toList()[0];

  createEffect(() => {
    const server = primulServer();
    if (server) navigate(`/server/${server.id}`, { replace: true });
  });

  return (
    <Show when={!primulServer()}>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          gap: "12px",
          height: "100%",
          padding: "16px",
          "text-align": "center",
        }}
      >
        <p style={{ opacity: 0.8, "max-width": "420px" }}>
          Comunitatea BBT se pregătește pentru tine. Revino peste câteva
          momente.
        </p>
        <a
          href={BBT_SITE_URL}
          style={{ color: "inherit", "text-decoration": "underline" }}
        >
          Înapoi la BBT
        </a>
      </div>
    </Show>
  );
}
