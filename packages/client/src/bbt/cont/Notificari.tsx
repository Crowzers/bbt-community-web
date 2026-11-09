import { For, Show, createEffect } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { useNavigate } from "@revolt/routing";

import { AnimatieLottie } from "../AnimatieLottie";
import { BBT_SITE_URL } from "../config";
import { cerereCont } from "../tokenBbt";
import { deFonte } from "../telefon";

import { CHEIE_CONT, useNotificari, useSesiune } from "./date";
import type { Notificare } from "./tipuri";
import { Buton, C, Incarcare, Mesaj } from "./ui";

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
    const tabara = cale.match(/^\/my-camp\/([^/?#]+)/);
    if (tabara) return navigate(`/cont/tabara/${tabara[1]}`);
    if (cale.startsWith("/dashboard/plati")) return navigate("/cont/plati");
    if (cale.startsWith("/dashboard/diplome")) return navigate("/cont/diplome");
    if (cale.startsWith("/dashboard/mycamps") || cale.startsWith("/my-camp"))
      return navigate("/cont/mycamps");
    // ⚠️ Fără ramurile astea, un bilet sau un curs deschidea „Editează profilul".
    if (cale.startsWith("/dashboard/workshops"))
      return navigate("/cont/workshops");
    if (cale.startsWith("/dashboard/cursuri")) return navigate("/cont/cursuri");
    if (cale.startsWith("/dashboard/wishlist"))
      return navigate("/cont/wishlist");
    if (cale.startsWith("/dashboard/profil")) return navigate("/cont");
    if (cale.startsWith("/dashboard")) return navigate("/cont/profil");
    window.open(
      cale.startsWith("http") ? cale : `${BBT_SITE_URL}${cale}`,
      "_blank",
      "noopener",
    );
  }

  // Deschiderea paginii = „le-am văzut", ca la clopoțelul de pe site și din admin și ca în aplicație (9 nov 2026): cifra
  // de pe clopoțel și din meniu se stinge pe loc și revine doar la următoarea notificare. Se scrie doar `necitite` în
  // cache, nu `citita` pe rânduri: punctele din lista asta rămân până la următoarea încărcare, ca omul să vadă ce era nou.
  // O singură dată pe deschidere: altfel fiecare notificare venită cât stă pe pagină ar mai trimite o cerere.
  let vazute = false;
  createEffect(() => {
    const d = notificari.data;
    if (vazute || !d || !(d.necitite ?? 0)) return;
    vazute = true;
    client.setQueryData([...CHEIE_CONT, "notificari"], { ...d, necitite: 0 });
    void cerereCont(
      sesiune(),
      "/api/public/participant/notificari/citeste-tot",
      { method: "PUT", body: "{}" },
    ).catch(() => {});
  });

  function apasa(n: Notificare) {
    if (!n.citita) citeste(`/api/public/participant/notificari/${n.id}`);
    if (n.linkHref) deschide(n.linkHref);
  }

  return (
    <Show
      when={notificari.data}
      fallback={
        <Show when={notificari.isError} fallback={<Incarcare />}>
          <Mesaj fel="eroare">Notificările nu se încarcă acum.</Mesaj>
          <div style={{ "margin-top": "10px" }}>
            <Buton piele="alb" mic onClick={reincarca}>
              Încearcă din nou
            </Buton>
          </div>
        </Show>
      }
    >
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
                      // Negru: rozul pe rândul necitit are 1,6:1 și nu se vede.
                      background: C.text,
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
