import type { API, Client, User } from "stoat.js";

function puneRelatia(client: Client, om: User, relatie: API.RelationshipStatus) {
  const inainte = { ...client.users.getUnderlyingObject(om.id) };
  client.users.updateUnderlyingObject(om.id, "relationship", relatie);
  client.emit("userUpdate", om, inainte);
}

function citesteEroarea(e: unknown): { type?: string; max?: number } {
  try {
    return typeof e === "string" ? JSON.parse(e) : {};
  } catch {
    return {};
  }
}

function mesajPentru({ type, max }: { type?: string; max?: number }) {
  if (type === "TooManyPendingFriendRequests")
    return `Ai prea multe cereri fără răspuns (limita e ${max}). Mai trimiți după ce îți răspunde cineva.`;
  if (type === "Blocked" || type === "BlockedByOther")
    return "Nu-i poți trimite cerere omului ăsta.";
  return `Încearcă din nou.${type ? ` (${type})` : ""}`;
}

/**
 * BBT: trimite cererea de prietenie sau o acceptă pe cea primită, același apel în Stoat, ca `mobil/src/stoat/relatii.ts`.
 *
 * ⚠️ Nu `user.addFriend()`: își aruncă răspunsul (`getOrCreate` nu atinge un om deja cunoscut), iar relația se schimba
 * doar dacă sosea și evenimentul din socket. Fără el, butonul rămânea la fel și părea mort (userul, 31 oct).
 * ⚠️ `stoat-api` aruncă textul brut al răspunsului, nu un obiect, deci eroarea se citește cu `JSON.parse`. Ce nu trece se
 * spune pe ecran: o cerere refuzată în tăcere arată ca un buton stricat.
 *
 * @returns dacă relația e acum cea cerută
 */
export async function trimiteCererea(client: Client, om: User) {
  try {
    const raspuns = await client.api.post("/users/friend", {
      username: `${om.username}#${om.discriminator}`,
    });
    puneRelatia(client, om, raspuns.relationship ?? "Outgoing");
    return true;
  } catch (e) {
    const eroare = citesteEroarea(e);
    if (eroare.type === "AlreadySentRequest") {
      puneRelatia(client, om, "Outgoing");
      return true;
    }
    if (eroare.type === "AlreadyFriends") {
      puneRelatia(client, om, "Friend");
      return true;
    }
    console.error("[bbt] cererea de prietenie a picat", e);
    window.alert(`Cererea n-a plecat. ${mesajPentru(eroare)}`);
    return false;
  }
}
