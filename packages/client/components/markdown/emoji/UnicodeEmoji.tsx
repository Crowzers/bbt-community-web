import { ComponentProps, splitProps } from "solid-js";

import emojiRegex from "emoji-regex";

import { useState } from "@revolt/state";
import { EmojiBase } from ".";

// openmoji is off due to incomplete implementation

export type UnicodeEmojiPacks =
  | "fluent-3d"
  | "fluent-color"
  | "fluent-flat"
  | "mutant"
  | "noto"
  //  | "openmoji"
  | "twemoji";

export const UNICODE_EMOJI_PACKS: UnicodeEmojiPacks[] = [
  "fluent-3d",
  "fluent-color",
  "fluent-flat",
  "mutant",
  "noto",
  //  "openmoji",
  "twemoji",
];

export const UNICODE_EMOJI_PACK_PUA: Record<string, string> = {
  // omit fluent-3d as it is the default (canonically \uE0E1)
  "fluent-flat": "\uE0E2",
  mutant: "\uE0E3",
  noto: "\uE0E4",
  //  openmoji: "\uE0E5",
  twemoji: "\uE0E6",
};

const UNICODE_EMOJI_REGIONAL_INDICATORS =
  "\u{1f1e6}|\u{1f1e7}|\u{1f1e8}|\u{1f1e9}|\u{1f1ea}|\u{1f1eb}|\u{1f1ec}|\u{1f1ed}|\u{1f1ee}|\u{1f1ef}|\u{1f1f0}|\u{1f1f1}|\u{1f1f2}|\u{1f1f3}|\u{1f1f4}|\u{1f1f5}|\u{1f1f6}|\u{1f1f7}|\u{1f1f8}|\u{1f1f9}|\u{1f1fa}|\u{1f1fb}|\u{1f1fc}|\u{1f1fd}|\u{1f1fe}|\u{1f1ff}";

export const UNICODE_EMOJI_MIN_PACK = "\uE0E0".codePointAt(0)!;
export const UNICODE_EMOJI_MAX_PACK = "\uE0E6".codePointAt(0)!;
export const UNICODE_ZWNJ = "\u200C";

/**
 * Regex for matching emoji
 */
export const RE_UNICODE_EMOJI = new RegExp(
  `([\uE0E0-\uE0E6]?(?:${emojiRegex().source}|(?:${UNICODE_ZWNJ}?(?:${UNICODE_EMOJI_REGIONAL_INDICATORS}))))`,
  "g",
);

export const UNICODE_EMOJI_PUA_PACK: Record<string, UnicodeEmojiPacks> = {
  ["\uE0E0"]: "fluent-3d", // default entry
  ["\uE0E1"]: "fluent-3d",
  ["\uE0E2"]: "fluent-flat",
  ["\uE0E3"]: "mutant",
  ["\uE0E4"]: "noto",
  //  ["\uE0E5"]: "openmoji",
  ["\uE0E6"]: "twemoji",
};

export const startsWithPackPUA = (emoji: string) => {
  if (emoji.startsWith(":")) return false;
  if (emoji.slice(0, 1).match("[\uE0E0-\uE0E6]")) return true;

  return false;
};

const RE_UNICODE_EMOJI_REGIONAL_INDICATOR = new RegExp(
  `^(?:${UNICODE_EMOJI_REGIONAL_INDICATORS})$`,
);

export const isRegionalIndicator = (emoji: string): boolean => {
  return !!emoji.match(RE_UNICODE_EMOJI_REGIONAL_INDICATOR);
};

/**
 * BBT: emoji-urile TELEFONULUI (fontul de emoji al sistemului), nu pachetele lor de imagini.
 *
 * Cererea userului (5 oct 2026): „emoji-urile clasice de la telefon; acum se încarcă prea greu și
 * când apeși pe ele nici nu vezi dacă le-ai scris". Fiecare emoji era un SVG de pe CDN-ul Stoat
 * (`static.stoat.chat/emoji/<pachet>/<cod>.svg`), cerut separat — și în EDITOR, unde emoji-ul
 * scris devine un widget-imagine: până venea fișierul, nu se vedea nimic.
 *
 * Acum adresa e un SVG generat pe loc, cu emoji-ul ca TEXT: browserul îl desenează cu fontul
 * sistemului (Apple Color Emoji pe iPhone, Noto pe Android, Segoe pe Windows) și fără rețea.
 * Un singur punct de schimbare: toate locurile care afișează emoji (mesaje, editor, selector,
 * reacții, sugestii) iau adresa de aici. `pack` rămâne în semnătură doar pentru apelanți.
 */
export function unicodeEmojiUrl(
  _pack: UnicodeEmojiPacks = "fluent-3d",
  text: string,
) {
  // Fără caracterele de pachet (PUA) și ZWNJ: nu sunt emoji, iar fontul le-ar desena ca pătrățele.
  const emoji = text.replace(/[-‌]/g, "");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<text x="50" y="50" font-size="84" text-anchor="middle" dominant-baseline="central">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Display Unicode emoji
 */
export function UnicodeEmoji(
  props: { emoji: string; pack?: UnicodeEmojiPacks } & Omit<
    ComponentProps<typeof EmojiBase>,
    "loading" | "class" | "alt" | "draggable" | "src"
  >,
) {
  const [local, remote] = splitProps(props, ["emoji"]);
  const state = useState();

  return (
    <EmojiBase
      {...remote}
      loading="lazy"
      class="emoji"
      alt={local.emoji}
      draggable={false}
      src={unicodeEmojiUrl(
        props.pack ?? state.settings.getValue("appearance:unicode_emoji"),
        props.emoji,
      )}
    />
  );
}
