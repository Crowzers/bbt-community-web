import { For, Show } from "solid-js";

import { useQuery } from "@tanstack/solid-query";

import { cerereCont } from "../tokenBbt";

import { useSesiune } from "./date";
import { C, Card, Incarcare, Mesaj, StareGoala, TitluPagina } from "./ui";

type PiesaMea = {
  id: string;
  title: string;
  url?: string;
  ascunsa?: boolean;
  camp?: { nume: string } | null;
  challenge?: { titlu: string } | null;
};

/**
 * BBT: „Piesele mele", ca în aplicație (`mobil/src/app/piese.tsx`): toate piesele omului, urcate de el sau cu el creditat,
 * inclusiv cele ascunse de pe profilul public. Aceeași rută ca selectorul de piese de pe site.
 */
export function Piese() {
  const sesiune = useSesiune();
  const piese = useQuery(() => ({
    queryKey: ["bbt-piesele-mele"],
    enabled: Boolean(sesiune()),
    retry: 1,
    queryFn: async () => {
      const r = await cerereCont<{ piese?: PiesaMea[] }>(
        sesiune(),
        "/api/public/participant/piesele-mele",
      );
      return (r.piese ?? []).filter((p) => p.url);
    },
  }));

  return (
    <>
      <TitluPagina>Piesele mele</TitluPagina>
      <Show when={piese.isError}>
        <Mesaj fel="eroare">Piesele nu se încarcă acum.</Mesaj>
      </Show>
      <Show when={!piese.isLoading} fallback={<Incarcare />}>
        <Show
          when={piese.data?.length || piese.isError}
          fallback={
            <StareGoala
              titlu="Încă nicio piesă"
              text="Piesele urcate la tabere sau în challenge-uri, de tine sau cu tine creditat, apar aici."
            />
          }
        >
          <div
            style={{ display: "flex", "flex-direction": "column", gap: "10px" }}
          >
            <For each={piese.data}>
              {(p) => (
                <Card style={{ padding: "14px 16px" }}>
                  <p
                    style={{
                      margin: 0,
                      "font-size": "16px",
                      "font-weight": 700,
                    }}
                  >
                    {p.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 8px",
                      color: C.stins,
                      "font-size": "14px",
                    }}
                  >
                    {[
                      p.camp?.nume ?? p.challenge?.titlu,
                      p.ascunsa ? "doar la tine" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {/* `preload="none"`: o listă lungă n-are voie să tragă toate fișierele la deschidere. */}
                  <audio
                    controls
                    preload="none"
                    src={p.url}
                    style={{
                      width: "100%",
                      height: "36px",
                      "color-scheme": "light",
                    }}
                  />
                </Card>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </>
  );
}
