import { For, Show } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { useNavigate } from "@revolt/routing";

import { AnimatieLottie } from "../AnimatieLottie";
import { BBT_SITE_URL } from "../config";
import { cerereCont } from "../tokenBbt";
import { deFonte } from "../telefon";

import { CHEIE_CONT, useNotificari, useSesiune } from "./date";
import type { Notificare } from "./tipuri";
import { C } from "./ui";

/**
 * BBT: notificările contului (plăți, anulări, aprecieri), ca ecranul `mobil/src/app/notificari.tsx`. Când nu e nimic nou,
 * apare clopoțelul animat. Paginile din cont se deschid aici; restul legăturilor sunt pagini publice de pe site.
 */
export function ListaNotificari() {
  const notificari = useNotificari();
  const sesiune = useSesiune();
  const client = useQueryClient();
  const navigate = useNavigate();

  const lista = () => notificari.data?.notificari ?? [];
  const reincarca = () =>
    void client.invalidateQueries({ queryKey: [...CHEIE_CONT, "notificari"] });

  function citeste(cale: string) {
    void cerereCont(sesiune(), cale, { method: "PUT", body: "{}" })
      .then(reincarca)
      .catch(() => {});
  }

  function deschide(cale: string) {
    if (cale.startsWith("/dashboard/plati")) return navigate("/cont/plati");
    if (cale.startsWith("/dashboard/diplome")) return navigate("/cont/diplome");
    if (cale.startsWith("/dashboard/mycamps") || cale.startsWith("/my-camp"))
      return navigate("/cont/experiente");
    if (cale.startsWith("/dashboard")) return navigate("/cont/profil");
    window.open(
      cale.startsWith("http") ? cale : `${BBT_SITE_URL}${cale}`,
      "_blank",
      "noopener",
    );
  }

  function apasa(n: Notificare) {
    if (!n.citita) citeste(`/api/public/participant/notificari/${n.id}`);
    if (n.linkHref) deschide(n.linkHref);
  }

  return (
    <Show when={notificari.data}>
      <Show
        when={lista().length > 0}
        fallback={
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              padding: "24px 32px 40px",
            }}
          >
            <AnimatieLottie fisier={() => import("../clopotel.json")} marime={220} />
            <h2 style={{ ...deFonte(24), margin: "10px 0 0", color: C.text }}>
              Nimic nou momentan
            </h2>
          </div>
        }
      >
        <div
          style={{ display: "flex", "flex-direction": "column", gap: "8px" }}
        >
          <Show when={lista().some((n) => !n.citita)}>
            <button
              type="button"
              onClick={() =>
                citeste("/api/public/participant/notificari/citeste-tot")
              }
              style={{
                "align-self": "flex-end",
                padding: "6px 8px",
                border: 0,
                background: "transparent",
                color: C.text,
                "font-family": "inherit",
                "font-size": "14px",
                "font-weight": 700,
                cursor: "pointer",
              }}
            >
              Marchează tot ca citit
            </button>
          </Show>
          <For each={lista()}>
            {(n) => (
              <button
                type="button"
                onClick={() => apasa(n)}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "10px",
                  padding: "14px",
                  border: 0,
                  "border-radius": "20px",
                  background: n.citita ? C.foaie : "#FFEEF5",
                  color: C.text,
                  "font-family": "inherit",
                  "text-align": "left",
                  cursor: n.linkHref || !n.citita ? "pointer" : "default",
                }}
              >
                <span style={{ flex: 1, "min-width": 0 }}>
                  <span
                    style={{
                      display: "block",
                      "font-size": "15px",
                      "font-weight": 700,
                    }}
                  >
                    {n.titlu}
                  </span>
                  <Show when={n.mesaj}>
                    <span
                      style={{
                        display: "block",
                        color: C.stins,
                        "font-size": "14px",
                        "line-height": "20px",
                      }}
                    >
                      {n.mesaj}
                    </span>
                  </Show>
                  <span
                    style={{
                      display: "block",
                      "margin-top": "2px",
                      color: C.stins,
                      "font-size": "14px",
                    }}
                  >
                    {new Date(n.createdAt).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </span>
                <Show when={!n.citita}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      "flex-shrink": 0,
                      "border-radius": "50%",
                      background: C.roz,
                    }}
                  />
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </Show>
  );
}
