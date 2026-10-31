import type {
  CallStartedSystemMessage,
  ChannelOwnershipChangeSystemMessage,
  ChannelRenamedSystemMessage,
  Message,
  MessagePinnedSystemMessage,
  SystemMessage,
  TextSystemMessage,
  UserModeratedSystemMessage,
  UserSystemMessage,
} from 'stoat.js'

type Om = { displayName: string } | undefined
const nume = (om: Om) => om?.displayName ?? 'Cineva'

export type MesajSistem = { text: string; apel: 'in-curs' | 'terminat' | null }

/** „sub un minut", „12 min", „1 h 5 min". */
function durata(deLa: Date, panaLa: Date): string {
  const minute = Math.floor((panaLa.getTime() - deLa.getTime()) / 60_000)
  if (minute < 1) return 'sub un minut'
  if (minute < 60) return `${minute} min`
  const rest = minute % 60
  return rest ? `${Math.floor(minute / 60)} h ${rest} min` : `${Math.floor(minute / 60)} h`
}

function descrie(s: SystemMessage, euId: string | undefined): MesajSistem {
  const fara = (text: string): MesajSistem => ({ text, apel: null })
  switch (s.type) {
    case 'call_started': {
      const apel = s as CallStartedSystemMessage
      const cine = apel.byId === euId ? 'Ai sunat' : `A sunat ${nume(apel.by)}`
      return apel.finishedAt
        ? { text: `${cine} · ${durata(apel.startedAt, apel.finishedAt)}`, apel: 'terminat' }
        : { text: `${cine} · apel în curs`, apel: 'in-curs' }
    }
    case 'user_joined':
      return fara(`${nume((s as UserSystemMessage).user)} a intrat`)
    case 'user_left':
      return fara(`${nume((s as UserSystemMessage).user)} a ieșit`)
    case 'user_kicked':
    case 'user_banned':
    case 'user_remove':
      return fara(`${nume((s as UserSystemMessage).user)} nu mai e aici`)
    case 'user_added':
      return fara(`${nume((s as UserModeratedSystemMessage).user)} a intrat în grup`)
    case 'channel_renamed':
      return fara(`Canalul se numește acum ${(s as ChannelRenamedSystemMessage).name}`)
    case 'channel_description_changed':
      return fara('Descrierea canalului s-a schimbat')
    case 'channel_icon_changed':
      return fara('Poza canalului s-a schimbat')
    case 'channel_ownership_changed':
      return fara(`${nume((s as ChannelOwnershipChangeSystemMessage).to)} e acum proprietarul canalului`)
    case 'message_pinned':
      return fara(`${nume((s as MessagePinnedSystemMessage).by)} a fixat un mesaj`)
    case 'message_unpinned':
      return fara(`${nume((s as MessagePinnedSystemMessage).by)} a scos un mesaj fixat`)
    default:
      return fara((s as TextSystemMessage).content ?? '')
  }
}

/**
 * Mesajele scrise de server în fir, cu textul nostru. Nu sunt mesaje de om: n-au conținut, autor sau bulă. `null` pentru un
 * mesaj obișnuit.
 *
 * ⚠️ Până pe 31 oct aplicația nu le deosebea, deci un apel apărea în conversație ca o bulă goală (prins de user).
 */
export function mesajSistem(m: Message, euId: string | undefined): MesajSistem | null {
  return m.systemMessage ? descrie(m.systemMessage, euId) : null
}
