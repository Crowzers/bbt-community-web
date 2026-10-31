/**
 * Ce s-a schimbat în `TextInput`, spus ca operații pe `Y.Text`. Un `TextInput` dă doar textul nou, întreg; scris ca atare,
 * ar șterge ce au scris ceilalți între timp (decizia #11 din design: nu înlocuire, ci inserare și ștergere).
 */
export type Editare = { index: number; sterse: number; adaugate: string }

const prima = (c: number) => c >= 0xd800 && c <= 0xdbff
const aDoua = (c: number) => c >= 0xdc00 && c <= 0xdfff

/** Singura bucată care diferă. Nu taie un emoji în două: un caracter din afara BMP ocupă două poziții. */
export function diferenta(vechi: string, nou: string): Editare {
  const maxim = Math.min(vechi.length, nou.length)
  let inceput = 0
  while (inceput < maxim && vechi[inceput] === nou[inceput]) inceput++
  if (inceput > 0 && prima(vechi.charCodeAt(inceput - 1))) inceput--

  let sfarsit = 0
  while (sfarsit < maxim - inceput && vechi[vechi.length - 1 - sfarsit] === nou[nou.length - 1 - sfarsit]) sfarsit++
  if (sfarsit > 0 && aDoua(vechi.charCodeAt(vechi.length - sfarsit))) sfarsit--

  return { index: inceput, sterse: vechi.length - inceput - sfarsit, adaugate: nou.slice(inceput, nou.length - sfarsit) }
}

/**
 * Editarea făcută peste `baza` (ce vede omul), mutată peste `curent` (documentul de acum, cu ce au scris ceilalți între
 * timp). Ce s-a scris de alții nu se șterge niciodată: dacă omul a șters peste, rămâne, iar ștergerea se aplică doar în
 * jurul lui. Operațiile vin de la dreapta la stânga, ca prima să nu mute pozițiile celei de-a doua.
 */
export function mutaEditarea(editare: Editare, baza: string, curent: string): Editare[] {
  if (baza === curent) return [editare]
  const alta = diferenta(baza, curent)
  const sfarsitEditare = editare.index + editare.sterse
  const sfarsitAlta = alta.index + alta.sterse
  const decalaj = alta.adaugate.length - alta.sterse

  if (editare.index >= sfarsitAlta) return [{ ...editare, index: editare.index + decalaj }]
  if (sfarsitEditare <= alta.index) return [editare]

  const operatii: Editare[] = []
  if (sfarsitEditare > sfarsitAlta) operatii.push({ index: sfarsitAlta + decalaj, sterse: sfarsitEditare - sfarsitAlta, adaugate: '' })
  if (editare.index < alta.index) operatii.push({ index: editare.index, sterse: alta.index - editare.index, adaugate: editare.adaugate })
  else if (editare.adaugate) operatii.push({ index: alta.index + alta.adaugate.length, sterse: 0, adaugate: editare.adaugate })
  return operatii
}

/** Unde ajunge cursorul când textul de sub el se schimbă. */
export function mutaPozitia(pozitie: number, vechi: string, nou: string): number {
  const d = diferenta(vechi, nou)
  if (pozitie <= d.index) return pozitie
  if (pozitie >= d.index + d.sterse) return pozitie + d.adaugate.length - d.sterse
  return d.index + d.adaugate.length
}
