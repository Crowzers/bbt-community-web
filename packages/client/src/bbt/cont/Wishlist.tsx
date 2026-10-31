import { For, Show, createSignal } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { BBT_SITE_URL } from "../config";
import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, lei, useCont, useSesiune, ziLunga } from "./date";
import { Afis, Stare } from "./Experiente";
import { Gol } from "./ExperienteTelefon";
import type { WishlistItem } from "./tipuri";
import { Buton, C, Incarcare, Mesaj, TitluPagina } from "./ui";

/** Aceleași nume ca `STATUS_PUBLIC_LABEL` din `website/src/lib/statusPublic.ts`. */
const STATUS: Record<string, { text: string; fel?: "verde" | "galben" | "rosu" }> = {
  InCurand: { text: "În curând" },
  Deschis: { text: "Locuri disponibile", fel: "verde" },
  UltimeleLocuri: { text: "Ultimele locuri", fel: "galben" },
  SoldOut: { text: "Sold Out", fel: "rosu" },
  Inchis: { text: "Închis" },
  InDesfasurare: { text: "Se întâmplă acum" },
  Incheiat: { text: "Ediție încheiată" },
};

/**
 * BBT: „Wishlist", ca în aplicație (`mobil/src/app/wishlist.tsx`, cererea userului, 1 nov 2026). Până atunci rândul din meniu ducea
 * pe site, unde omul din hub nu e logat. Adaugi de pe site, de pe pagina taberei; aici le vezi și le scoți. Înscrierea rămâne pe
 * site, pe pagina publică a taberei.
 */
export function Wishlist() {
  const cont = useCont();
  const salvate = () => cont.data?.wishlistItems ?? [];

  return (
    <>
      <TitluPagina>Wishlist</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">Lista nu se încarcă acum.</Mesaj>
      </Show>
      <Show when={!cont.isLoading} fallback={<Incarcare />}>
        <Show
          when={salvate().length || cont.isError}
          fallback={
            <Gol
              titlu="Nimic salvat încă"
              text="Salvează pe site taberele care te interesează și le găsești aici."
              link={{ cale: "/camps", text: "Explorează taberele" }}
            />
          }
        >
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "12px" }}
          >
            <For each={salvate()}>{(s) => <Rand salvat={s} />}</For>
          </div>
        </Show>
      </Show>
    </>
  );
}

function Rand(props: { salvat: WishlistItem }) {
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [lucrez, setLucrez] = createSignal(false);
  const [aPicat, setAPicat] = createSignal(false);
  const c = () => props.salvat.camp;
  const stare = () => STATUS[c().statusPublic ?? ""] ?? STATUS.Inchis;

  async function scoate() {
    setLucrez(true);
    setAPicat(false);
    try {
      await cerereCont(sesiune(), "/api/public/wishlist", {
        method: "DELETE",
        body: JSON.stringify({ campId: c().id }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
    } catch {
      setAPicat(true);
    } finally {
      setLucrez(false);
    }
  }

  return (
    <article
      style={{ padding: "10px", "border-radius": "20px", background: C.foaie }}
    >
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "12px",
        }}
      >
        <Afis url={c().afisUrl ?? c().imgUrl} fel="camp" />
        <div style={{ flex: "1 1 240px", "min-width": 0 }}>
          <Show when={stare().fel} fallback={<StareStinsa text={stare().text} />}>
            {(fel) => <Stare fel={fel()}>{stare().text}</Stare>}
          </Show>
          <h2
            style={{
              margin: "6px 0 0",
              "font-size": "20px",
              "font-weight": 700,
              "line-height": "1.15",
            }}
          >
            {c().nume}
          </h2>
          <p style={{ margin: "2px 0 0", color: C.stins, "font-size": "14px" }}>
            {ziLunga(c().dataStart)} · {c().locatie} · de la{" "}
            {lei(c().pretTransa1)}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
          <Buton piele="alb" mic onClick={scoate} dezactivat={lucrez()}>
            Scoate
          </Buton>
          <Buton
            mic
            href={`${BBT_SITE_URL}/camps/${c().slug ?? c().id}`}
            target="_blank"
          >
            Vezi tabăra ↗
          </Buton>
        </div>
      </div>
      <Show when={aPicat()}>
        <Mesaj fel="eroare">N-am putut-o scoate. Încearcă din nou.</Mesaj>
      </Show>
    </article>
  );
}

function StareStinsa(props: { text: string }) {
  return (
    <span
      style={{
        "white-space": "nowrap",
        padding: "4px 10px",
        "border-radius": "999px",
        background: C.fundal,
        color: C.stins,
        "font-size": "12px",
        "font-weight": 600,
      }}
    >
      {props.text}
    </span>
  );
}
