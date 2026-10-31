import { For, Show, createUniqueId } from "solid-js";

import { BEANBAG } from "./avatarImplicit";

/**
 * BBT: plicul de vinyl al unei piese (varianta B, aleasă de user pe 1 nov 2026), ca `mobil/src/ui/PlicVinyl.tsx`. Static, dinadins:
 * într-o listă, mai multe animații ar fi haos. Culorile și așezarea vin din id, ca o piesă să-și păstreze plicul de la o deschidere
 * la alta. Coperta aleasă de om pentru piesă stă pe plic în locul desenului.
 *
 * ⚠️ Doar tokeni din `website/src/app/tokens.css`, și la umbre, ca la beanbag-uri (`mobil/src/ui/AvatarCanal.tsx`).
 */
const VOLUME = [
  ["#FEDCEC", "#FFA8CD", "#FF2E7E"],
  ["#FFEFAD", "#FFD731", "#715E10"],
  ["#99E9C4", "#55DB9C", "#216043"],
  ["#F8F0FF", "#E9CCFF", "#5C4ADE"],
  ["#DCEEFF", "#4DA2FF", "#2C639E"],
];

/** Așezările beanbag-ului: forma e tăiată de plic, deci tot ea face piesele să difere între ele. */
const ASEZARI = [
  "translate(46 62) rotate(14) scale(.25) translate(-235 -300)",
  "translate(54 66) rotate(-16) scale(.25) translate(-235 -300)",
  "translate(60 52) rotate(72) scale(.25) translate(-235 -300)",
  "translate(42 44) rotate(196) scale(.25) translate(-235 -300)",
];

const CANELURI = [0.9, 0.78, 0.66, 0.54];
const DISC = { x: 84, y: 50, r: 41 };

function amprenta(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function PlicVinyl(props: {
  id: string;
  /** Coperta proprie a piesei. Imaginea taberei nu e copertă: piesele aceleiași tabere ar arăta la fel. */
  coperta?: string | null;
  /** Înălțimea. Lățimea crește cu discul ieșit din plic. */
  marime: number;
}) {
  const uid = createUniqueId();
  const h = () => amprenta(props.id);
  const n = VOLUME.length;
  const plic = () => VOLUME[h() % n];
  // Altă familie decât a plicului: pe aceeași culoare, forma s-ar pierde.
  const sac = () => VOLUME[((h() % n) + 1 + ((h() >>> 4) % (n - 1))) % n];
  const asezare = () => ASEZARI[(h() >>> 8) % ASEZARI.length];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 126 100"
      width={(props.marime * 126) / 100}
      height={props.marime}
      style={{ "flex-shrink": 0, display: "block" }}
    >
      <defs>
        <radialGradient id={`plic${uid}`} cx="35%" cy="28%" r="95%">
          <stop offset="0" stop-color={plic()[0]} />
          <stop offset="0.58" stop-color={plic()[1]} />
          <stop offset="1" stop-color={plic()[2]} />
        </radialGradient>
        <radialGradient id={`sac${uid}`} cx="35%" cy="28%" r="95%">
          <stop offset="0" stop-color={sac()[0]} />
          <stop offset="0.58" stop-color={sac()[1]} />
          <stop offset="1" stop-color={sac()[2]} />
        </radialGradient>
        <clipPath id={`taie${uid}`}>
          <rect x="3" y="4" width="92" height="92" rx="7" />
        </clipPath>
      </defs>

      <circle cx={DISC.x} cy={DISC.y} r={DISC.r} fill="#0A0A0B" />
      <For each={CANELURI}>
        {(f) => (
          <circle
            cx={DISC.x}
            cy={DISC.y}
            r={DISC.r * f}
            fill="none"
            stroke="#232324"
            stroke-width="0.8"
          />
        )}
      </For>
      <path
        d="M78 14.700A35.700 35.700 0 0 1 113.500 31"
        fill="none"
        stroke="#8D8D9A"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <circle cx={DISC.x} cy={DISC.y} r="14" fill={plic()[1]} />
      <circle cx={DISC.x} cy={DISC.y} r="2.500" fill="#FFFFFF" />

      <rect x="3" y="4" width="92" height="92" rx="7" fill={`url(#plic${uid})`} />
      <g clip-path={`url(#taie${uid})`}>
        <Show
          when={props.coperta}
          fallback={
            <g transform={asezare()}>
              <path d={BEANBAG} fill={`url(#sac${uid})`} />
            </g>
          }
        >
          {(url) => (
            <image
              href={url()}
              x="3"
              y="4"
              width="92"
              height="92"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </Show>
      </g>
      <rect
        x="3"
        y="4"
        width="92"
        height="92"
        rx="7"
        fill="none"
        stroke={plic()[2]}
        stroke-opacity="0.35"
      />
    </svg>
  );
}
