import { JSX, Show, createSignal } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";
import { LOC_PASTILA } from "../PastilaDeJos";
import { CERC_40, IconCamera, IconRotita, TITLU_PAGINA, deFonte, UN_RAND } from "../telefon";

import { useCont, useExperiente } from "./date";
import { useEtichete } from "./Setari";
import { Buton, C, Fereastra } from "./ui";

/**
 * BBT: tab-ul Profil pe telefon (macheta 20e), copia ecranului `mobil/src/app/(tabs)/profil.tsx`, cu măsurile de acolo.
 * Ia locul listei de la `/cont`; desktopul își păstrează meniul din 23 (`ContulMeu.tsx`).
 *
 * Ce e altfel decât în aplicație, dinadins:
 * - Rândurile duc la paginile din hub, nu la site: aici contul există întreg, plus sesiunea e deja deschisă.
 * - „Notificări" în plus: în aplicație așteaptă push-ul; pe hub pagina există și altfel n-ar mai avea drum pe telefon.
 * - Poza se schimbă din „Profil public": hub-ul n-are alegerea cu camera din aplicație.
 */
export function ProfilTelefon() {
  const navigate = useNavigate();
  const cont = useCont();
  const experiente = useExperiente();
  const etichete = useEtichete();
  const { logout } = useClientLifecycle();
  const [iesire, setIesire] = createSignal(false);

  const toate = () => [
    ...(experiente.data?.active ?? []),
    ...(experiente.data?.trecute ?? []),
  ];
  const numara = (fel: string) => toate().filter((e) => e.fel === fel).length;
  const diplome = () => toate().filter((e) => e.areDiploma).length;

  const nume = () => cont.data?.numeAfisat ?? cont.data?.numeComplet ?? "";

  // Slug-urile din bază („sound_engineer", „hip_hop") trec prin numele din admin, ca în aplicație.
  const descriere = () => {
    const p = cont.data;
    if (!p) return "";
    const rol = p.mainRole
      ? (etichete.data?.roluri[p.mainRole] ?? p.mainRole)
      : undefined;
    const genuri = [p.mainGenre, ...(p.musicGenres ?? [])]
      .filter((g, i, a): g is string => !!g && a.indexOf(g) === i)
      .slice(0, 2)
      .map((g) => etichete.data?.genuri[g] ?? g)
      .join(", ");
    return [rol, genuri, p.oras].filter(Boolean).join(" · ");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        "overflow-y": "auto",
        background: C.fundal,
        color: C.text,
      }}
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "10px",
          padding:
            "calc(env(safe-area-inset-top) + 8px) 12px " + LOC_PASTILA,
        }}
      >
        <div
          style={{
            display: "flex",
            "align-items": "center",
            padding: "0 8px",
            "margin-bottom": "4px",
          }}
        >
          <h1 style={{ ...TITLU_PAGINA, flex: 1 }}>Profil</h1>
          <button
            type="button"
            aria-label="Setări"
            onClick={() => navigate("/cont/profil")}
            style={CERC_40}
          >
            <IconRotita />
          </button>
        </div>

        {/* Cardul de sus: raza 32, 16 de jur împrejur, totul centrat. Tot el duce la profilul public. */}
        <a
          href={
            cont.data?.username
              ? `${BBT_SITE_URL}/u/${cont.data.username}`
              : "/cont/profil"
          }
          target={cont.data?.username ? "_blank" : undefined}
          rel="noopener"
          style={{
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            padding: "16px",
            "border-radius": "32px",
            background: C.foaie,
            color: C.text,
            "text-decoration": "none",
          }}
        >
          <button
            type="button"
            aria-label="Schimbă poza de profil"
            onClick={(ev) => {
              ev.preventDefault();
              navigate("/cont/profil");
            }}
            style={{
              position: "relative",
              padding: "3px",
              border: `3px solid ${C.roz}`,
              "border-radius": "42px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: "72px",
                height: "72px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                overflow: "hidden",
                "border-radius": "36px",
                background: C.negru,
                color: C.peNegru,
                "font-size": "24px",
                "font-weight": 800,
              }}
            >
              <Show when={cont.data?.avatarUrl} fallback={initiale(nume())}>
                {(url) => (
                  <img
                    src={url()}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      "object-fit": "cover",
                    }}
                  />
                )}
              </Show>
            </span>
            {/* Camera din colțul avatarului: chenarul în culoarea cardului o desparte de inel. */}
            <span
              style={{
                position: "absolute",
                right: "-4px",
                bottom: "-4px",
                width: "28px",
                height: "28px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "box-sizing": "border-box",
                "border-radius": "14px",
                border: `2px solid ${C.foaie}`,
                background: C.negru,
                color: C.peNegru,
              }}
            >
              <IconCamera size={14} />
            </span>
          </button>
          <div
            style={{
              ...deFonte(26),
              ...UN_RAND,
              "max-width": "100%",
              "margin-top": "10px",
              "text-align": "center",
            }}
          >
            {nume()}
          </div>
          <Show when={descriere()}>
            <div
              style={{
                ...UN_RAND,
                "max-width": "100%",
                "margin-top": "2px",
                color: C.stins,
                "font-size": "13px",
                "text-align": "center",
              }}
            >
              {descriere()}
            </div>
          </Show>
          {/* Aceeași regulă ca în contul de pe site: telefonul confirmat face „Artist verificat". */}
          <Show when={cont.data?.phoneVerified}>
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "4px",
                "margin-top": "8px",
                padding: "6px 12px",
                "border-radius": "999px",
                background: C.verdeDeschis,
                "font-size": "12px",
                "font-weight": 800,
              }}
            >
              <Symbol size={12}>check</Symbol>
              Artist verificat
            </div>
          </Show>
        </a>

        <div style={{ display: "flex", gap: "8px" }}>
          <Cifra
            valoare={experiente.data ? numara("camp") : "-"}
            eticheta={numara("camp") === 1 ? "tabără" : "tabere"}
          />
          <Cifra
            valoare={experiente.data ? numara("workshop") : "-"}
            eticheta={numara("workshop") === 1 ? "workshop" : "workshopuri"}
          />
          <Cifra
            valoare={experiente.data ? numara("curs") : "-"}
            eticheta={numara("curs") === 1 ? "curs" : "cursuri"}
          />
        </div>

        {/* Piesele omului, chiar sub cifre, ca în aplicație. */}
        <div style={GRUP}>
          <Rand
            text="Piesele mele"
            detaliu="Ascultă-le oricând"
            laApasare={() => navigate("/cont/piese")}
            ultim
          />
        </div>

        <div style={GRUP}>
          <Rand
            text="Editează profilul"
            detaliu="Date, adresă, facturare"
            laApasare={() => navigate("/cont/profil")}
          />
          <Rand text="Plăți" laApasare={() => navigate("/cont/plati")} />
          <Rand
            text="Diplome și certificate"
            detaliu={diplome() ? String(diplome()) : undefined}
            laApasare={() => navigate("/cont/diplome")}
          />
          <Rand
            text="Notificări"
            laApasare={() => navigate("/cont/notificari")}
            ultim
          />
        </div>

        <div style={GRUP}>
          <Rand
            text="Ajutor și contact BBT"
            laApasare={() =>
              (window.location.href = "mailto:contact@beanbagtheory.ro")
            }
          />
          <Rand
            text="Termeni și confidențialitate"
            laApasare={() => window.open(`${BBT_SITE_URL}/termeni`, "_blank")}
            ultim
          />
        </div>

        <button
          type="button"
          onClick={() => setIesire(true)}
          style={{
            "align-self": "center",
            padding: "14px",
            border: 0,
            background: "transparent",
            color: C.rosu,
            "font-family": "inherit",
            "font-size": "15px",
            "font-weight": 800,
            cursor: "pointer",
          }}
        >
          Ieși din cont
        </button>
      </div>

      <Show when={iesire()}>
        <Fereastra
          titlu="Ieși din cont?"
          laInchidere={() => setIesire(false)}
          latime={400}
        >
          <p
            style={{
              margin: "0 0 18px",
              color: C.stins,
              "font-size": "16px",
              "line-height": "1.45",
            }}
          >
            Te poți întoarce oricând cu emailul și parola de pe site.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <Buton piele="alb" lat onClick={() => setIesire(false)}>
              Rămân
            </Buton>
            <Buton lat onClick={() => logout()}>
              Ieși
            </Buton>
          </div>
        </Fereastra>
      </Show>
    </div>
  );
}

/** „Vlad Dobrescu" → „VD", „Tyzzu" → „TY". */
function initiale(nume: string) {
  const cuvinte = nume.trim().split(/\s+/).filter(Boolean);
  if (cuvinte.length === 0) return "?";
  if (cuvinte.length === 1) return cuvinte[0].slice(0, 2).toUpperCase();
  return (cuvinte[0][0] + cuvinte[1][0]).toUpperCase();
}

const GRUP: JSX.CSSProperties = {
  overflow: "hidden",
  "border-radius": "28px",
  background: C.foaie,
};

function Cifra(props: { valoare: number | string; eticheta: string }) {
  return (
    <div
      style={{
        flex: 1,
        "min-width": 0,
        padding: "12px",
        "box-sizing": "border-box",
        "border-radius": "22px",
        background: C.foaie,
        "text-align": "center",
      }}
    >
      <div style={deFonte(22)}>{props.valoare}</div>
      <div
        style={{
          "margin-top": "1px",
          color: C.stins,
          "font-size": "12px",
          "font-weight": 700,
        }}
      >
        {props.eticheta}
      </div>
    </div>
  );
}

function Rand(props: {
  text: string;
  detaliu?: string;
  laApasare: () => void;
  ultim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        width: "100%",
        padding: "15px 16px",
        "box-sizing": "border-box",
        border: 0,
        "border-bottom": props.ultim ? 0 : `0.5px solid ${C.linie}`,
        background: "transparent",
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          flex: 1,
          "font-size": "15px",
          "font-weight": 600,
        }}
      >
        {props.text}
      </span>
      <Show when={props.detaliu}>
        <span
          style={{
            ...UN_RAND,
            "max-width": "50%",
            color: C.slab,
            "font-size": "13px",
          }}
        >
          {props.detaliu}
        </span>
      </Show>
      <span style={{ display: "flex", color: C.slab }}>
        <Symbol size={16}>chevron_right</Symbol>
      </span>
    </button>
  );
}
