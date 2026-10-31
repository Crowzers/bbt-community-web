import { Show, createSignal } from "solid-js";

import { ora } from "./cont/date";
import { QrMare } from "./cont/Experiente";
import type { Experienta } from "./cont/tipuri";
import { C } from "./cont/ui";
import { IconQR, UN_RAND, deFonte } from "./telefon";

/** Experiența de azi: cea cu bilet are prioritate, fiindcă pentru ea omul are nevoie de QR la intrare. */
export function experientaDeAzi(active: Experienta[] | undefined) {
  return active?.find((e) => e.azi && e.qr) ?? active?.find((e) => e.azi);
}

/** „2h până începe", „35 min până începe", „acum": cât mai e din ziua de azi până la eveniment. */
function panaIncepe(iso: string, acum = new Date()): string {
  const min = Math.round((new Date(iso).getTime() - acum.getTime()) / 60_000);
  if (min <= 0) return "acum";
  if (min < 60) return `${min} min până începe`;
  return `${Math.round(min / 60)}h până începe`;
}

/**
 * Cardul de azi (19a): mare, roz, primul lucru din Comunitate, cu QR-ul la un tap. Fără QR (tabăra), duce la Experiențe.
 * Același pe telefon (`ComunitateTelefon`) și pe desktop, deasupra canalelor (`ServerSidebar`): `margine` e distanța de
 * marginile listei, 16 pe telefon, 12 în coloana de 280 a desktopului.
 */
export function CardAzi(props: {
  e: Experienta;
  laTabara: () => void;
  margine: number;
}) {
  const [qrMare, setQrMare] = createSignal(false);
  return (
    <>
      <button
        type="button"
        class="bbt-moale"
        onClick={() => (props.e.qr ? setQrMare(true) : props.laTabara())}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "12px",
          width: `calc(100% - ${props.margine * 2}px)`,
          margin: `0 ${props.margine}px 12px`,
          padding: "12px 14px",
          "box-sizing": "border-box",
          "flex-shrink": 0,
          border: 0,
          "border-radius": "24px",
          background: C.roz,
          // Umbra colorată din 19: cardul plutește în rozul lui.
          "box-shadow": "0 8px 18px rgba(255,168,205,0.7)",
          color: C.text,
          "font-family": "inherit",
          "text-align": "left",
          cursor: "pointer",
        }}
      >
        <span style={{ flex: 1, "min-width": 0 }}>
          <span
            style={{
              display: "block",
              "font-size": "12px",
              "font-weight": 800,
              "letter-spacing": "0.72px",
            }}
          >
            AZI · {ora(props.e.dataStart)}
          </span>
          <span
            style={{
              ...deFonte(18),
              display: "-webkit-box",
              "-webkit-line-clamp": 2,
              "-webkit-box-orient": "vertical",
              overflow: "hidden",
              "margin-top": "1px",
            }}
          >
            {props.e.titlu}
          </span>
          <span
            style={{
              ...UN_RAND,
              display: "block",
              color: C.stins,
              "font-size": "12px",
              "margin-top": "1px",
            }}
          >
            {[props.e.locatie, panaIncepe(props.e.dataStart)]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <Show when={props.e.qr}>
          <span
            style={{
              width: "48px",
              height: "48px",
              "flex-shrink": 0,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "border-radius": "16px",
              background: C.negru,
            }}
          >
            <IconQR color={C.peNegru} />
          </span>
        </Show>
      </button>
      <Show when={qrMare() && props.e.qr}>
        <QrMare
          cod={props.e.qr!}
          titlu={props.e.titlu}
          laInchidere={() => setQrMare(false)}
        />
      </Show>
    </>
  );
}
