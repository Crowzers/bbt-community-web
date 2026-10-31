import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { Message } from "../../components/app/interface/channels/text/Message";

import { firDeschis, grupare, inchideFir, numarRaspunsuri } from "./fir";
import { sunetTrimis } from "./sunete";
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
          "border-left": "3px solid #FFA8CD",
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

/**
 * BBT: firul pe desktop (24e): panou de 400 în dreapta canalului, în locul listei de membri. Canalul rămâne la vedere,
 * cu mesajul original evidențiat.
 *
 * ⚠️ Bara de scris de aici e doar pentru text: `Composition.tsx` ține o singură instanță pe canal (ciorna și
 * `_setNodeReplacement` sunt ale canalului), deci a doua, lângă cea a canalului, și-ar amesteca textul cu ea.
 */
export function FirPanou(props: { channel: Channel }) {
  const client = useClient();
  let lista!: HTMLDivElement;

  const original = () => client().messages.get(firDeschis() ?? "");
  const raspunsuri = createMemo(
    () => grupare().firuri.get(firDeschis() ?? "") ?? [],
  );
  const autor = () =>
    original()?.member?.nickname ?? original()?.author?.displayName ?? "";

  createEffect(
    on(
      () => raspunsuri().length,
      () => requestAnimationFrame(() => (lista.scrollTop = lista.scrollHeight)),
    ),
  );

  return (
    <div
      class="bbt-fir-panou"
      style={{
        display: "flex",
        "flex-direction": "column",
        "flex-shrink": 0,
        width: "400px",
        "max-width": "55%",
        "min-height": 0,
        "border-left": "1px solid #E5E5E5",
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "10px",
          height: "60px",
          "flex-shrink": 0,
          padding: "0 20px",
          "box-sizing": "border-box",
          "border-bottom": "1px solid #E5E5E5",
        }}
      >
        <div style={{ flex: 1, "min-width": 0 }}>
          <div
            style={{
              ...deFonte(18),
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
            la mesajul lui {autor()}
          </div>
        </div>
        <button
          type="button"
          aria-label="Închide firul"
          onClick={inchideFir}
          style={{ ...CERC_40, width: "36px", height: "36px" }}
        >
          <Symbol size={18}>close</Symbol>
        </button>
      </div>

      <div
        style={{
          "flex-shrink": 0,
          "max-height": "40%",
          "overflow-y": "auto",
          padding: "10px 8px",
          "border-bottom": "1px solid #E5E5E5",
        }}
      >
        <Show when={original()} keyed>
          {(mesaj) => <Message message={mesaj} inFir avatarFir={32} />}
        </Show>
      </div>

      <div
        ref={lista}
        style={{
          flex: 1,
          "min-height": 0,
          "overflow-y": "auto",
          "margin-left": "36px",
          padding: "10px 0",
          "border-left": "3px solid #FFA8CD",
        }}
      >
        <For each={raspunsuri()}>
          {(mesaj) => <Message message={mesaj} inFir avatarFir={28} />}
        </For>
      </div>

      <Show when={props.channel.havePermission("SendMessage")}>
        <BaraFir channel={props.channel} />
      </Show>
    </div>
  );
}

function BaraFir(props: { channel: Channel }) {
  const [text, setText] = createSignal("");
  const [trimit, setTrimit] = createSignal(false);

  async function trimite() {
    const continut = text().trim();
    const id = firDeschis();
    if (!continut || !id || trimit()) return;

    setTrimit(true);
    try {
      await props.channel.sendMessage({
        content: continut,
        replies: [{ id, mention: true }],
      });
      sunetTrimis();
      setText("");
    } finally {
      setTrimit(false);
    }
  }

  return (
    <div style={{ padding: "12px 20px 16px", "flex-shrink": 0 }}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "6px",
          padding: "6px 6px 6px 18px",
          "border-radius": "26px",
          background: "#0A0A0B",
        }}
      >
        <textarea
          rows={1}
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void trimite();
            }
          }}
          placeholder="Răspunde în fir…"
          aria-label="Răspunde în fir"
          style={{
            flex: 1,
            "min-width": 0,
            "max-height": "120px",
            padding: 0,
            border: 0,
            outline: 0,
            resize: "none",
            background: "transparent",
            color: "#FFFFFF",
            "font-family": "inherit",
            "font-size": "14px",
            "line-height": "20px",
          }}
        />
        <button
          type="button"
          aria-label="Trimite răspunsul"
          disabled={!text().trim() || trimit()}
          onClick={() => void trimite()}
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            width: "40px",
            height: "40px",
            "flex-shrink": 0,
            padding: 0,
            border: 0,
            "border-radius": "50%",
            background: "#FFA8CD",
            color: "#0A0A0B",
            opacity: text().trim() ? 1 : 0.35,
            cursor: "pointer",
          }}
        >
          <Symbol size={20}>send</Symbol>
        </button>
      </div>
    </div>
  );
}
