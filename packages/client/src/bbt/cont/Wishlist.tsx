import { For, Show, createSignal } from "solid-js";

import { useQueryClient } from "@tanstack/solid-query";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";
import { cerereCont } from "../tokenBbt";

import { CHEIE_CONT, lei, useCont, useSesiune, ziLunga } from "./date";
import { Incarcare } from "./MyCamps";
import type { WishlistItem } from "./tipuri";
import {
  ButonContur,
  C,
  Card,
  Mesaj,
  RandInfo,
  StareGoala,
  TitluPagina,
} from "./ui";

/**
 * BBT: Wishlist în hub. Copia lui `website/src/app/dashboard/wishlist/page.tsx`.
 *
 * Inima scoate tabăra din listă, aici, în aplicație (`DELETE /api/public/wishlist`, ca
 * `useWishlist` de pe site). „Vezi" deschide pagina taberei pe site, în browser: alegerea și
 * cumpărarea stau pe site (§5 din design, „nu mutăm cumpărarea în hub").
 */

/** Aceleași etichete ca `website/src/lib/statusPublic.ts`. */
const STATUS: Record<string, string> = {
  InCurand: "În curând",
  Deschis: "Locuri disponibile",
  UltimeleLocuri: "Ultimele locuri",
  SoldOut: "Sold Out",
  Inchis: "Închis",
  InDesfasurare: "Se întâmplă acum",
  Incheiat: "Ediție încheiată",
};

const culoareStatus = (s?: string) =>
  s === "SoldOut"
    ? { bg: "rgba(255,138,128,0.12)", text: C.rosu }
    : s === "UltimeleLocuri"
      ? { bg: "rgba(224,168,84,0.14)", text: C.chihlimbar }
      : s === "Deschis"
        ? { bg: "rgba(91,208,138,0.12)", text: C.verde }
        : { bg: "rgba(255,255,255,0.06)", text: C.stins };

export function Wishlist() {
  const cont = useCont();
  const lista = () => cont.data?.wishlistItems ?? [];

  return (
    <>
      <TitluPagina>Wishlist</TitluPagina>
      <Show when={cont.isError}>
        <Mesaj fel="eroare">
          Nu am putut încărca lista. Încearcă din nou peste un minut.
        </Mesaj>
      </Show>
      <Show when={!cont.isLoading} fallback={<Incarcare />}>
        <Show
          when={lista().length}
          fallback={
            <StareGoala
              simbol="favorite"
              titlu="Niciun element salvat"
              text="Salvează pe site taberele care te interesează, ca să le găsești ușor aici."
              link={{ href: `${BBT_SITE_URL}/camps`, text: "Vezi taberele" }}
            />
          }
        >
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "10px" }}
          >
            <For each={lista()}>{(w) => <RandWishlist item={w} />}</For>
          </div>
        </Show>
      </Show>
    </>
  );
}

function RandWishlist(props: { item: WishlistItem }) {
  const sesiune = useSesiune();
  const qc = useQueryClient();
  const [scot, setScot] = createSignal(false);
  const camp = () => props.item.camp;
  const st = () => culoareStatus(camp().statusPublic);

  async function scoate() {
    setScot(true);
    try {
      await cerereCont(sesiune(), "/api/public/wishlist", {
        method: "DELETE",
        body: JSON.stringify({ campId: camp().id }),
      });
      await qc.invalidateQueries({ queryKey: CHEIE_CONT });
    } finally {
      setScot(false);
    }
  }

  return (
    <Card
      style={{
        display: "flex",
        "align-items": "center",
        "flex-wrap": "wrap",
        gap: "12px 16px",
        padding: "14px 16px",
        opacity: scot() ? 0.5 : 1,
      }}
    >
      <div style={{ "min-width": "200px", "flex-grow": 1 }}>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "flex-wrap": "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              color: C.text,
              "font-weight": 700,
              "font-size": "14.5px",
            }}
          >
            {camp().nume}
          </p>
          <span
            style={{
              padding: "2px 8px",
              "border-radius": "999px",
              background: st().bg,
              color: st().text,
              "font-size": "11.5px",
              "font-weight": 700,
            }}
          >
            {STATUS[camp().statusPublic ?? ""] ?? "Închis"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            "flex-wrap": "wrap",
            gap: "2px 14px",
            "margin-top": "4px",
          }}
        >
          <RandInfo simbol="calendar_month">
            {ziLunga(camp().dataStart)}
          </RandInfo>
          <RandInfo simbol="location_on">{camp().locatie}</RandInfo>
        </div>
      </div>
      <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
        <span
          style={{ color: C.text, "font-weight": 700, "font-size": "14.5px" }}
        >
          {lei(camp().pretTransa1)}
        </span>
        <button
          type="button"
          onClick={scoate}
          disabled={scot()}
          aria-label="Elimină din wishlist"
          title="Elimină din wishlist"
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "border-radius": "999px",
            border: `1px solid ${C.linie}`,
            background: "transparent",
            color: C.rosu,
            cursor: scot() ? "default" : "pointer",
          }}
        >
          {/* Inimă PLINĂ desenată aici: `Symbol` desenează Lucide, care ignoră `fill`, iar o inimă
              goală ar fi spus „nu e în listă" exact pe rândul care e în listă. */}
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
        <ButonContur
          href={`${BBT_SITE_URL}/camps/${camp().slug ?? camp().id}`}
          target="_blank"
        >
          Vezi <Symbol size={14}>open_in_new</Symbol>
        </ButonContur>
      </div>
    </Card>
  );
}
