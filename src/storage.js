// Persistenza locale (localStorage). Tutto resta sul dispositivo dell'utente.
const KEY = 'fitai_state_v1'

const empty = {
  program: null,        // programma corrente
  logs: {},             // chiave: `${week}-${dayIdx}-${exId}` -> [{weight, reps}]
  notes: {},            // chiave: `${week}-${dayIdx}` -> stringa
  bodyweight: [],       // [{date, value}]
  completed: {},        // chiave: `${week}-${dayIdx}` -> ISO date completamento
  swaps: {},            // chiave: `${week}-${dayIdx}-${exId}` -> nuovo exId (esercizio alternativo)
  readiness: {},        // chiave: `${week}-${dayIdx}` -> 'scarico' | 'normale' | 'carico'
  lang: 'it',           // lingua interfaccia: 'it' | 'en'
  diet: null,           // piano alimentare: { name, days: [{ id, name, meals: [{ id, name, foods: [{id,name,qty,kcal}] }] }] }
  nutritionLog: {},     // chiave: data 'YYYY-MM-DD' -> { planDayId, eaten: {foodId:true}, extras: [{id,name,qty,kcal}] }
  anthropicKey: '',     // chiave Anthropic SOLO locale (per auto-lettura diete) — mai inviata altrove
  measurements: [],     // [{ date, vita, braccio, coscia, petto, fianchi }] in cm
  photos: [],           // [{ id, date, img }] foto progressi (compresse, base64)
  syncCode: '',         // codice per la sincronizzazione cloud (se attiva)
  hyrox: null,          // config piano HYROX salvato: { weeks, days, level }
  hyroxLog: {},         // chiave `${week}-${dayIdx}` -> { done: ISO, note: '' }
  exNotes: {},          // chiave exId -> nota personale (sedile, presa, accortezze): segue l'esercizio ovunque
}

// Timestamp ultimo backup (per il promemoria) — chiave dedicata, fuori dallo
// stato React per non innescare re-render/loop.
const BK = 'fitai_last_backup'
export function markBackup() { try { localStorage.setItem(BK, String(Date.now())) } catch { /* ignora */ } }
export function lastBackupTime() { try { return parseInt(localStorage.getItem(BK) || '0', 10) || 0 } catch { return 0 } }

// Rimuove i segreti (chiave API) prima di esportare/sincronizzare: non deve mai
// finire in un file condivisibile o nel cloud.
export function sanitizeForBackup(state) {
  const s = { ...state }
  delete s.anthropicKey
  return s
}

// Scarica un file di backup (usato da Profilo e dal promemoria in Home).
export function exportBackup(state) {
  const blob = new Blob([JSON.stringify(sanitizeForBackup(state), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitai-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return { ...empty }
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Salvataggio non riuscito', e)
  }
}

export const logKey = (week, dayIdx, exId) => `${week}-${dayIdx}-${exId}`
export const dayKey = (week, dayIdx) => `${week}-${dayIdx}`

// Recupera l'ULTIMA sessione registrata per lo stesso esercizio in QUALSIASI
// giornata precedente (stessa settimana in un giorno prima, o settimane prima,
// in qualunque giornata). Serve a pre-compilare i campi e suggerire la
// progressione: es. squat fatto in Lower A → ritrovato aprendo Lower B.
export function lastLogFor(logs, week, dayIdx, exId) {
  let best = null, bw = -1, bd = -1
  for (const k of Object.keys(logs || {})) {
    const m = /^(\d+)-(\d+)-(.+)$/.exec(k)
    if (!m || m[3] !== exId) continue
    const w = +m[1], d = +m[2]
    if (w > week || (w === week && d >= dayIdx)) continue // solo sedute passate
    const val = logs[k]
    if (!val || !val.length) continue
    if (w > bw || (w === bw && d > bd)) { best = val; bw = w; bd = d }
  }
  return best
}
