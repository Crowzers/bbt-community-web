import { Show } from "solid-js";

import { useQuery } from "@tanstack/solid-query";
import type { Channel } from "stoat.js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Banda „Fixat: …" de sub antetul canalului — ultimul mesaj fixat, ca la TRW (pânza aprobată,
 * 5 oct 2026). „Vezi" deschide lista mesajelor fixate în panoul din dreapta.
 *
 * Mesajul vine din aceeași căutare pe care o folosește panoul de fixate (`pinned: true`), deci nu
 * există o a doua sursă. Fără mesaje fixate, banda nu apare deloc.
 */
export function BandaFixat(props: { channel: Channel; onVezi: () => void }) {
  const fixat = useQuery(() => ({
    queryKey: ["bbt-fixat", props.channel.id],
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const mesaje = await props.channel.search({
        pinned: true,
        sort: "Latest",
        limit: 1,
      });
      return mesaje[0] ?? null;
    },
  }));

  // Primul rând de text, fără markdown greu — banda e un rezumat, mesajul întreg e la „Vezi".
  const rezumat = () =>
    (fixat.data?.content ?? "")
      .split("\n")
      .find((rand) => rand.trim())
      ?.replace(/[*_~`>#]/g, "")
      .trim() ?? "";

  return (
    <Show when={fixat.data && rezumat()}>
      <div
        style={{
          margin: "10px 16px 0",
          padding: "8px 12px",
          "border-radius": "8px",
          background: "rgba(255,168,205,0.08)",
          border: "1px solid rgba(255,168,205,0.22)",
          display: "flex",
          "align-items": "center",
          gap: "10px",
          "font-size": "12.5px",
          "flex-shrink": 0,
        }}
      >
        <span style={{ color: "#FFA8CD", display: "flex" }}>
          <Symbol size={15}>keep</Symbol>
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.8)",
            "flex-grow": 1,
            "min-width": 0,
            "white-space": "nowrap",
            overflow: "hidden",
            "text-overflow": "ellipsis",
          }}
        >
          <b style={{ color: "#fff", "font-weight": 600 }}>Fixat:</b>{" "}
          {rezumat()}
        </span>
        <button
          type="button"
          onClick={() => props.onVezi()}
          style={{
            background: "transparent",
            border: "0",
            padding: 0,
            color: "#4DA2FF",
            "font-size": "12px",
            "font-weight": 600,
            cursor: "pointer",
            "font-family": "inherit",
          }}
        >
          Vezi
        </button>
      </div>
    </Show>
  );
}
