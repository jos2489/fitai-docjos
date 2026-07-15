// ============================================================================
//  Salvataggio automatico su FILE (File System Access API).
//  Scrive sempre lo STESSO file, sovrascrivendolo → nessun duplicato, poca
//  memoria, e soprattutto sopravvive allo svuotamento dei dati del browser
//  (il file è su disco, fuori dal browser). Il "handle" del file è tenuto in
//  IndexedDB: viene perso se si svuotano i dati del sito, ma il file resta →
//  dopo uno svuotamento basta re-importare il file una volta e riattivare.
//  Supportato sui browser desktop Chromium (Brave/Chrome/Edge). Non su iOS.
// ============================================================================

export const supportsAutoBackup = () => typeof window !== 'undefined' && 'showSaveFilePicker' in window

// --- mini wrapper IndexedDB per conservare il file-handle --------------------
const DB = 'fitai-filebackup', STORE = 'kv', KEY = 'handle'
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function idbGet(k) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, 'readonly').objectStore(STORE).get(k)
    t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error)
  })
}
async function idbSet(k, v) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, k)
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error)
  })
}
async function idbDel(k) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(k)
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error)
  })
}

async function hasPermission(handle, request) {
  const opts = { mode: 'readwrite' }
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true
    if (request && (await handle.requestPermission(opts)) === 'granted') return true
  } catch { /* ignora */ }
  return false
}
async function writeState(handle, state) {
  const w = await handle.createWritable()
  await w.write(JSON.stringify(state, null, 2))
  await w.close()
}

// Attiva: l'utente sceglie/crea il file una volta. Scrive subito lo stato.
export async function enableAutoBackup(state) {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'fitai-backup.json',
    types: [{ description: 'Backup FitAi', accept: { 'application/json': ['.json'] } }],
  })
  if (!(await hasPermission(handle, true))) throw new Error('permesso negato')
  await writeState(handle, state)
  await idbSet(KEY, handle)
  return handle.name
}

// Scrittura automatica silenziosa: solo se il permesso è già concesso.
export async function autoWrite(state) {
  try {
    const handle = await idbGet(KEY)
    if (!handle) return 'no-handle'
    if (!(await hasPermission(handle, false))) return 'need-permission'
    await writeState(handle, state)
    return 'ok'
  } catch { return 'error' }
}

// Riattiva dopo un riavvio del browser (richiede un tocco per il permesso).
export async function resumeAutoBackup(state) {
  const handle = await idbGet(KEY)
  if (!handle) return false
  if (!(await hasPermission(handle, true))) return false
  await writeState(handle, state)
  return true
}

export async function disableAutoBackup() { await idbDel(KEY) }

export async function backupStatus() {
  try {
    const handle = await idbGet(KEY)
    if (!handle) return { active: false, granted: false, name: null }
    const granted = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted'
    return { active: true, granted, name: handle.name }
  } catch { return { active: false, granted: false, name: null } }
}
