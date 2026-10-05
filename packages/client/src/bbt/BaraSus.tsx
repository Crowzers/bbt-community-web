import { Show } from "solid-js";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "@revolt/app/menus/ContextMenu";
import { useClient, useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL, ICONITA_BBT } from "./config";

/**
 * Bara de sus a BBT Community: sigla + „COMMUNITY" în stânga, CONTUL separat în dreapta.
 *
 * Cererea userului (5 oct 2026): „în Community-ul vechi îmi plăcea că userul conectat nu stătea în
 * bara din stânga, era un element separat; inspiră-te din TRW". Stoat îl ținea jos în lista de
 * servere. Aici e o pastilă (avatar, nume, stare) cu meniul contului la click: Profil, Setări,
 * Înapoi pe site, Deconectare — fostele acțiuni de pe avatarul din stânga.
 *
 * ⚠️ Fără căutare globală și fără clopoțel, deși schița le are: Stoat n-are căutare peste tot
 * serverul și nici centru de notificări — un buton care nu face nimic e mai rău decât niciunul
 * (căutarea în canal rămâne în antetul canalului).
 *
 * Desktop: deasupra întregii aplicații (`src/Interface.tsx`). Telefon: în capul ecranului cu
 * lista de canale (`src/interface/Sidebar.tsx`), compactă — pe ecranul unui canal sus stă antetul
 * canalului.
 */
export function BaraSus(props: { compact?: boolean }) {
  const client = useClient();
  const { logout } = useClientLifecycle();
  const { openModal } = useModals();

  const eu = () => client().user;
  const stareOnline = () => {
    const p = eu()?.presence;
    return p === "Busy"
      ? "#e5484d"
      : p === "Idle"
        ? "#ffd731"
        : p === "Invisible"
          ? "#555555"
          : "#30a46c";
  };

  const setari = (pagina?: string) =>
    openModal({
      type: "settings",
      config: "user",
      context: pagina ? { page: pagina } : undefined,
    });

  const meniu = () => (
    <ContextMenu>
      <ContextMenuButton
        _titleCase={false}
        symbol={<Symbol>account_circle</Symbol>}
        onClick={() => setari("profile")}
      >
        Profilul meu
      </ContextMenuButton>
      <ContextMenuButton
        _titleCase={false}
        symbol={<Symbol>settings</Symbol>}
        onClick={() => setari()}
      >
        Setări
      </ContextMenuButton>
      <ContextMenuButton
        _titleCase={false}
        symbol={<Symbol>open_in_new</Symbol>}
        onClick={() => window.open(BBT_SITE_URL, "_blank", "noopener")}
      >
        Deschide site-ul BBT
      </ContextMenuButton>
      <ContextMenuDivider />
      <ContextMenuButton
        _titleCase={false}
        symbol={<Symbol>logout</Symbol>}
        destructive
        onClick={() => logout()}
      >
        Deconectare
      </ContextMenuButton>
    </ContextMenu>
  );

  return (
    <header
      style={{
        height: props.compact ? "56px" : "48px",
        "flex-shrink": 0,
        display: "flex",
        "align-items": "center",
        gap: "10px",
        padding: props.compact ? "0 8px 0 12px" : "0 12px 0 14px",
        background: "#000",
        "border-bottom": "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
      }}
    >
      <img
        src={ICONITA_BBT}
        alt=""
        style={{
          width: "30px",
          height: "30px",
          "border-radius": "9px",
          "flex-shrink": 0,
        }}
      />
      <Show
        when={!props.compact}
        fallback={
          <span
            style={{ "font-size": "15px", "font-weight": 700, "flex-grow": 1 }}
          >
            BBT Community
          </span>
        }
      >
        <span
          style={{
            "font-size": "12px",
            "font-weight": 700,
            "letter-spacing": "0.14em",
          }}
        >
          COMMUNITY
        </span>
        <div style={{ "flex-grow": 1 }} />
      </Show>

      <button
        type="button"
        aria-label="Contul meu"
        use:floating={{ contextMenu: meniu, contextMenuHandler: "click" }}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          height: props.compact ? "44px" : "36px",
          padding: props.compact ? "0 6px" : "0 10px 0 4px",
          "border-radius": "18px",
          background: props.compact ? "transparent" : "#141414",
          border: props.compact ? "0" : "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <span style={{ position: "relative", display: "flex" }}>
          <Avatar
            src={eu()?.animatedAvatarURL}
            fallback={eu()?.displayName}
            fallbackBackground
            size={props.compact ? 32 : 28}
          />
          <span
            style={{
              position: "absolute",
              right: "-1px",
              bottom: "-1px",
              width: "9px",
              height: "9px",
              "border-radius": "50%",
              background: stareOnline(),
              border: `2px solid ${props.compact ? "#000" : "#141414"}`,
            }}
          />
        </span>
        <Show when={!props.compact}>
          <span
            style={{
              "font-size": "13px",
              "font-weight": 600,
              "max-width": "180px",
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {eu()?.displayName}
          </span>
          <Symbol size={16}>keyboard_arrow_down</Symbol>
        </Show>
      </button>
    </header>
  );
}
