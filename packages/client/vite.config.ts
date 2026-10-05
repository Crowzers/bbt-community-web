import { lingui as linguiSolidPlugin } from "@lingui/vite-plugin";
import devtools from "@solid-devtools/transform";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import babelMacrosPlugin from "vite-plugin-babel-macros";
import Inspect from "vite-plugin-inspect";
import { VitePWA } from "vite-plugin-pwa";
import solidPlugin from "vite-plugin-solid";
import solidSvg from "vite-plugin-solid-svg";

import codegenPlugin from "./codegen.plugin";
import { addFontPreload } from "./fontpreload.plugin";

/**
 * BBT: importurile de iconițe Material (`@material-design-icons/svg/<stil>/<nume>.svg?component-solid`)
 * devin iconițe Lucide, ca pe site — fără să atingem cele ~60 de fișiere care le importă. Harta e
 * `src/bbt/iconite-harta.json`; ce lipsește din ea rămâne Material. Vezi src/bbt/IconitaLucide.tsx.
 * ⚠️ `enforce: "pre"`: altfel vite-plugin-solid-svg prinde importul primul și desenează Material.
 */
function iconiteLucide() {
  const harta = JSON.parse(
    readFileSync(resolve(__dirname, "src/bbt/iconite-harta.json"), "utf8"),
  ) as Record<string, string>;
  // Fără backslash-uri, dinadins: `[.]` și `[?]` în loc de escape — mai ușor de citit și de copiat.
  // ⚠️ DOUĂ pachete Material: `@material-design-icons/svg/<stil>/` și `@material-symbols/svg-400/<stil>/`
  // (rotița din bara canalelor, meniurile de notificări). Varianta `-fill` primește aceeași iconiță Lucide.
  const MATERIAL = new RegExp(
    "^@material-(?:design-icons/svg|symbols/svg-[0-9]+)/[a-z]+/([a-z_0-9]+)(?:-fill)?[.]svg[?]component-solid$",
  );
  // Prefixul NUL e convenția Rollup pentru module virtuale: niciun alt plugin nu încearcă să le citească.
  const PREFIX = String.fromCharCode(0) + "bbt-iconita:";
  return {
    name: "bbt-iconite-lucide",
    enforce: "pre" as const,
    resolveId(id: string) {
      const potrivire = MATERIAL.exec(id);
      if (potrivire && harta[potrivire[1]]) return PREFIX + potrivire[1];
    },
    load(id: string) {
      if (!id.startsWith(PREFIX)) return;
      const nume = id.slice(PREFIX.length);
      const componenta = JSON.stringify(
        resolve(__dirname, "src/bbt/IconitaLucide.tsx"),
      );
      return [
        `import { componentaLucide } from ${componenta};`,
        `export default componentaLucide(${JSON.stringify(nume)});`,
      ].join(String.fromCharCode(10));
    },
  };
}

const base = process.env.BASE_PATH ?? "/";
const pwaScope = process.env.PWA_SCOPE || base;

export default defineConfig({
  base,
  plugins: [
    Inspect(),
    devtools(),
    codegenPlugin(),
    babelMacrosPlugin(),
    solidPlugin({
      babel: {
        plugins: ["@lingui/babel-plugin-lingui-macro"],
      },
    }),
    linguiSolidPlugin(),
    iconiteLucide(),
    solidSvg({
      defaultAsComponent: false,
    }),
    addFontPreload(),
    VitePWA({
      srcDir: "src",
      registerType: "autoUpdate",
      filename: "serviceWorker.ts",
      strategies: "injectManifest",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8000000,
        globPatterns: ["**/*.{js,css,html}", "**/material-symbols-*.woff2"],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "BBT Community",
        short_name: "BBT",
        description: "User-first open source chat platform.",
        categories: ["communication", "chat", "messaging"],
        start_url: base,
        scope: pwaScope,
        display_override: ["window-controls-overlay"],
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          {
            src: `${base}assets/web/android-chrome-192x192.png`,
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: `${base}assets/web/android-chrome-512x512.png`,
            type: "image/png",
            sizes: "512x512",
          },
          {
            src: `${base}assets/web/monochrome.svg`,
            type: "image/svg+xml",
            sizes: "48x48 72x72 96x96 128x128 256x256",
            purpose: "monochrome",
          },
          {
            src: `${base}assets/web/masking-512x512.png`,
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
        // TODO: take advantage of shortcuts
      },
    }),
  ],
  build: {
    // BBT: sintaxa se coboară până la Safari 16 (iOS 16) — cu "esnext", o sintaxă mai nouă decât
    // Safari-ul telefonului = SyntaxError = ecran gri. API-urile lipsă NU se rezolvă aici, ci prin
    // polyfill (src/bbt/polyfill-iteratori.ts).
    target: ["es2022", "safari16"],
    rollupOptions: {
      external: ["hast"],
      output: {
        manualChunks: {
          markdown: [
            "lowlight",
            "rehype-highlight",
            "rehype-katex",
            "remark-breaks",
            "remark-gfm",
            "remark-math",
            "remark-parse",
            "remark-rehype",
            "vfile",
          ],
        },
      },
    },
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ["hast"],
  },
  resolve: {
    alias: {
      "styled-system": resolve(__dirname, "styled-system"),
      ...readdirSync(resolve(__dirname, "components")).reduce(
        (p, f) => ({
          ...p,
          [`@revolt/${f}`]: resolve(__dirname, "components", f),
        }),
        {},
      ),
    },
  },
});
