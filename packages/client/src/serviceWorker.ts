/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

interface ChannelPartial {
  channel_type: string;
  name?: string;
}

interface StoatPushNotification {
  title?: string;
  author?: string;
  body: string;
  icon?: string;
  channel?: ChannelPartial;
  url?: string;
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (typeof event.notification.data === "string") {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});

/**
 * BBT: numele și textele notificărilor. Serverul Stoat (`pushd`, neatins — decizia 2) trimite la
 * apeluri și cereri de prietenie DOAR un `body`, în engleză, fără titlu; aici titlul cădea pe
 * „Stoat" (5 oct 2026: „am primit notificare de la Chrome cu numele Stoat"). Textele fixe ale lor
 * se traduc după forma exactă din `crates/daemons/pushd/src/consumers/outbound/vapid.rs`.
 */
const NUME_APLICATIE = "BBT Community";
const ICONITA_BBT = "/assets/web/android-chrome-192x192.png";

const TRADUCERI: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(.+) is calling your group, (.+)$/, (m) => `${m[1]} sună grupul ${m[2]}`],
  [/^(.+) is calling you$/, (m) => `${m[1]} te sună`],
  [
    /^(.+) sent you a friend request$/,
    (m) => `${m[1]} ți-a trimis o cerere de prietenie`,
  ],
  [
    /^(.+) accepted your friend request$/,
    (m) => `${m[1]} ți-a acceptat cererea de prietenie`,
  ],
];

function traduce(text: string): { text: string; apel: boolean } {
  for (const [forma, inlocuire] of TRADUCERI) {
    const m = text.match(forma);
    if (m) return { text: inlocuire(m), apel: /is calling/.test(text) };
  }
  return { text, apel: false };
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.text();

  const notification: StoatPushNotification = JSON.parse(payload);
  const { text, apel } = traduce(notification.body ?? "");

  if (!notification.title) {
    if (notification.channel) {
      if (notification.channel.channel_type === "DirectMessage") {
        notification.title = notification.author || NUME_APLICATIE;
      } else {
        notification.title = `${notification.author} în #${notification.channel.name}`;
      }
    } else {
      notification.title = apel ? "Apel BBT Community" : NUME_APLICATIE;
    }
  }

  notification.url ||= self.registration.scope;

  event.waitUntil(
    self.registration.showNotification(notification.title || NUME_APLICATIE, {
      icon: notification.icon || ICONITA_BBT,
      body: text,
      data: notification.url,
      // Un apel rămâne pe ecran până îl atingi sau îl închizi — nu dispare în 5 secunde.
      ...(apel ? { requireInteraction: true, tag: "bbt-apel" } : {}),
    }),
  );
});

cleanupOutdatedCaches();

// Generate list using mise scripts:locale
// prettier-ignore
const locale_keys = ["af","am","ar-dz","ar-iq","ar-kw","ar-ly","ar-ma","ar-sa","ar-tn","ar","az","be","bg","bi","bm","bn-bd","bn","bo","br","bs","ca","cs","cv","cy","da","de-at","de-ch","de","dv","el","en-au","en-ca","en-gb","en-ie","en-il","en-in","en-nz","en-sg","en-tt","en","eo","es-do","es-mx","es-pr","es-us","es","et","eu","fa","fi","fo","fr-ca","fr-ch","fr","fy","ga","gd","gl","gom-latn","gu","he","hi","hr","ht","hu","hy-am","id","is","it-ch","it","ja","jv","ka","kk","km","kn","ko","ku","ky","lb","lo","lt","lv","me","mi","mk","ml","mn","mr","ms-my","ms","mt","my","nb","ne","nl-be","nl","nn","oc-lnc","pa-in","pl","pt-br","pt","rn","ro","ru","rw","sd","se","si","sk","sl","sq","sr-cyrl","sr","ss","sv-fi","sv","sw","ta","te","tet","tg","th","tk","tl-ph","tlh","tr","tzl","tzm-latn","tzm","ug-cn","uk","ur","uz-latn","uz","vi","x-pseudo","yo","zh-cn","zh-hk","zh-tw","zh"];

precacheAndRoute(
  self.__WB_MANIFEST.filter((entry) => {
    try {
      const url = typeof entry === "string" ? entry : entry.url;
      if (url.includes("-legacy")) return false;

      const fn = url.split("/").pop();
      if (fn) {
        if (fn.endsWith("css") && !isNaN(parseInt(fn.substring(0, 3)))) {
          return false;
        }

        // Don't cache index.html under any circumstances
        if (fn.endsWith(".html")) {
          return false;
        }

        // Don't cache dayjs locales
        for (const key of locale_keys) {
          if (fn.startsWith(`${key}-`)) {
            return false;
          }
        }

        // Don't cache lingui translations
        if (fn.startsWith("messages-")) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }),
);
