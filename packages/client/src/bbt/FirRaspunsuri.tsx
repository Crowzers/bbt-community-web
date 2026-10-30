import { For, Show, createEffect, createMemo, on } from "solid-js";

import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";

import { Message } from "../../components/app/interface/channels/text/Message";

import { firDeschis, grupare, inchideFir, numarRaspunsuri } from "./fir";
import { CERC_40, IconInapoi, UN_RAND, deFonte } from "./telefon";

/** Cât trece între două mesaje ale aceluiași om ca al doilea să stea lipit de primul, ca în canal (`Messages.tsx`). */
const LIPITE_MS = 420000;

/**
 * BBT: firul deschis, ecranul din 24b: mesajul original sus, răspunsurile sub o linie roz. Stă peste canal, nu în locul
 * lui: canalul rămâne pornit dedesubt, cu poziția lui și cu lista din care vin răspunsurile (`fir.ts`).
 *
 * ⚠️ Bara de scris nu e aici: e cea a canalului, ridicată deasupra (`TextChannel.tsx`), cu tot ce știe ea (vocal, poze).
 * „Urmărești" din 24b lipsește: serverul n-are abonări la fire. Autorul mesajului original e anunțat prin mențiune.
 */
export function FirRaspunsuri(props: { channel: Channel }) {
  const client = useClient();
  let lista!: HTMLDivElement;

  const original = () => client().messages.get(firDeschis() ?? "");
  const raspunsuri = createMemo(
    () => grupare().firuri.get(firDeschis() ?? "") ?? [],
  );
  const autor = () =>
    original()?.member?.nickname ?? original()?.author?.displayName ?? "";

  // Firul se deschide la ultimul răspuns, iar unul nou îl aduce la vedere.
  createEffect(
    on(
      () => raspunsuri().length,
      () => requestAnimationFrame(() => (lista.scrollTop = lista.scrollHeight)),
    ),
  );

  return (
    <div
      class="bbt-fir"
      style={{
        position: "absolute",
        inset: 0,
        "z-index": 40,
        display: "flex",
        "flex-direction": "column",
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          padding: "6px 16px 10px",
        }}
      >
        <button
          type="button"
          aria-label="Înapoi la canal"
          onClick={inchideFir}
          style={{ ...CERC_40, width: "44px", height: "44px" }}
        >
          <IconInapoi />
        </button>
        <div style={{ flex: 1, "min-width": 0 }}>
          <div
            style={{
              ...deFonte(20),
              "letter-spacing": "-.04em",
              color: "#0A0A0B",
            }}
          >
            Răspunsuri
          </div>
          <div
            style={{
              ...UN_RAND,
              "font-size": "12px",
              color: "rgba(10,10,11,.6)",
            }}
          >
            la mesajul lui {autor()} · #{props.channel.name}
          </div>
        </div>
      </div>

      <Show when={original()} keyed>
        {(mesaj) => <Message message={mesaj} cardFir />}
      </Show>

      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          padding: "12px 24px 0",
          "font-size": "12px",
          "font-weight": 800,
          "letter-spacing": ".06em",
          "text-transform": "uppercase",
          color: "rgba(10,10,11,.6)",
        }}
      >
        {raspunsuri().length
          ? numarRaspunsuri(raspunsuri().length)
          : "Niciun răspuns încă"}
        <div style={{ flex: 1, height: "1px", background: "#E5E5E5" }} />
      </div>

      {/* 100 jos: acolo plutește bara de scris. */}
      <div
        ref={lista}
        style={{
          flex: 1,
          "min-height": 0,
          "overflow-y": "auto",
          "margin-left": "30px",
          padding: "10px 6px 100px 0",
          "border-left": "3px solid #FFB3D9",
        }}
      >
        <For each={raspunsuri()}>
          {(mesaj, i) => (
            <Message
              message={mesaj}
              inFir
              tail={
                i() > 0 &&
                raspunsuri()[i() - 1].authorId === mesaj.authorId &&
                +mesaj.createdAt - +raspunsuri()[i() - 1].createdAt < LIPITE_MS
              }
            />
          )}
        </For>
      </div>
    </div>
  );
}
