import { JSX, splitProps } from "solid-js";

import { typography } from "../../design/Text";
import { ColouredText } from "../../utils/ColouredText";

type Props = {
  /**
   * Username
   */
  username?: string;

  /**
   * Text colour
   */
  colour?: string;

  /** BBT: mărimea și grosimea din 21a (15 / 800) se dau din mesaj. */
  style?: JSX.CSSProperties;
};

/**
 * Username
 *
 * @deprecated this seems unideal
 */
export function Username(props: Props) {
  const [local, remote] = splitProps(props, ["username", "colour"]);

  return (
    <span {...remote} class={typography({ class: "label", size: "large" })}>
      <ColouredText colour={local.colour!}>{local.username}</ColouredText>
    </span>
  );
}
