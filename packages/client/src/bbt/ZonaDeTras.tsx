/**
 * BBT: fâșia de sus de care se mută fereastra aplicației instalate, pe ecranele fără `BaraSus`
 * (login, „Se conectează…"). Cu bara de titlu a Windows-ului ascunsă (`window-controls-overlay`),
 * acolo n-ar mai rămâne nimic de apucat, iar fereastra n-ar mai putea fi mutată.
 *
 * Ocupă exact locul fostei bare de titlu, lângă butoanele native (`titlebar-area-*`). În browser și
 * în aplicația cu bara Windows vizibilă, valorile de rezervă îi dau lățimea 0: nu există.
 */
export function ZonaDeTras() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "env(titlebar-area-y, 0px)",
        left: "env(titlebar-area-x, 0px)",
        width: "env(titlebar-area-width, 0px)",
        height: "env(titlebar-area-height, 0px)",
        "z-index": 1000,
        "-webkit-app-region": "drag",
      }}
    />
  );
}
