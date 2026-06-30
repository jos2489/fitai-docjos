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

// Recupera l'ultima sessione registrata per lo stesso esercizio nelle settimane
// precedenti (serve a pre-compilare i campi e suggerire la progressione).
export function lastLogFor(logs, week, dayIdx, exId) {
  for (let w = week - 1; w >= 1; w--) {
    const k = logKey(w, dayIdx, exId)
    if (logs[k] && logs[k].length) return logs[k]
  }
  return null
}
