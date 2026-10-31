import { Show } from "solid-js";

import { useNavigate } from "@revolt/routing";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { AntetPagina, LOC_SUB_ANTET } from "../AntetPagina";
import { BBT_SITE_URL } from "../config";
import { LOC_PASTILA } from "../PastilaDeJos";
import {
  CERC_40,
  IconCamera,
  IconRotita,
  TITLU_PAGINA,
  UN_RAND,
  deFonte,
} from "../telefon";

import { useCont, useExperiente, useNotificari, useRapoarte } from "./date";
import { useEtichete } from "./Setari";
import { C } from "./ui";

/**
 * BBT: tab-ul Profil (macheta 20e), copia ecranului `mobil/src/app/(tabs)/profil.tsx`, cu măsurile de acolo, la `/cont`.
 * Pe desktop și tabletă (`desktop`) e aceeași pagină, pe coloană îngustă, cu titlul în locul antetului roz. Varianta B
 * (cererea userului, 31 oct 2026): aici stă cine ești, iar restul contului e în spatele rotiței (`/cont/setari`).
 *
 * Ce e altfel decât în aplicație, dinadins:
 * - Rândurile duc la paginile din hub, nu la site: aici contul există întreg, plus sesiunea e deja deschisă.
 * - Poza se schimbă din „Editează profilul": hub-ul n-are alegerea cu camera din aplicație.
 */
export function ProfilTelefon(props: { desktop?: boolean }) {
  const navigate = useNavigate();
  const cont = useCont();
  const experiente = useExperiente();
  const rapoarte = useRapoarte();
  const notificari = useNotificari();
  const etichete = useEtichete();

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

  // Cifrele au plecat în Setări odată cu rândurile lor; punctul spune că ai de ce să intri acolo.
  const deVazut = () =>
    (notificari.data?.necitite ?? 0) + (rapoarte.data?.length ?? 0) > 0;

  const Rotita = () => (
    <button
      type="button"
      class="bbt-moale"
      aria-label="Setări"
      onClick={() => navigate("/cont/setari")}
      style={{
        ...CERC_40,
        position: "relative",
        background: props.desktop ? C.foaie : C.fundal,
      }}
    >
      <IconRotita />
      <Show when={deVazut()}>
        <span
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "10px",
            height: "10px",
            "box-sizing": "border-box",
            "border-radius": "5px",
            border: `2px solid ${C.fundal}`,
            background: C.rosu,
          }}
        />
      </Show>
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        width: "100%",
        height: "100%",
        background: C.fundal,
        color: C.text,
      }}
    >
      <Show when={!props.desktop}>
        <AntetPagina>
          <h1 style={{ ...TITLU_PAGINA, flex: 1 }}>Profil</h1>
          <Rotita />
        </AntetPagina>
      </Show>
      <div style={{ "flex-grow": 1, "min-height": 0, "overflow-y": "auto" }}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "10px",
            padding: props.desktop
              ? "32px 16px 48px"
              : `${LOC_SUB_ANTET} 12px ${LOC_PASTILA}`,
            "max-width": props.desktop ? "640px" : undefined,
            margin: "0 auto",
            "box-sizing": "border-box",
          }}
        >
          <Show when={props.desktop}>
            <div style={{ display: "flex", "align-items": "center" }}>
              <h1 style={{ ...TITLU_PAGINA, flex: 1, margin: 0 }}>Profil</h1>
              <Rotita />
            </div>
          </Show>
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
            {/* Cardul ducea și până acum la profilul public, dar nimic nu spunea asta. */}
            <Show when={cont.data?.username}>
              <div
                style={{
                  "margin-top": "10px",
                  color: C.stins,
                  "font-size": "13px",
                  "font-weight": 600,
                }}
              >
                Vezi profilul public
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

          <CardDrum
            simbol="music_note"
            titlu="Piesele mele"
            text="Ascultă-le oricând"
            laApasare={() => navigate("/cont/piese")}
          />
          <CardDrum
            simbol="workspace_premium"
            titlu="Diplome și certificate"
            text={
              diplome() === 0
                ? "Apar aici după ce termini un curs"
                : diplome() === 1
                  ? "O diplomă"
                  : `${diplome()} diplome`
            }
            laApasare={() => navigate("/cont/diplome")}
          />
        </div>
      </div>
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

function CardDrum(props: {
  simbol: string;
  titlu: string;
  text: string;
  laApasare: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => props.laApasare()}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        width: "100%",
        padding: "14px",
        "box-sizing": "border-box",
        border: 0,
        "border-radius": "28px",
        background: C.foaie,
        color: C.text,
        "font-family": "inherit",
        "text-align": "left",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: "44px",
          height: "44px",
          "flex-shrink": 0,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "14px",
          background: C.roz,
        }}
      >
        <Symbol size={22}>{props.simbol}</Symbol>
      </span>
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{ display: "block", "font-size": "15px", "font-weight": 800 }}
        >
          {props.titlu}
        </span>
        <span
          style={{
            display: "block",
            "margin-top": "2px",
            color: C.stins,
            "font-size": "13px",
          }}
        >
          {props.text}
        </span>
      </span>
      <span style={{ display: "flex", color: C.slab }}>
        <Symbol size={18}>chevron_right</Symbol>
      </span>
    </button>
  );
}
