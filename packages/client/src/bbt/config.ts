/**
 * BBT Community — adresele platformei BBT, injectate la pornirea containerului.
 *
 * Același mecanism ca restul variabilelor Stoat: imaginea se construiește cu șiruri-semn
 * (`__VITE_BBT_ADMIN_URL__`), iar `docker/inject.js` le înlocuiește la pornire din mediu. Așa o
 * singură imagine merge și pe producție, și pe o instanță de test.
 *
 * ⚠️ Citirea e prin cheie dinamică (`import.meta.env[nume]`), ca la ei în `common/lib/env.ts`:
 * cu `import.meta.env.VITE_X` direct, Vite ar înlocui valoarea la build și șirul-semn n-ar mai
 * exista în bundle ca să fie injectat.
 */
const env = (nume: string) => {
  const valoare = import.meta.env[nume] as string | undefined;
  return valoare && !valoare.startsWith("__VITE_") ? valoare : undefined;
};

const faraSlash = (s: string) => s.replace(/\/+$/, "");

/** API-ul adminului BBT — schimbă codul de intrare pe sesiune (`/api/public/stoat/schimb`). */
export const BBT_ADMIN_URL = faraSlash(
  env("VITE_BBT_ADMIN_URL") ?? "https://admin.beanbagtheory.ro",
);

/** Site-ul BBT — de aici pornește orice intrare în Community (`/hub`). */
export const BBT_SITE_URL = faraSlash(
  env("VITE_BBT_SITE_URL") ?? "https://beanbagtheory.ro",
);

/** Pagina de pe site care verifică poarta și trimite înapoi aici, la `/sso`, cu un cod. */
export const BBT_INTRARE = `${BBT_SITE_URL}/hub`;
