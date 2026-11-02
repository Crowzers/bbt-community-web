import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";

/**
 * BBT: cât trebuie să țină o cădere ca să i-o arătăm omului. La prima cădere hub-ul reîncearcă după
 * ~1 s, apoi ~3 s, deci o ruptură scurtă (tab trezit din fundal, schimbare de rețea) se repară
 * singură înainte de prag și nu are ce căuta pe ecran.
 */
export const INTARZIERE_BARA_MS = 5000;

/**
 * BBT: dacă se vede bara de conexiune. Sursa unică: bara, fundalul de sub ea și `theme-color` trebuie
 * să se schimbe împreună, altfel browserul își schimbă culoarea la o cădere pe care bara o ascunde.
 */
export function useBaraConexiune(): Accessor<boolean> {
  const { lifecycle } = useClientLifecycle();
  const [vizibila, setVizibila] = createSignal(false);

  const cazuta = createMemo(() =>
    [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state()),
  );

  createEffect(() => {
    if (!cazuta()) {
      setVizibila(false);
      return;
    }

    const temporizator = setTimeout(
      () => setVizibila(true),
      INTARZIERE_BARA_MS,
    );
    onCleanup(() => clearTimeout(temporizator));
  });

  return vizibila;
}
