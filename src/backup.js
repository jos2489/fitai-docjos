// Backup immediato che SOVRASCRIVE la copia precedente (file locale + cloud, se
// attivi). Usato dall'auto-salvataggio e da "Completa allenamento".
import { autoWrite } from './filebackup.js'
import { cloudPush } from './cloudsync.js'
import { sanitizeForBackup, markBackup } from './storage.js'

export async function backupNow(state) {
  if (!state || !state.program) return
  const clean = sanitizeForBackup(state) // niente chiave API nel backup
  try { if ((await autoWrite(clean)) === 'ok') markBackup() } catch { /* file non attivo */ }
  if (state.syncCode) {
    try { await cloudPush(state.syncCode, clean); markBackup() } catch { /* offline: riprova dopo */ }
  }
}
