import { Show } from "solid-js";

import { useClient } from "@revolt/client";
import { useLocation, useNavigate } from "@revolt/routing";

import { useCont } from "./cont/date";
import { tineMinteLista } from "./intoarcere";
import { AvatarOm, IconRotita, UN_RAND } from "./telefon";
import { S1 } from "./tema";

/**
 * BBT: contul, la baza listei de canale și de conversații (S1, 4 nov 2026, `website/docs/plans/2026-11-04-community-ca-slack-discord-
 * studiu.md` deciziile 10 și 11). Ca pe desktopul Discord: poza cu punctul de online, numele, Power Score și rolul; tot cardul
 * duce în Profil. Pe telefon e același card, în locul pastilei de jos (ales de user între variante puse alături).
 *
 * Rolul: întâi rolul din comunitate (Mentor, Echipa BBT, din rolurile Stoat puse de pod), apoi rolul muzical din contul BBT.
 */
export function CardCont() {
  const client = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const cont = useCont();

  const nume = () =>
    cont.data?.numeAfisat?.trim() ||
    cont.data?.prenume ||
    client().user?.displayName ||
    "";
  const rol = () => {
    const membru = client().servers.toList()[0]?.member;
    return (
      membru?.hoistedRole?.name ??
      membru?.orderedRoles[0]?.name ??
      cont.data?.mainRole ??
      ""
    );
  };
  const power = () => cont.data?.powerScore;

  return (
    <button
      type="button"
      class="bbt-moale"
      aria-label="Profilul tău"
      onClick={() => {
        tineMinteLista(location.pathname);
        navigate("/cont");
      }}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "10px",
        "flex-shrink": 0,
        margin: "0 8px 8px",
        height: "56px",
        padding: "0 12px",
        "box-sizing": "border-box",
        border: 0,
        "border-radius": "12px",
        background: S1.rama,
        color: "#FFFFFF",
        cursor: "pointer",
        "font-family": "inherit",
        "text-align": "left",
      }}
    >
      <span style={{ position: "relative", display: "flex", "flex-shrink": 0 }}>
        <AvatarOm om={client().user} marime={36} />
        <span
          style={{
            position: "absolute",
            right: "-1px",
            bottom: "-1px",
            width: "12px",
            height: "12px",
            "box-sizing": "border-box",
            "border-radius": "50%",
            border: `2px solid ${S1.rama}`,
            background: "#55DB9C",
          }}
        />
      </span>
      <span style={{ flex: 1, "min-width": 0 }}>
        <span
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            "min-width": 0,
          }}
        >
          <span
            style={{
              ...UN_RAND,
              "font-size": "15px",
              "line-height": "20px",
              "font-weight": 700,
            }}
          >
            {nume()}
          </span>
          <Show when={power() !== undefined && power() !== null}>
            <span
              title="Power Score"
              style={{
                display: "inline-flex",
                "align-items": "center",
                gap: "3px",
                "flex-shrink": 0,
                height: "22px",
                padding: "0 8px",
                "border-radius": "999px",
                background: S1.placa,
                color: "#FFA8CD",
                "font-size": "12px",
                "font-weight": 700,
              }}
            >
              ⚡ {power()!.toLocaleString("ro-RO")}
            </span>
          </Show>
        </span>
        <Show when={rol()}>
          <span
            style={{
              ...UN_RAND,
              display: "block",
              "font-size": "13px",
              "line-height": "18px",
              "font-weight": 500,
              color: S1.categorie,
            }}
          >
            {rol()}
          </span>
        </Show>
      </span>
      <span style={{ display: "flex", color: S1.stins, "flex-shrink": 0 }}>
        <IconRotita size={20} />
      </span>
    </button>
  );
}
