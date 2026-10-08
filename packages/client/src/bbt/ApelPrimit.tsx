import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";
import { Portal } from "solid-js/web";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { Avatar } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import ringtonIntrare from "../../public/assets/sounds/ringtone_incoming.ogg";

/**
 * Apelul primit: „X te sună" cu Răspunde / Refuză, cât timp cineva te sună în mesaje directe.
 *
 * Plângerea (5 oct 2026): „când te sună cineva nu-ți apare nimic, trebuie să intri tu la el în
 * mesaje și să dai join". Stoat are pe server tot ce trebuie — lista celor de sunat la pornirea
 * apelului și push-ul „X is calling you" — dar clientul lor nu trimitea lista (reparat în
 * `components/rtc/state.tsx`) și n-avea niciun ecran de apel primit; sunetul `ringtoneIncoming`
 * exista, nefolosit.
 *
 * Fără eveniment nou de la server: un apel „te sună" când într-un canal de mesaje directe sau de
 * grup al tău e cineva în voce, tu nu, iar primul intrat a intrat acum cel mult 45 de secunde. Pe
 * urmă se oprește singur, ca un telefon care nu mai sună. „Refuză" îl ascunde doar pe acela.
 */
const FEREASTRA_MS = 45_000;

export function ApelPrimit() {
  const client = useClient();
  const voice = useVoice();
  const state = useState();
  const navigate = useNavigate();

  const [refuzate, setRefuzate] = createSignal<ReadonlySet<string>>(new Set());
  const [acum, setAcum] = createSignal(Date.now());
  const ceas = setInterval(() => setAcum(Date.now()), 3_000);
  onCleanup(() => clearInterval(ceas));

  const apel = createMemo(() => {
    const eu = client().user?.id;
    if (!eu) return;
    for (const canal of client().channels.toList()) {
      if (canal.type !== "DirectMessage" && canal.type !== "Group") continue;
      const inVoce = [...canal.voiceParticipants.values()];
      if (inVoce.length === 0 || canal.voiceParticipants.has(eu)) continue;
      if (voice.channel()?.id === canal.id) continue;

      const primul = inVoce.reduce((a, b) =>
        a.joinedAt <= b.joinedAt ? a : b,
      );
      if (acum() - primul.joinedAt.getTime() > FEREASTRA_MS) continue;
      // Cheia include momentul: un apel nou de la același om sună din nou, chiar dacă primul a
      // fost refuzat.
      const cheie = `${canal.id}:${primul.joinedAt.getTime()}`;
      if (refuzate().has(cheie)) continue;

      return { canal, apelant: client().users.get(primul.userId), cheie };
    }
  });

  // Soneria, în buclă, cât timp e un apel pe ecran — dacă omul n-a oprit-o din setările de sunet.
  // Pe iPhone, fără o atingere anterioară în pagină, browserul poate refuza sunetul: rămâne ecranul.
  createEffect(() => {
    if (!apel() || !state.sounds.enabled("ringtoneIncoming")) return;
    const audio = new Audio(ringtonIntrare);
    audio.loop = true;
    audio.play().catch(() => {});
    onCleanup(() => audio.pause());
  });

  function raspunde() {
    const a = apel();
    if (!a) return;
    navigate(a.canal.path);
    void voice.connect(a.canal);
  }

  function refuza() {
    const a = apel();
    if (a) setRefuzate((s) => new Set(s).add(a.cheie));
  }

  // ⚠️ În `#floating`, nu pe loc: `#root` are `position: fixed`, deci e propriul context de
  // stivuire, iar tot ce e înăuntrul lui — oricât de mare z-index-ul — stă SUB `#floating` (cardurile
  // de profil, meniurile, apelul pe ecran complet). Văzut în proba din 8 oct: un card de profil
  // rămas deschis acoperea modalul de apel.
  return (
    <Portal mount={document.getElementById("floating") ?? document.body}>
      <Show when={apel()}>
        {(a) => (
          // BBT (8 oct 2026): MODAL în mijlocul ecranului, ca la Discord — cerut explicit („ar trebui
          // să-i apară pe ecran modal să răspundă"). Prima variantă era o bandă sus, ușor de ratat
          // lângă bara de sus. Fundalul NU închide apelul la atingere: o atingere rătăcită pe lângă
          // butoane ar fi refuzat un apel fără să vrei; doar cele două butoane decid.
          <div
            style={{
              position: "fixed",
              inset: 0,
              "z-index": 1000,
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              padding: "24px",
              background: "rgb(0 0 0 / 72%)",
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Apel primit"
              style={{
                width: "min(320px, 100%)",
                display: "flex",
                "flex-direction": "column",
                "align-items": "center",
                gap: "6px",
                padding: "32px 24px 28px",
                background: "#141414",
                color: "#fff",
                border: "1px solid rgb(255 255 255 / 12%)",
                "border-radius": "24px",
                "box-shadow": "0 24px 64px rgb(0 0 0 / 70%)",
                "text-align": "center",
              }}
            >
              <style>{`
              @keyframes bbt-apel-unda {
                0% { transform: scale(1); opacity: .55 }
                100% { transform: scale(1.55); opacity: 0 }
              }
              @media (prefers-reduced-motion: reduce) {
                .bbt-apel-unda { animation: none !important; opacity: 0 }
              }
            `}</style>
              <div style={{ position: "relative", "margin-bottom": "14px" }}>
                <span
                  class="bbt-apel-unda"
                  style={{
                    position: "absolute",
                    inset: 0,
                    "border-radius": "50%",
                    background: "#FFA8CD",
                    animation: "bbt-apel-unda 1.4s ease-out infinite",
                  }}
                />
                {/* `relative`: altfel unda (absolută) s-ar desena PESTE avatar, nu în spatele lui. */}
                <div style={{ position: "relative" }}>
                  <Avatar
                    src={a().apelant?.animatedAvatarURL}
                    fallback={a().apelant?.displayName}
                    fallbackBackground
                    size={96}
                  />
                </div>
              </div>
              <div
                style={{
                  "font-weight": 700,
                  "font-size": "20px",
                  "max-width": "100%",
                  overflow: "hidden",
                  "text-overflow": "ellipsis",
                  "white-space": "nowrap",
                }}
              >
                {a().apelant?.displayName ?? "Cineva"}
              </div>
              <div
                style={{ "font-size": "14px", color: "rgb(255 255 255 / 60%)" }}
              >
                {a().canal.type === "Group"
                  ? `sună grupul ${a().canal.name ?? ""}`
                  : "te sună…"}
              </div>
              <div
                style={{ display: "flex", gap: "40px", "margin-top": "26px" }}
              >
                <ButonApel culoare="#E5484D" eticheta="Refuză" onClick={refuza}>
                  <Symbol>call_end</Symbol>
                </ButonApel>
                <ButonApel
                  culoare="#30A46C"
                  eticheta="Răspunde"
                  onClick={raspunde}
                >
                  <Symbol>call</Symbol>
                </ButonApel>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Portal>
  );
}

function ButonApel(props: {
  culoare: string;
  eticheta: string;
  onClick: () => void;
  children: import("solid-js").JSX.Element;
}) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        gap: "8px",
      }}
    >
      <button
        aria-label={props.eticheta}
        title={props.eticheta}
        onClick={props.onClick}
        style={{
          width: "60px",
          height: "60px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "border-radius": "50%",
          border: "none",
          background: props.culoare,
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {props.children}
      </button>
      <span style={{ "font-size": "12px", color: "rgb(255 255 255 / 70%)" }}>
        {props.eticheta}
      </span>
    </div>
  );
}
