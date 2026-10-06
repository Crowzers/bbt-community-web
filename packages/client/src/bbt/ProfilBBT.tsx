import { Show, createSignal, onMount } from "solid-js";

import { useState } from "@revolt/state";
import { Avatar, Button, Column, Row, Text, TextField } from "@revolt/ui";

import { BBT_ADMIN_URL, BBT_SITE_URL } from "./config";

/**
 * Setări → Profil, în BBT Community: editarea rapidă a profilului BBT (poză, nume de scenă,
 * username, bio) + „Vezi tot profilul" pe site. Înlocuiește editorul de profil Stoat.
 *
 * ⚠️ **Contul BBT e sursa, nu Stoat** (design BBT `2026-10-05-community-pe-stoat-design.md` §7).
 * Pagina scrie în BBT prin admin (`/api/public/stoat/profil`), iar adminul copiază imediat în
 * Stoat — numele, poza și textul profilului le văd toți, ca la orice cont. Editorul lor ar fi
 * scris direct în Stoat, iar următoarea intrare prin pod l-ar fi suprascris cu ce e în BBT: omul
 * și-ar fi văzut schimbarea dispărând fără explicație. De-aia e scos, nu doar ascuns în spate.
 *
 * Autentificarea la admin = sesiunea Stoat curentă (antetul `X-Session-Token`); adminul o
 * verifică la Stoat înainte să creadă ceva.
 */

type Profil = {
  numeComplet: string;
  numeAfisat: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  profilUrl: string;
  setariUrl: string;
  /**
   * Ce a făcut adminul când a potrivit profilul din Community cu cel BBT (la deschiderea paginii și
   * la salvare). `eroare` = motivul pentru care poza/numele NU au ajuns — singura fereastră spre
   * eroare pe producție (6 oct 2026).
   */
  comunitate?: { poza: string; eroare: string | null };
  /** Rolurile din Community (grupa ta din lista de membri) — vezi `MOTIV_ROLURI`. */
  roluri?: { stare: string; eroare?: string };
};

/**
 * De ce NU are omul rolurile lui în Community (grupa din lista de membri). Doar stările care cer
 * ceva de făcut; `la-zi` / `actualizate` / `fara-cont` nu se arată. Textele spun și ce trebuie
 * reparat în admin: pe producție, pagina asta e singura fereastră spre motiv (6 oct 2026).
 */
const MOTIV_ROLURI: Record<string, string> = {
  "fara-bot":
    "Rolurile din Community nu se pot pune încă: botul BBT nu e configurat în admin (STOAT_BOT_TOKEN).",
  "fara-server":
    "Rolurile din Community nu se pot pune încă: invitația serverului BBT lipsește din admin (STOAT_INVITATIE_SERVER).",
  "nu-e-in-server":
    "Nu ești încă în serverul BBT, deci nu ai încă rol în el. Ieși din Community și intră din nou de pe site.",
  eroare: "Rolurile din Community nu s-au putut actualiza",
};

/** Aceleași limite ca pe site (adminul le verifică oricum). */
const BIO_MAX = 300;
const POZA_LATURA = 300;

/**
 * Poza, tăiată pătrat din centru, 300×300 JPEG — ca la decupajul de pe site (`AvatarUpload.tsx`),
 * dar fără ecranul de decupat: aici e editare rapidă. Încape mereu sub limita de ~300 KB.
 */
async function pozaPatrata(fisier: File): Promise<string> {
  const url = URL.createObjectURL(fisier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, nu) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => nu(new Error("Imaginea nu poate fi citită."));
      i.src = url;
    });
    const latura = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = POZA_LATURA;
    canvas.height = POZA_LATURA;
    canvas
      .getContext("2d")!
      .drawImage(
        img,
        (img.naturalWidth - latura) / 2,
        (img.naturalHeight - latura) / 2,
        latura,
        latura,
        0,
        0,
        POZA_LATURA,
        POZA_LATURA,
      );
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfilBBT() {
  const state = useState();
  const [profil, setProfil] = createSignal<Profil | null>(null);
  const [numeAfisat, setNumeAfisat] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [bio, setBio] = createSignal("");
  const [poza, setPoza] = createSignal<string | null>(null);
  const [eroare, setEroare] = createSignal<string | null>(null);
  const [salvat, setSalvat] = createSignal(false);
  const [lucrez, setLucrez] = createSignal(false);
  let alegePoza: HTMLInputElement | undefined;

  async function cerere(metoda: "GET" | "PUT", corp?: unknown) {
    const token = state.auth.getSession()?.token;
    // `verifica=1`: adminul potrivește profilul din Community ACUM și spune dacă a mers.
    const r = await fetch(
      `${BBT_ADMIN_URL}/api/public/stoat/profil?verifica=1`,
      {
        method: metoda,
        headers: {
          "X-Session-Token": token ?? "",
          ...(corp ? { "Content-Type": "application/json" } : {}),
        },
        body: corp ? JSON.stringify(corp) : undefined,
      },
    );
    const date = await r.json().catch(() => null);
    if (!r.ok)
      throw new Error(date?.error ?? "Profilul nu răspunde. Încearcă din nou.");
    return date as Profil;
  }

  function aplica(p: Profil) {
    setProfil(p);
    setNumeAfisat(p.numeAfisat ?? "");
    setUsername(p.username ?? "");
    setBio(p.bio ?? "");
    setPoza(null);
  }

  onMount(() => {
    cerere("GET")
      .then(aplica)
      .catch((e: Error) => setEroare(e.message));
  });

  async function salveaza() {
    const p = profil();
    if (!p || lucrez()) return;
    setLucrez(true);
    setEroare(null);
    setSalvat(false);
    try {
      const corp: Record<string, string> = {};
      if (numeAfisat().trim() !== (p.numeAfisat ?? ""))
        corp.numeAfisat = numeAfisat();
      if (username().trim().toLowerCase() !== (p.username ?? ""))
        corp.username = username();
      if (bio().trim() !== (p.bio ?? "")) corp.bio = bio();
      if (poza()) corp.avatar = poza()!;
      aplica(await cerere("PUT", corp));
      setSalvat(true);
    } catch (e) {
      setEroare((e as Error).message);
    } finally {
      setLucrez(false);
    }
  }

  async function laPozaAleasa(e: Event & { currentTarget: HTMLInputElement }) {
    const fisier = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!fisier) return;
    try {
      setPoza(await pozaPatrata(fisier));
      setSalvat(false);
    } catch (err) {
      setEroare((err as Error).message);
    }
  }

  return (
    <Column gap="lg">
      <Show
        when={profil()}
        fallback={
          <Text class="body" size="large">
            {eroare() ?? "Se încarcă profilul…"}
          </Text>
        }
      >
        {(p) => (
          <>
            <Row align gap="lg">
              <Avatar
                src={poza() ?? p().avatarUrl ?? undefined}
                fallback={p().numeAfisat ?? p().numeComplet}
                size={80}
                fallbackBackground
                interactive
                onClick={() => alegePoza?.click()}
              />
              <Column gap="sm">
                <Text class="title" size="large">
                  {numeAfisat().trim() || p().numeComplet}
                </Text>
                <Show when={username().trim()}>
                  <Text class="label">@{username().trim().toLowerCase()}</Text>
                </Show>
                <div>
                  <Button
                    size="sm"
                    variant="tonal"
                    onPress={() => alegePoza?.click()}
                  >
                    Schimbă poza
                  </Button>
                </div>
              </Column>
              <input
                ref={alegePoza}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={laPozaAleasa}
              />
            </Row>

            <Column gap="md">
              <TextField
                label="Nume de scenă"
                helper={`Gol = numele tău real (${p().numeComplet})`}
                maxlength={40}
                value={numeAfisat()}
                onInput={(e) => setNumeAfisat(e.currentTarget.value)}
              />
              <TextField
                label="Username"
                helper="Litere mici, cifre, punct și underscore (3–30). E și adresa profilului tău."
                maxlength={30}
                autocapitalize="none"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
              />
              <TextField
                label="Bio"
                autosize
                min-rows={2}
                max-rows={6}
                maxlength={BIO_MAX}
                counter
                value={bio()}
                onInput={(e) => setBio(e.currentTarget.value)}
              />
            </Column>

            <Show when={eroare()}>
              <Text class="body">
                <span style={{ color: "var(--md-sys-color-error)" }}>
                  {eroare()}
                </span>
              </Text>
            </Show>
            <Show when={p().comunitate?.eroare}>
              <Text class="body">
                <span style={{ color: "var(--md-sys-color-error)" }}>
                  Profilul e salvat în contul BBT, dar n-a ajuns în Community:{" "}
                  {p().comunitate!.eroare}
                </span>
              </Text>
            </Show>
            <Show when={p().roluri && MOTIV_ROLURI[p().roluri!.stare]}>
              <Text class="body">
                <span style={{ color: "var(--md-sys-color-error)" }}>
                  {MOTIV_ROLURI[p().roluri!.stare]}
                  {p().roluri!.eroare ? ` (${p().roluri!.eroare})` : ""}
                </span>
              </Text>
            </Show>
            <Show when={salvat() && !p().comunitate?.eroare}>
              <Text class="body">
                Salvat. Toată lumea din Community vede deja schimbarea.
              </Text>
            </Show>

            <Row gap="md" wrap>
              <Button onPress={salveaza} isDisabled={lucrez()}>
                {lucrez() ? "Se salvează…" : "Salvează"}
              </Button>
              <Button
                variant="tonal"
                onPress={() => window.open(p().profilUrl, "_blank", "noopener")}
              >
                Vezi tot profilul
              </Button>
            </Row>
            <Text class="label">
              Rolurile, genurile și linkurile se schimbă din{" "}
              <a
                href={p().setariUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit" }}
              >
                profilul de pe {new URL(BBT_SITE_URL).host}
              </a>
              .
            </Text>
          </>
        )}
      </Show>
    </Column>
  );
}
