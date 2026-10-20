import { Show, createSignal } from "solid-js";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { cerereCont } from "../tokenBbt";

import { lei, useSesiune } from "./date";
import { ButonRoz, C } from "./ui";

/**
 * BBT: „Plătește tranșa 2" din hub. Copia lui `website/src/app/dashboard/PlatesteTransa2Button.tsx`.
 *
 * ⚠️ `penalizare` și `zileIntarziere` se arată ÎNAINTE de clic, din același răspuns `/me`: serverul
 * adaugă penalizarea la Stripe oricum, deci un buton care scrie doar prețul de bază i-ar fi cerut
 * omului mai mult decât a văzut (bug-ul reparat pe site pe 19 sept 2026).
 *
 * ⚠️ Stripe se deschide în BROWSER, nu în fereastra aplicației (decizia #7 din design): checkout-ul
 * se întoarce pe `beanbagtheory.ro/checkout-success`, iar în aplicație omul ar fi rămas pe site.
 * Fereastra se deschide SINCRON, în clic, și primește adresa după: un `window.open` chemat după un
 * `await` e blocat ca pop-up de Safari și de Chrome.
 */
export function PlatesteTransa2(props: {
  comandaId: string;
  produs: "camp" | "curs";
  pret: number;
  penalizare: number;
  zileIntarziere: number;
}) {
  const sesiune = useSesiune();
  const [lucrez, setLucrez] = createSignal(false);
  const [eroare, setEroare] = createSignal("");
  const total = () => props.pret + props.penalizare;

  async function plateste() {
    setEroare("");
    setLucrez(true);
    const fereastra = window.open("", "_blank");
    try {
      const cale =
        props.produs === "curs"
          ? "/api/public/checkout/curs/transa2"
          : "/api/public/checkout/transa2";
      const corp =
        props.produs === "curs"
          ? { inscriereCursId: props.comandaId }
          : { inscriereId: props.comandaId };
      const { url } = await cerereCont<{ url: string }>(sesiune(), cale, {
        method: "POST",
        body: JSON.stringify(corp),
      });
      if (fereastra) fereastra.location.href = url;
      else window.location.href = url;
    } catch (e) {
      fereastra?.close();
      setEroare(
        e instanceof Error && e.message !== "Cererea n-a mers."
          ? e.message
          : "Plata n-a putut porni. Încearcă din nou.",
      );
    } finally {
      setLucrez(false);
    }
  }

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
      <Show when={props.penalizare > 0}>
        <p
          style={{
            margin: 0,
            padding: "10px 12px",
            "border-radius": "12px",
            background: "rgba(255,138,128,0.1)",
            color: C.rosu,
            "font-size": "12.5px",
            "line-height": "1.45",
          }}
        >
          Plată întârziată, s-a adăugat o penalizare. Tranșa 2:{" "}
          {lei(props.pret)} + penalizare
          {props.zileIntarziere > 0
            ? ` (${props.zileIntarziere} ${props.zileIntarziere === 1 ? "zi" : "zile"} × 5%/zi)`
            : ""}
          : <b>{lei(props.penalizare)}</b>
        </p>
      </Show>
      <ButonRoz onClick={plateste} dezactivat={lucrez()}>
        <Symbol size={16}>credit_card</Symbol>
        {lucrez()
          ? "Se deschide plata…"
          : `Plătește tranșa 2 - ${lei(total())}`}
      </ButonRoz>
      <Show when={eroare()}>
        <p style={{ margin: 0, color: C.rosu, "font-size": "12.5px" }}>
          {eroare()}
        </p>
      </Show>
    </div>
  );
}
