import { Show, createMemo } from "solid-js";

import type { Channel } from "stoat.js";

import { adresaSvg, catalogCanale, desenCanal } from "./beanbagCanale";

/**
 * BBT: avatarul canalului, ca `mobil/src/ui/AvatarCanal.tsx`: iconul pus pe canal câștigă, fiindcă e ales de om; fără
 * icon, beanbag-ul desenat după nume și id, deci canalele vechi arată ca în aplicație până primesc unul. Pe desktop a
 * înlocuit cercurile din 21a (cererea userului, 31 oct: „canalele nu au avatarele").
 *
 * ⚠️ `iconURL` e gol pentru un canal fără icon, deci nu trebuie verificat `icon` separat.
 */
export function AvatarCanal(props: { canal: Channel; marime: number }) {
  const desen = createMemo(() => {
    const c = catalogCanale();
    if (props.canal.iconURL || !c) return undefined;
    return adresaSvg(
      desenCanal(c, {
        id: props.canal.id,
        nume: props.canal.name ?? "",
        vocal: !!props.canal.isVoice,
      }),
    );
  });

  return (
    <span
      style={{
        width: `${props.marime}px`,
        height: `${props.marime}px`,
        "flex-shrink": 0,
        display: "block",
      }}
    >
      <Show when={props.canal.iconURL ?? desen()}>
        {(adresa) => (
          <img
            src={adresa()}
            alt=""
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              "object-fit": "contain",
            }}
          />
        )}
      </Show>
    </span>
  );
}
