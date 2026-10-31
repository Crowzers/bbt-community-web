import { onCleanup, onMount } from "solid-js";

/**
 * BBT: animațiile din aplicație, aceleași fișiere (`mobil/assets/lottie/`). Playerul și fișierul se încarcă abia aici: au
 * peste 100 KB, iar cine n-ajunge pe pagina respectivă n-are de ce să le plătească prețul. Cu „Reducere mișcare" rămân pe loc.
 */
export function AnimatieLottie(props: {
  fisier: () => Promise<{ default: unknown }>;
  marime: number;
}) {
  let loc!: HTMLDivElement;

  onMount(() => {
    let oprit = false;
    let animatie: { destroy: () => void } | undefined;
    onCleanup(() => {
      oprit = true;
      animatie?.destroy();
    });
    const redusa = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    void Promise.all([
      import("lottie-web/build/player/lottie_light"),
      props.fisier(),
    ]).then(([lottie, date]) => {
      if (oprit) return;
      animatie = lottie.default.loadAnimation({
        container: loc,
        renderer: "svg",
        loop: true,
        autoplay: !redusa,
        animationData: date.default,
      });
    });
  });

  return (
    <div
      ref={loc}
      style={{ width: `${props.marime}px`, height: `${props.marime}px` }}
    />
  );
}
