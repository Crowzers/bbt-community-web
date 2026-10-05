import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

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

  return (
    <Show when={apel()}>
      {(a) => (
        <div
          role="alertdialog"
          aria-label="Apel primit"
          style={{
            position: "fixed",
            top: "calc(var(--bbt-ecran-sus, 0px) + env(safe-area-inset-top) + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            "z-index": 200,
            width: "min(360px, calc(100vw - 24px))",
            display: "flex",
            "align-items": "center",
            gap: "12px",
            padding: "12px 14px",
            background: "#141414",
            color: "#fff",
            border: "1px solid rgb(255 255 255 / 12%)",
            "border-radius": "16px",
            "box-shadow": "0 16px 48px rgb(0 0 0 / 60%)",
          }}
        >
          <Avatar
            src={a().apelant?.animatedAvatarURL}
            fallback={a().apelant?.displayName}
            fallbackBackground
            size={44}
          />
          <div style={{ flex: 1, "min-width": 0 }}>
            <div
              style={{
                "font-weight": 700,
                "font-size": "15px",
                overflow: "hidden",
                "text-overflow": "ellipsis",
                "white-space": "nowrap",
              }}
            >
              {a().apelant?.displayName ?? "Cineva"}
            </div>
            <div
              style={{ "font-size": "12px", color: "rgb(255 255 255 / 60%)" }}
            >
              {a().canal.type === "Group"
                ? `sună grupul ${a().canal.name ?? ""}`
                : "te sună"}
            </div>
          </div>
          <ButonApel culoare="#E5484D" eticheta="Refuză" onClick={refuza}>
            <Symbol>call_end</Symbol>
          </ButonApel>
          <ButonApel culoare="#30A46C" eticheta="Răspunde" onClick={raspunde}>
            <Symbol>call</Symbol>
          </ButonApel>
        </div>
      )}
    </Show>
  );
}

function ButonApel(props: {
  culoare: string;
  eticheta: string;
  onClick: () => void;
  children: import("solid-js").JSX.Element;
}) {
  return (
    <button
      aria-label={props.eticheta}
      title={props.eticheta}
      onClick={props.onClick}
      style={{
        width: "44px",
        height: "44px",
        "flex-shrink": 0,
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
  );
}
