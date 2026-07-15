// Backup immediato che SOVRASCRIVE la copia precedente (file locale + cloud, se
// attivi). Usato dall'auto-salvataggio e da "Completa allenamento".
import { autoWrite } from './filebackup.js'
import { cloudPush } from './cloudsync.js'
import { sanitizeForBackup, markBackup } from './storage.js'

// Ritorna: 'ok' (almeno un backup riuscito), 'fail' (un backup attivo ma fallito),
// 'none' (nessun backup attivo).
export async function backupNow(state) {
  if (!state || !state.program) return 'none'
  const clean = sanitizeForBackup(state) // niente chiave API nel backup
  let ok = false, targetExisted = false

  let fileRes = 'no-handle'
  try { fileRes = await autoWrite(clean) } catch { fileRes = 'error' }
  if (fileRes === 'ok') { ok = true; targetExisted = true; markBackup() }
  else if (fileRes === 'need-permission' || fileRes === 'error') targetExisted = true

  if (state.syncCode) {
    targetExisted = true
    try { await cloudPush(state.syncCode, clean); ok = true; markBackup() } catch { /* offline */ }
  }

  return ok ? 'ok' : (targetExisted ? 'fail' : 'none')
}
