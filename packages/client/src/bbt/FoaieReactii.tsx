import {
  For,
  JSX,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { Emoji } from "@revolt/markdown";

import { C } from "./cont/ui";
import { AvatarOm } from "./telefon";

/**
 * BBT: cine a reacționat la un mesaj, ca `mobil/src/fir/FoaieReactii.tsx` și WhatsApp: sus file „Toate" și câte una pe emoji,
 * cu numărul; dedesubt oamenii, tu primul. Rândul tău scoate reacția.
 *
 * Pe telefon se deschide din tap pe reacție și urcă de jos. Pe desktop tapul adaugă sau scoate reacția, ca în machetele
 * 21/23, deci foaia se deschide din clic dreapta și stă în mijloc.
 */
export function FoaieReactii(props: {
  reactii: Map<string, Set<string>> | undefined;
  emojiDeschis: string;
  laScoate: (emoji: string) => void;
  laInchidere: () => void;
}) {
  const client = useClient();
  const { layout } = useDevice();
  const telefon = () => layout() === "phone";
  const euId = () => client().user?.id;
  const [fila, setFila] = createSignal<string | null>(props.emojiDeschis);

  const reactii = () =>
    [...(props.reactii?.entries() ?? [])].filter(([, oameni]) => oameni.size);
  const total = () => reactii().reduce((n, [, oameni]) => n + oameni.size, 0);
  const randuri = () =>
    reactii()
      .filter(([emoji]) => fila() === null || emoji === fila())
      .flatMap(([emoji, oameni]) => [...oameni].map((id) => ({ emoji, id })))
      // Tu primul, ca la WhatsApp: rândul de pe care îți scoți reacția stă mereu sus.
      .sort((a, b) => Number(b.id === euId()) - Number(a.id === euId()));

  // Ultima reacție scoasă: foaia nu mai are ce arăta.
  createEffect(() => {
    if (total() === 0) props.laInchidere();
  });

  // Scoasă ultima reacție de pe fila deschisă: rămân celelalte.
  createEffect(() => {
    const f = fila();
    if (f !== null && !reactii().some(([emoji]) => emoji === f)) setFila(null);
  });

  // Oamenii pe care clientul nu-i are încă în memorie (n-au scris în canalul ăsta de când e deschis hub-ul).
  createEffect(() => {
    for (const { id } of randuri()) {
      if (!client().users.has(id)) void client().users.fetch(id).catch(() => {});
    }
  });

  onMount(() => {
    const tasta = (e: KeyboardEvent) =>
      e.key === "Escape" && props.laInchidere();
    document.addEventListener("keydown", tasta);
    onCleanup(() => document.removeEventListener("keydown", tasta));
  });

  return (
    <Portal>
      {/* ⚠️ Evenimentele din Portal urcă în Solid prin arborele componentelor: fără oprire, tapul ar ajunge și la mesaj. */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          props.laInchidere();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          position: "fixed",
          inset: 0,
          "z-index": 1000,
          display: "flex",
          "align-items": telefon() ? "flex-end" : "center",
          "justify-content": "center",
          padding: telefon() ? 0 : "16px",
          background: "rgba(10,10,11,0.45)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reacții"
          class={telefon() ? "bbt-foaie" : undefined}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            "max-width": telefon() ? undefined : "420px",
            "max-height": "70dvh",
            display: "flex",
            "flex-direction": "column",
            padding: `12px 0 ${telefon() ? "calc(6px + env(safe-area-inset-bottom))" : "6px"}`,
            "box-sizing": "border-box",
            "border-radius": telefon() ? "28px 28px 0 0" : "28px",
            background: C.fundal,
            color: C.text,
            "font-family": "Inter, sans-serif",
          }}
        >
          <div
            role="tablist"
            style={{
              display: "flex",
              gap: "8px",
              "flex-shrink": 0,
              padding: "0 16px 10px",
              "overflow-x": "auto",
              "scrollbar-width": "none",
            }}
          >
            <Fila activa={fila() === null} laApasare={() => setFila(null)}>
              Toate {total()}
            </Fila>
            <For each={reactii()}>
              {([emoji, oameni]) => (
                <Fila activa={fila() === emoji} laApasare={() => setFila(emoji)}>
                  <Emoji emoji={emoji} /> {oameni.size}
                </Fila>
              )}
            </For>
          </div>
          <div style={{ "min-height": 0, "overflow-y": "auto" }}>
            <For each={randuri()}>
              {(r) => (
                <RandOm
                  id={r.id}
                  emoji={r.emoji}
                  eu={r.id === euId()}
                  laScoate={() => props.laScoate(r.emoji)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function Fila(props: {
  activa: boolean;
  laApasare: () => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.activa}
      onClick={props.laApasare}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "4px",
        "flex-shrink": 0,
        padding: "8px 14px",
        border: 0,
        "border-radius": "999px",
        background: props.activa ? C.negru : C.foaie,
        color: props.activa ? C.peNegru : C.text,
        "font-family": "inherit",
        "font-size": "15px",
        "font-weight": 600,
        "--emoji-size": "1.2em",
        cursor: "pointer",
        "white-space": "nowrap",
      }}
    >
      {props.children}
    </button>
  );
}

function RandOm(props: {
  id: string;
  emoji: string;
  eu: boolean;
  laScoate: () => void;
}) {
  const client = useClient();
  const om = () => client().users.get(props.id);
  const continut = () => (
    <>
      <AvatarOm om={om()} marime={40} />
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{
            display: "block",
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap",
            "font-size": "16px",
            "font-weight": 600,
          }}
        >
          {props.eu ? "Tu" : (om()?.displayName ?? "Cineva")}
        </span>
        <Show when={props.eu}>
          <span
            style={{
              display: "block",
              "margin-top": "1px",
              color: C.stins,
              "font-size": "14px",
            }}
          >
            Apasă ca s-o scoți
          </span>
        </Show>
      </span>
      <span style={{ "--emoji-size": "24px", "font-size": "24px" }}>
        <Emoji emoji={props.emoji} />
      </span>
    </>
  );
  const RAND = {
    display: "flex",
    "align-items": "center",
    gap: "12px",
    width: "100%",
    padding: "9px 16px",
    "box-sizing": "border-box",
    border: 0,
    background: "transparent",
    color: C.text,
    "font-family": "inherit",
    "text-align": "left",
  } as const;
  return (
    <Show when={props.eu} fallback={<div style={RAND}>{continut()}</div>}>
      <button
        type="button"
        aria-label={`Scoate reacția ${props.emoji}`}
        onClick={props.laScoate}
        style={{ ...RAND, cursor: "pointer" }}
      >
        {continut()}
      </button>
    </Show>
  );
}
