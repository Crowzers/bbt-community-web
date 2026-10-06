import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";

import { useClient } from "@revolt/client";
import { useNavigate, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cereCautare } from "./cautare";

/**
 * Căutarea și clopoțelul din bara de sus (pânza TRW aprobată, 5 oct 2026).
 *
 * Căutarea: în canalul DESCHIS — singura căutare pe care o are Stoat (vezi `cautare.ts`). Enter
 * deschide rezultatele în panoul din dreapta al canalului. Fără canal deschis, câmpul nu apare.
 *
 * Clopoțelul: ce te așteaptă — canalele cu MENȚIUNI pentru tine și conversațiile directe cu mesaje
 * necitite. Stoat n-are un centru de notificări, dar are exact datele astea pe fiecare canal
 * (`mentions`, `unread`); lista doar le adună. Un clic te duce acolo.
 */
export function CautareSus() {
  const client = useClient();
  const params = useSmartParams();
  const [text, setText] = createSignal("");

  const canal = () => {
    const id = params().channelId;
    return id ? client().channels.get(id) : undefined;
  };
  const eticheta = () => {
    const c = canal();
    if (!c) return "";
    return c.type === "DirectMessage"
      ? `Caută mesaje cu ${c.recipient?.displayName ?? ""}`
      : `Caută mesaje în #${c.name ?? ""}`;
  };

  return (
    <Show when={canal()}>
      <label
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          width: "260px",
          height: "34px",
          padding: "0 10px",
          "box-sizing": "border-box",
          "border-radius": "8px",
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.48)",
          "font-size": "13px",
        }}
      >
        <Symbol size={16}>search</Symbol>
        <input
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") cereCautare(text());
          }}
          placeholder={eticheta()}
          aria-label={eticheta()}
          style={{
            "flex-grow": 1,
            "min-width": 0,
            background: "transparent",
            border: "0",
            outline: "none",
            color: "#fff",
            "font-family": "inherit",
            "font-size": "13px",
          }}
        />
      </label>
    </Show>
  );
}

export function Clopotel() {
  const client = useClient();
  const state = useState();
  const navigate = useNavigate();
  const [deschis, setDeschis] = createSignal(false);
  let radacina: HTMLDivElement | undefined;

  const afara = (e: MouseEvent) => {
    if (radacina && !radacina.contains(e.target as Node)) setDeschis(false);
  };
  document.addEventListener("mousedown", afara);
  onCleanup(() => document.removeEventListener("mousedown", afara));

  const alerte = createMemo(() => {
    const lista: {
      id: string;
      titlu: string;
      detaliu: string;
      avatar?: string;
      cale: string;
    }[] = [];
    for (const server of client().servers.toList()) {
      for (const canal of server.channels) {
        const n = canal.mentions?.size ?? 0;
        if (n > 0 && !state.notifications.isChannelMuted(canal)) {
          lista.push({
            id: canal.id,
            titlu: `#${canal.name}`,
            detaliu:
              n === 1 ? "o mențiune pentru tine" : `${n} mențiuni pentru tine`,
            cale: canal.path,
          });
        }
      }
    }
    for (const canal of state.ordering.orderedConversations(client())) {
      if (!canal.unread || state.notifications.isChannelMuted(canal)) continue;
      lista.push({
        id: canal.id,
        titlu:
          canal.type === "DirectMessage"
            ? (canal.recipient?.displayName ?? "Mesaj direct")
            : (canal.name ?? "Grup"),
        detaliu: "mesaj nou",
        avatar:
          canal.type === "DirectMessage"
            ? (canal.recipient?.animatedAvatarURL ?? "")
            : undefined,
        cale: canal.path,
      });
    }
    return lista;
  });

  return (
    <div ref={radacina} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Notificări"
        aria-expanded={deschis()}
        onClick={() => setDeschis((d) => !d)}
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          border: "0",
          "border-radius": "8px",
          background: deschis() ? "rgba(255,255,255,0.1)" : "transparent",
          color: "rgba(255,255,255,0.8)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          cursor: "pointer",
        }}
      >
        <Symbol size={20}>notifications</Symbol>
        <Show when={alerte().length > 0}>
          <span
            style={{
              position: "absolute",
              top: "3px",
              right: "2px",
              "min-width": "16px",
              height: "16px",
              padding: "0 4px",
              "box-sizing": "border-box",
              "border-radius": "8px",
              background: "#E5484D",
              color: "#fff",
              "font-size": "10px",
              "font-weight": 700,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
            }}
          >
            {alerte().length}
          </span>
        </Show>
      </button>

      <Show when={deschis()}>
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            "z-index": 50,
            width: "300px",
            "max-height": "420px",
            overflow: "auto",
            "border-radius": "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#141414",
            padding: "8px 0",
            "box-shadow": "0 16px 48px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              padding: "6px 16px 10px",
              "font-size": "11px",
              "font-weight": 600,
              "letter-spacing": "0.06em",
              "text-transform": "uppercase",
              color: "rgba(255,255,255,0.48)",
            }}
          >
            Notificări
          </div>
          <Show
            when={alerte().length > 0}
            fallback={
              <div
                style={{
                  padding: "8px 16px 14px",
                  "font-size": "13px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Nimic nou. Ești la zi.
              </div>
            }
          >
            <For each={alerte()}>
              {(a) => (
                <button
                  type="button"
                  onClick={() => {
                    setDeschis(false);
                    navigate(a.cale);
                  }}
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "10px",
                    width: "100%",
                    padding: "8px 16px",
                    border: "0",
                    background: "transparent",
                    color: "#fff",
                    cursor: "pointer",
                    "text-align": "left",
                    "font-family": "inherit",
                  }}
                >
                  <Show
                    when={a.avatar !== undefined}
                    fallback={
                      <span
                        style={{
                          width: "32px",
                          height: "32px",
                          "border-radius": "8px",
                          background: "rgba(255,255,255,0.08)",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "flex-shrink": 0,
                        }}
                      >
                        <Symbol size={16}>grid_3x3</Symbol>
                      </span>
                    }
                  >
                    <Avatar
                      src={a.avatar}
                      fallback={a.titlu}
                      fallbackBackground
                      size={32}
                    />
                  </Show>
                  <span style={{ "min-width": 0, "line-height": "1.3" }}>
                    <span
                      style={{
                        display: "block",
                        "font-size": "13px",
                        "font-weight": 600,
                      }}
                    >
                      {a.titlu}
                    </span>
                    <span
                      style={{
                        display: "block",
                        "font-size": "12px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {a.detaliu}
                    </span>
                  </span>
                </button>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
}
