import { createMemo, JSX, splitProps } from "solid-js";

import { css } from "styled-system/css";
import { splitCssProps, styled } from "styled-system/jsx";
import { HTMLStyledProps } from "styled-system/types";

import { lucidePentru } from "../../../../src/bbt/IconitaLucide";

interface Props {
  /**
   * Whether to use the filled version of this symbol.
   * Filled symbols should only be used when there is an active state (ex: pages in a nav bar or toggled icon buttons).
   */
  fill?: boolean;
  /**
   * Font size for the symbol. This can be a number (in pixels) or any valid CSS size string (ex: "24px", "1.5em", "2rem").
   * @deprecated passing to css() does nothing
   */
  fontSize?: string | number;
  /**
   * The grade of the symbol, which adjusts the weight slightly. This can be a number between -25 and 700. To preview use the Google Fonts web app.
   */
  grade?: number;
  /**
   * The optical size of the symbol, which adjusts the design for different sizes. This should be "auto" unless it causes issues.
   */
  opticalSize?: number | "auto";
  /**
   * The type of symbol to use. This can be "outlined", "rounded", or "sharp". Defaults to "outlined".
   */
  type?: "outlined" | "rounded" | "sharp";
  /**
   * The weight of the symbol, which adjusts the thickness of the lines. This can be a number between 100 and 700.
   */
  weight?: number;
  /**
   * The symbol to display. This should be the exact text name of the symbol as defined by Google. See https://fonts.google.com/icons for a list of available symbols.
   */
  children: string | JSX.Element;
  /**
   * Symbol size
   */
  size?: number;
}

export function Symbol(rawProps: Props & HTMLStyledProps<"span">) {
  const [local, props] = splitProps(rawProps, [
    "fill",
    "fontSize",
    "grade",
    "opticalSize",
    "weight",
    "type",
    "size",
  ]);

  const [cssProps, restProps] = splitCssProps(props);
  const memoClassName = createMemo(() => {
    return css(
      {
        fontSize: local.fontSize ?? "inherit",
        fontWeight: `${local.weight} !important`,
        fontOpticalSizing: local.opticalSize === "auto" ? "auto" : undefined,
        userSelect: "none",
      },
      cssProps,
    );
  });

  const memoFontVarSettings = createMemo(() => {
    return `"FILL" ${local.fill ? 1 : 0}, "wght" 400, "GRAD" ${local.grade ?? 0}${
      (local.opticalSize ?? "auto") === "auto"
        ? ""
        : `, "opsz" ${local.opticalSize}`
    }`;
  });

  // BBT: dacă iconița are corespondent Lucide (design system-ul BBT), se desenează SVG-ul Lucide la
  // mărimea glifei (1em) — vezi src/bbt/IconitaLucide.tsx. Altfel, glifa Material, ca la ei.
  const lucide = createMemo(() =>
    typeof rawProps.children === "string" ? lucidePentru(rawProps.children) : null,
  );
  const svgLucide = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${lucide()}</svg>`;

  if (lucide()) {
    const [, faraCopii] = splitProps(restProps, ["children"]);
    return (
      <styled.span
        // Aceeași clasă ca glifa: același font-size calculat ⇒ SVG-ul de 1em ocupă exact locul glifei.
        class={`material-symbols-${local.type ?? "outlined"} ${memoClassName()}`}
        style={{
          display: "block",
          "line-height": 0,
          "font-size": local.size ? `${local.size}px` : undefined,
        }}
        aria-hidden="true"
        {...faraCopii}
        innerHTML={svgLucide()}
      />
    );
  }

  return (
    <styled.span
      class={`material-symbols-${local.type ?? "outlined"} ${memoClassName()}`}
      style={{
        display: "block",
        "font-variation-settings": memoFontVarSettings(),
        "font-size": local.size ? `${local.size}px` : undefined,
      }}
      aria-hidden="true"
      {...restProps}
      // @codegen directives props=props include=floating
    />
  );
}
