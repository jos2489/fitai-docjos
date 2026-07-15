// Client per la sincronizzazione cloud (usa la Netlify Function /sync).
// Un "codice" scelto/generato fa da chiave: con quel codice recuperi i dati
// su qualsiasi dispositivo. Niente login, niente account.

const ENDPOINT = '/.netlify/functions/sync'

// Codice tipo FITAI-7K2A-9QX3 (facile da salvare, difficile da indovinare).
export function newSyncCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // niente caratteri ambigui
  const g = () => Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join('')
  return `FITAI-${g()}-${g()}`
}

export async function cloudPush(code, state) {
  const res = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'push', code, data: state }),
  })
  if (!res.ok) throw new Error('push-' + res.status)
  return res.json()
}

// Ritorna i dati salvati per quel codice, o null se non esiste.
export async function cloudPull(code) {
  const res = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pull', code }),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('pull-' + res.status)
  const j = await res.json()
  return j && j.data ? { data: j.data, updatedAt: j.updatedAt } : null
}
