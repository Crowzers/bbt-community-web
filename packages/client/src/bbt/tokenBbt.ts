import { BBT_ADMIN_URL } from "./config";

/**
 * BBT: token-ul de participant cu care hub-ul citește contul BBT (My Camps, plăți, setări).
 * Design: `website/docs/plans/2026-10-20-hub-standalone-cont-design.md`, Faza 1.
 *
 * Hub-ul are doar sesiunea Stoat. Adminul o schimbă pe un access token de 15 minute
 * (`/api/public/stoat/token`), cu care se cheamă EXACT rutele site-ului (`participant/me`, …).
 *
 * ⚠️ Token-ul stă doar în memorie, nu în `localStorage`: se poate cere oricând altul din sesiune,
 * deci nu există niciun motiv să supraviețuiască paginii. Unul scris pe disc ar fi fost încă un
 * secret de furat.
 */

let curent: { token: string; expiraLa: number; sesiune: string } | null = null;
let inZbor: Promise<string> | null = null;

/** Cât din cele 15 minute lăsăm la margine, ca o cerere să nu plece cu un token pe moarte. */
const MARJA_MS = 60_000;
const VIATA_MS = 15 * 60_000;

export class EroareCont extends Error {
  constructor(
    public status: number,
    mesaj: string,
  ) {
    super(mesaj);
  }
}

async function cereToken(sesiune: string): Promise<string> {
  const r = await fetch(`${BBT_ADMIN_URL}/api/public/stoat/token`, {
    method: "POST",
    headers: { "X-Session-Token": sesiune },
  });
  if (!r.ok) throw new EroareCont(r.status, "Contul BBT nu răspunde.");
  const { accessToken } = (await r.json()) as { accessToken: string };
  curent = { token: accessToken, expiraLa: Date.now() + VIATA_MS, sesiune };
  return accessToken;
}

/**
 * Token valid pentru sesiunea dată. ⚠️ Cererile simultane (lista de tabere + plățile, la aceeași
 * deschidere) împart UN singur drum la admin, prin `inZbor`, nu câte unul fiecare.
 */
export function tokenBbt(sesiune: string): Promise<string> {
  if (
    curent &&
    curent.sesiune === sesiune &&
    curent.expiraLa - MARJA_MS > Date.now()
  ) {
    return Promise.resolve(curent.token);
  }
  if (!inZbor) {
    inZbor = cereToken(sesiune).finally(() => {
      inZbor = null;
    });
  }
  return inZbor;
}

/** Uită token-ul. La deconectare, ca următorul om de pe calculator să nu-l moștenească. */
export function uitaTokenBbt() {
  curent = null;
}

/**
 * `fetch` spre adminul BBT, ca participant. La 401 (token expirat mai devreme decât credeam: ceas
 * dat înapoi, admin repornit cu alt secret) cere un token nou și mai încearcă O dată.
 */
export async function cerereCont<T>(
  sesiune: string,
  cale: string,
  init: RequestInit = {},
): Promise<T> {
  const trimite = async (token: string) =>
    fetch(`${BBT_ADMIN_URL}${cale}`, {
      ...init,
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let r = await trimite(await tokenBbt(sesiune));
  if (r.status === 401) {
    uitaTokenBbt();
    r = await trimite(await tokenBbt(sesiune));
  }
  if (!r.ok) {
    const corp = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new EroareCont(r.status, corp?.error ?? "Cererea n-a mers.");
  }
  return (await r.json()) as T;
}
