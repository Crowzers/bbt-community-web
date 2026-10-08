import type { Client, ServerMember } from "stoat.js";

/**
 * Rolurile unui om care tocmai a intrat în server, cerute din nou de la server.
 *
 * Simptomul (8 oct 2026): „un utilizator care intră prima dată în Community intră ca membru, și toți
 * îl văd ca membru până la refresh". La prima intrare, adminul BBT îl bagă în server și imediat
 * după botul îi dă rolurile — deci ceilalți primesc `ServerMemberJoin` urmat la câteva milisecunde de
 * `ServerMemberUpdate`. În SDK (stoat.js) evenimentele NU se tratează pe rând: `ServerMemberJoin` stă
 * în `await users.fetch(...)` cât vine omul de la server, între timp sosește actualizarea, membrul
 * nu există încă, iar actualizarea e ARUNCATĂ fără nicio urmă. Membrul apare apoi fără roluri.
 *
 * ⚠️ Repararea stă aici, nu în SDK: `packages/stoat.js` e submodul spre depozitul lor, deci o
 * schimbare acolo n-ar ajunge în build-ul nostru fără un fork separat al SDK-ului.
 *
 * ⚠️ Rolurile cerute se pun DOAR dacă membrul n-are încă niciunul. Dacă actualizarea botului a
 * ajuns totuși (după intrare, pe drumul normal), ea e mai nouă decât răspunsul nostru — care putea
 * pleca înaintea ei și să aducă lista goală.
 */
export function rolurileLaIntrare(client: Client) {
  client.on("serverMemberJoin", (membru: ServerMember) => {
    const { server, user } = membru.id;
    if (user === client.user?.id) return;
    void client.api
      .get(`/servers/${server as ""}/members/${user as ""}`, { roles: false })
      .then((date) => {
        const roluri = (date as { roles?: string[] }).roles ?? [];
        const cheie = server + user;
        const acum = client.serverMembers.getUnderlyingObject(cheie);
        if (roluri.length && !acum.roles?.length) {
          client.serverMembers.updateUnderlyingObject(cheie, { roles: roluri });
        }
      })
      .catch(() => {});
  });
}
