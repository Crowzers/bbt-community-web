import { For, Show, createSignal } from "solid-js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { BBT_SITE_URL } from "../config";
import { useEtichete } from "./Setari";
import { C } from "./ui";

/**
 * Omul, cum îl arată cardul mic. Aceeași formă ca pe site (`website/src/components/CardOm.tsx`) și în aplicație
 * (`mobil/src/ui/CardOm.tsx`): numele e deja ales de cel care pune cardul.
 */
export interface OmCard {
  id: string;
  nume: string;
  avatarUrl?: string | null;
  /** Slug-ul rolului („sound_engineer”). */
  rol?: string | null;
  /** Deschide profilul scurt din Community. Lipsește la cine n-a intrat încă în Community. */
  stoatUserId?: string | null;
  /** Doar la profilurile publice: rezerva când omul n-are cont în Community, duce la profilul de pe site. */
  username?: string | null;
}

/**
 * Culoarea fiecărui rol, aceeași ca pe site (`CULORI_ROL` din `website/src/app/[limba]/u/[username]/stil.ts`) și ca în
 * mini-profil (`MiniProfil.tsx`, care își ține încă propria copie). Foaia e albă, deci valorile de zi.
 */
const CULORI_ROL: Record<string, { fundal: string; text: string }> = {
  vocalist: { fundal: "#FFEDE6", text: "#9C2A01" },
  producer: { fundal: "#99E9C4", text: "#216043" },
  dj: { fundal: "#DCEEFF", text: "#2C639E" },
  beatmaker: { fundal: "#FFEFAD", text: "#715E10" },
  songwriter: { fundal: "#E5E3F5", text: "#5C4ADE" },
  instrumentist: { fundal: "#EEF2F7", text: "#46536B" },
  sound_engineer: { fundal: "#FAE8EB", text: "#CA1A38" },
  other: { fundal: "#F8F0FF", text: "#5C4ADE" },
};
const CULOARE_ROL_IMPLICITA = { fundal: "#F2F4F7", text: "#475467" };

/**
 * Ce se întâmplă la apăsare: profilul scurt din Community, altfel profilul de pe site, altfel nimic. Exportat și pentru
 * numele din text (rândul „cu Mihai, Vlad” din cardul „Cazare”).
 */
export function useDeschideOmul() {
  const client = useClient();
  const { openModal } = useModals();
  return async (om: OmCard) => {
    if (om.stoatUserId) {
      try {
        const user = await client().users.fetch(om.stoatUserId);
        // Cu `member`, profilul arată și rolurile din server; cine a ieșit rămâne doar cu profilul.
        const member = await client()
          .servers.toList()[0]
          ?.fetchMember(user)
          .catch(() => undefined);
        openModal({ type: "user_profile", user, member });
        return;
      } catch {
        // Contul din Community nu mai există: cade pe profilul de pe site, dacă e public.
      }
    }
    if (om.username)
      window.open(`${BBT_SITE_URL}/u/${om.username}`, "_blank", "noopener");
  };
}

/**
 * Cardul mic de om (varianta B, aleasă de user pe 25 nov 2026): poza, numele și pastila rolului, cu săgeată.
 * Pornit la colegii de cameră; gândit pentru orice loc unde apare un om. Fără Community și fără profil public se vede,
 * dar nu se apasă, ca pe site.
 */
export function CardOm(props: { om: OmCard }) {
  const etichete = useEtichete();
  const deschide = useDeschideOmul();
  const [apasat, setApasat] = createSignal(false);
  const sePoate = () => !!(props.om.stoatUserId || props.om.username);
  const culoare = () => CULORI_ROL[props.om.rol ?? ""] ?? CULOARE_ROL_IMPLICITA;
  const numeRol = (slug: string) => {
    const nume = etichete.data?.roluri[slug];
    if (nume) return nume;
    const curat = slug.replace(/_/g, " ").trim();
    return curat.charAt(0).toUpperCase() + curat.slice(1);
  };

  return (
    <div
      role={sePoate() ? "button" : undefined}
      tabIndex={sePoate() ? 0 : undefined}
      onClick={() => sePoate() && void deschide(props.om)}
      onKeyDown={(e) => {
        if (sePoate() && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          void deschide(props.om);
        }
      }}
      onPointerEnter={() => setApasat(true)}
      onPointerLeave={() => setApasat(false)}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        padding: "10px 14px",
        cursor: sePoate() ? "pointer" : "default",
        background: sePoate() && apasat() ? C.foaieTare : "transparent",
        transition: "background 120ms",
      }}
    >
      <Show
        when={props.om.avatarUrl}
        fallback={
          <div
            style={{
              width: "40px",
              height: "40px",
              "border-radius": "50%",
              background: C.negru,
              color: C.peNegru,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              "font-size": "15px",
              "font-weight": 600,
              "flex-shrink": 0,
            }}
          >
            {(props.om.nume[0] ?? "?").toUpperCase()}
          </div>
        }
      >
        <img
          src={props.om.avatarUrl!}
          alt=""
          style={{
            width: "40px",
            height: "40px",
            "border-radius": "50%",
            "object-fit": "cover",
            "flex-shrink": 0,
          }}
        />
      </Show>
      <div style={{ flex: 1, "min-width": 0 }}>
        <p
          style={{
            margin: 0,
            color: C.text,
            "font-size": "16px",
            "font-weight": 600,
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap",
          }}
        >
          {props.om.nume}
        </p>
        <Show when={props.om.rol}>
          <span
            style={{
              display: "inline-block",
              "margin-top": "4px",
              padding: "2px 10px",
              "border-radius": "999px",
              "font-size": "14px",
              "font-weight": 600,
              background: culoare().fundal,
              color: culoare().text,
              "white-space": "nowrap",
            }}
          >
            {numeRol(props.om.rol!)}
          </span>
        </Show>
      </div>
      <Show when={sePoate()}>
        <span style={{ color: C.slab, display: "flex" }}>
          <Symbol size={20}>chevron_right</Symbol>
        </span>
      </Show>
    </div>
  );
}

/**
 * Numele unor oameni în text, despărțite de virgulă („cu Mihai, Vlad”, colegii din sesiune). Cine se poate deschide e
 * îngroșat și se apasă (25 nov 2026, ca pe site); restul rămâne text. `eu` = id-ul omului din cont, scris „tu”, fără click.
 */
export function NumeOameni(props: { oameni: OmCard[]; eu?: string }) {
  const deschide = useDeschideOmul();
  return (
    <For each={props.oameni}>
      {(om, i) => (
        <>
          {i() > 0 && ", "}
          <Show
            when={om.id !== props.eu && (om.stoatUserId || om.username)}
            fallback={<>{om.id === props.eu ? "tu" : om.nume}</>}
          >
            <button
              type="button"
              onClick={() => void deschide(om)}
              style={{
                all: "unset",
                cursor: "pointer",
                color: C.text,
                "font-weight": 600,
              }}
            >
              {om.nume}
            </button>
          </Show>
        </>
      )}
    </For>
  );
}

/** Lista albă în care stau cardurile, cu linie între ele, ca pe site (alb pe cardul gri, ca la Colabs). */
export function ListaOameni(props: { oameni: OmCard[] }) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        background: C.fundal,
        "border-radius": "16px",
        overflow: "hidden",
      }}
    >
      <For each={props.oameni}>
        {(om, i) => (
          <div style={{ "border-top": i() ? `1px solid ${C.linie}` : "none" }}>
            <CardOm om={om} />
          </div>
        )}
      </For>
    </div>
  );
}
