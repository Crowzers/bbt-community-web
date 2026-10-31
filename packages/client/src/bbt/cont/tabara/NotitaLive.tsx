import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

import { useParams, useSearchParams } from "@solidjs/router";

import { useSesiune } from "../date";
import { C } from "../ui";

import { diferenta, mutaEditarea, mutaPozitia } from "./diferentaNotita";
import { InstrumentaleNotita } from "./InstrumentaleNotita";
import { LegaturaNotita, type StareNotita } from "./legaturaNotita";

/** Cât ține serverul din notiță (`MAX_LEN` din `admin/lib/notite-live.ts`): ce trece de atât nu s-ar mai salva. */
const LUNGIME_MAXIMA = 5000;
/** Cât stă textul altora în așteptare după ultima ta tastă. */
const LINISTE_MS = 300;

/** Culorile cu care te văd ceilalți pe site: stabile pe om, doar trepte închise (`NotiteLiveEditor.tsx`). */
const CULORI = [
  "#CA1A38",
  "#2C639E",
  "#216043",
  "#715E10",
  "#5C4ADE",
  "#9C2A01",
];
function culoarePentru(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++)
    h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return CULORI[Math.abs(h) % CULORI.length];
}

/**
 * BBT: notița comună a unei sesiuni, direct în hub, `/cont/notita/<sesiune>`. Până pe 31 oct linkul ducea pe site, unde
 * omul putea da de login. Același document Yjs ca site-ul și aplicația (`mobil/src/notita/useNotitaLive.ts`, de unde e
 * copiată și regula de mai jos).
 *
 * ⚠️ Textul venit din rețea nu se pune în câmp cât omul tastează: `randat` ține minte exact ce e în câmp, editarea se
 * calculează față de el și se mută peste documentul de acum (`mutaEditarea`). Altfel textul colegului ar fi părut șters.
 */
export function NotitaLive() {
  const params = useParams<{ id: string }>();
  const [cerere] = useSearchParams<{
    participant: string;
    nume: string;
    studio: string;
  }>();
  const sesiune = useSesiune();
  const [stare, setStare] = createSignal<StareNotita>("conectare");
  const [prezenti, setPrezenti] = createSignal<string[]>([]);
  const [semnal, setSemnal] = createSignal(0);
  let camp: HTMLTextAreaElement | undefined;
  let randat = "";
  let ultimaTasta = 0;
  let ceas: ReturnType<typeof setTimeout> | undefined;

  const legatura = new LegaturaNotita(
    sesiune,
    params.id,
    {
      nume: (cerere.nume ?? "").split(" ")[0] || "Anonim",
      culoare: culoarePentru(cerere.participant ?? ""),
    },
    {
      laText: randeaza,
      laStare: setStare,
      laPrezenti: setPrezenti,
      laInstrumentale: () => setSemnal((n) => n + 1),
    },
  );

  function randeaza() {
    clearTimeout(ceas);
    const trecut = Date.now() - ultimaTasta;
    if (trecut < LINISTE_MS) {
      ceas = setTimeout(randeaza, LINISTE_MS - trecut);
      return;
    }
    const curent = legatura.continut();
    if (!camp || curent === randat) return;
    const start = mutaPozitia(camp.selectionStart, randat, curent);
    const sfarsit = mutaPozitia(camp.selectionEnd, randat, curent);
    camp.value = curent;
    camp.setSelectionRange(start, sfarsit);
    randat = curent;
  }

  function laScris() {
    if (!camp) return;
    const nou = camp.value;
    legatura.scrie(
      mutaEditarea(diferenta(randat, nou), randat, legatura.continut()).filter(
        (o) => o.sterse || o.adaugate,
      ),
    );
    randat = nou;
    ultimaTasta = Date.now();
    clearTimeout(ceas);
    ceas = setTimeout(randeaza, LINISTE_MS);
  }

  onMount(() => legatura.porneste());
  onCleanup(() => {
    clearTimeout(ceas);
    legatura.opreste();
  });

  const mesaj = createMemo(() => {
    if (stare() === "interzis") return "Notița e doar pentru cei din sesiune.";
    if (stare() === "conectare") return "Se conectează…";
    if (stare() === "reconectare") return "Se reconectează…";
    const p = prezenti();
    if (p.length === 0) return "Doar tu ești aici";
    return p.length === 1
      ? `${p[0]} editează acum`
      : `${p.length} colegi editează acum`;
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
        height: "calc(100dvh - 140px)",
        "min-height": "320px",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          color: C.stins,
          "font-size": "14px",
          "font-weight": 600,
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            "border-radius": "50%",
            background: stare() === "live" ? "#1E9E62" : C.slab,
          }}
        />
        <span style={{ flex: 1 }}>{mesaj()}</span>
        <span style={{ "font-weight": 400 }}>Studio {cerere.studio}</span>
      </div>
      <InstrumentaleNotita
        sesiune={sesiune}
        sesiuneId={params.id}
        euId={cerere.participant ?? ""}
        semnal={semnal()}
      />
      <textarea
        ref={camp}
        onInput={laScris}
        disabled={stare() !== "live"}
        maxLength={LUNGIME_MAXIMA}
        placeholder="Scrieți aici notițele comune ale sesiunii. Toți colegii văd în timp real."
        style={{
          flex: 1,
          width: "100%",
          "box-sizing": "border-box",
          padding: "14px 16px",
          "border-radius": "20px",
          border: `1px solid ${C.linie}`,
          background: C.fundal,
          color: C.text,
          "font-family": "inherit",
          "font-size": "16px",
          "line-height": "24px",
          resize: "none",
          outline: "none",
        }}
      />
    </div>
  );
}
