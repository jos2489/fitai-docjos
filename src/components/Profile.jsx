import React, { useMemo, useState, useEffect } from 'react'
import { adaptProgram, assessProgress, levelUpProgram, dayName, buildProgram, PRIORITY_GROUPS, INJURY_OPTIONS, EMPHASIS_OPTIONS, SESSION_TIMES } from '../engine.js'
import { supportsAutoBackup, enableAutoBackup, resumeAutoBackup, disableAutoBackup, backupStatus } from '../filebackup.js'
import { newSyncCode, cloudPush, cloudPull } from '../cloudsync.js'
import { sanitizeForBackup, markBackup, exportBackup } from '../storage.js'
import { useLang, LANGUAGES, goalLabel, expLabel, equipLabel } from '../i18n.jsx'

export default function Profile({ state, setState, focus, onFocusDone }) {
  const { t, lang, setLang } = useLang()

  useEffect(() => {
    if (focus !== 'perso') return
    const el = document.getElementById('perso-anchor')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onFocusDone && onFocusDone()
  }, [focus])
  const en = lang === 'en'
  const { program } = state
  const p = program.profile
  const days = program.weeks[0].days
  const [feedback, setFeedback] = useState({})
  const [msg, setMsg] = useState('')

  const progress = useMemo(() => assessProgress(program, state.logs, state.completed, lang), [program, state.logs, state.completed, lang])

  const adapt = () => {
    const next = adaptProgram(program, feedback)
    setState((s) => ({ ...s, program: next }))
    setMsg(en ? '✅ Plan updated: I recalibrated the volume based on your feedback.' : '✅ Piano aggiornato: ho ricalibrato il volume in base al tuo feedback.')
    setTimeout(() => setMsg(''), 4000)
  }

  const levelUp = () => {
    const q = en ? `Level up to "${progress.nextLevel}"? I'll generate a new mesocycle with more volume and advanced techniques. Your load history stays saved.` : `Salire a livello "${progress.nextLevel}"? Genero un nuovo mesociclo con più volume e tecniche avanzate. Lo storico dei pesi resta salvato.`
    if (!confirm(q)) return
    setState((s) => ({ ...s, program: levelUpProgram(program), completed: {} }))
    setMsg(en ? `🚀 Level updated to "${progress.nextLevel}"!` : `🚀 Livello aggiornato a "${progress.nextLevel}"!`)
    setTimeout(() => setMsg(''), 4000)
  }

  const resetAll = () => {
    if (!confirm(en ? 'Delete EVERYTHING (program, loads, notes, charts)? This cannot be undone.' : 'Cancellare TUTTO (programma, pesi, note, grafici)? Operazione irreversibile.')) return
    setState({ program: null, logs: {}, notes: {}, bodyweight: [], completed: {}, swaps: {}, lang })
  }

  const exportData = () => { exportBackup(state); markBackup() }
  const importData = (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result))
        if (!data || typeof data !== 'object') throw new Error('bad')
        if (!confirm(t('importConfirm'))) return
        setState((s) => ({ ...s, ...data }))
        setMsg(t('importDone')); setTimeout(() => setMsg(''), 4000)
      } catch { setMsg(t('importErr')); setTimeout(() => setMsg(''), 4000) }
    }
    r.readAsText(file)
  }

  return (
    <div className="fade">
      <div className="section-title">{t('language')}</div>
      <div className="card">
        <div className="opt-grid">
          {LANGUAGES.map((l) => (
            <button key={l.id} className={'opt' + (lang === l.id ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setLang(l.id)}>
              <span className="emoji">{l.flag}</span>
              <span className="lbl">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section-title">{t('levelProgress')}</div>
      <div className={'card' + (progress.suggestLevelUp ? ' levelup' : '')}>
        <div className="lu-msg">{progress.message}</div>
        {progress.suggestLevelUp && (
          <button className="btn" onClick={levelUp}>{t('levelUpTo')} "{progress.nextLevel}"</button>
        )}
      </div>

      <div className="section-title">{t('yourProfile')}</div>
      <div className="card">
        <Row k={t('name')} v={p.name || '—'} />
        <Row k={t('goal')} v={goalLabel(lang, p.goal)} />
        <Row k={t('experience')} v={expLabel(lang, p.experience)} />
        <Row k={t('equipment')} v={equipLabel(lang, p.equipment)} />
        <Row k={t('frequency')} v={`${p.daysPerWeek} ${t('daysPerWeekFull')}`} />
        <Row k={t('mesocycle')} v={`${program.weeks.length} ${t('weeksFull')}`} last />
      </div>

      <div id="perso-anchor" style={{ scrollMarginTop: 12 }} />
      <PersonalizationCard program={program} setState={setState} lang={lang} t={t} setMsg={setMsg} />

      <div className="section-title">{t('adaptTitle')}</div>
      <div className="card">
        <div className="sub">{t('adaptSub')}</div>
        {days.map((d, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{dayName(lang, d.name)}</div>
            <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[
                { id: 'facile', l: t('fbEasy') },
                { id: 'giusto', l: t('fbRight') },
                { id: 'duro', l: t('fbHard') },
              ].map((o) => (
                <button
                  key={o.id}
                  className={'opt' + (feedback[i] === o.id ? ' active' : '')}
                  style={{ alignItems: 'center', textAlign: 'center', padding: 12 }}
                  onClick={() => setFeedback((f) => ({ ...f, [i]: o.id }))}
                >
                  <span className="lbl" style={{ fontSize: 13 }}>{o.l}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn" disabled={Object.keys(feedback).length === 0} onClick={adapt}>
          {t('recalibrate')}
        </button>
        {msg && <div className="aigen" style={{ color: 'var(--good)' }}>{msg}</div>}
      </div>

      <CloudSyncCard state={state} setState={setState} t={t} setMsg={setMsg} />

      <AutoBackupCard state={state} t={t} setMsg={setMsg} />

      <div className="section-title">{t('backupTitle')}</div>
      <div className="card">
        <div className="sub">{t('backupSub')}</div>
        <div className="btn-row">
          <button className="btn secondary" onClick={exportData}>{t('exportBtn')}</button>
          <label className="btn secondary" style={{ textAlign: 'center', cursor: 'pointer' }}>
            {t('importBtn')}<input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={importData} />
          </label>
        </div>
      </div>

      <div className="section-title">{t('dataMgmt')}</div>
      <div className="card">
        <div className="sub">{t('dataSub')}</div>
        <button className="btn secondary" onClick={resetAll}>{t('resetAll')}</button>
      </div>
      <div style={{ height: 10 }} />
    </div>
  )
}

function CloudSyncCard({ state, setState, t, setMsg }) {
  const code = state.syncCode || ''
  const [pullCode, setPullCode] = useState('')
  const [busy, setBusy] = useState(false)
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const activate = async () => {
    setBusy(true)
    const c = code || newSyncCode()
    try {
      await cloudPush(c, sanitizeForBackup({ ...state, syncCode: c }))
      setState((s) => ({ ...s, syncCode: c })); markBackup()
      flash(t('cloudSaved'))
    } catch { flash(t('cloudErr')) } finally { setBusy(false) }
  }

  const restore = async () => {
    const c = pullCode.trim().toUpperCase()
    if (c.replace(/[^A-Z0-9-]/g, '').length < 6) { flash(t('cloudBadCode')); return }
    setBusy(true)
    try {
      const r = await cloudPull(c)
      if (!r) { flash(t('cloudNotFound')); return }
      if (!confirm(t('cloudRestoreConfirm'))) return
      setState((s) => ({ ...s, ...r.data, syncCode: c })); markBackup()
      setPullCode(''); flash(t('cloudRestored'))
    } catch { flash(t('cloudErr')) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="section-title">{t('cloudTitle')}</div>
      <div className="card">
        <div className="sub">{t('cloudSub')}</div>
        {code ? (
          <>
            <div className="cloud-code">{code}</div>
            <div className="cloud-note">🔐 {t('cloudSaveCode')}</div>
            <button className="btn" style={{ marginTop: 12 }} disabled={busy} onClick={activate}>☁️ {t('cloudPushNow')}</button>
          </>
        ) : (
          <button className="btn" disabled={busy} onClick={activate}>☁️ {t('cloudActivate')}</button>
        )}

        <div className="cloud-restore">
          <div className="sub" style={{ marginTop: 4 }}>{t('cloudRestoreTitle')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="in" placeholder="FITAI-XXXX-XXXX" value={pullCode} onChange={(e) => setPullCode(e.target.value)} style={{ textTransform: 'uppercase' }} />
            <button className="btn secondary" style={{ width: 'auto', padding: '0 18px' }} disabled={busy} onClick={restore}>{t('cloudRestoreBtn')}</button>
          </div>
        </div>
      </div>
    </>
  )
}

function AutoBackupCard({ state, t, setMsg }) {
  const supported = supportsAutoBackup()
  const [status, setStatus] = useState({ active: false, granted: false, name: null })
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (supported) backupStatus().then(setStatus) }, [supported])
  const refresh = () => backupStatus().then(setStatus)

  const enable = async () => {
    setBusy(true)
    try { const name = await enableAutoBackup(state); await refresh(); setMsg(t('autoBkOn') + ' ' + name); setTimeout(() => setMsg(''), 4000) }
    catch { /* annullato o negato */ }
    finally { setBusy(false) }
  }
  const resume = async () => {
    setBusy(true)
    try { if (await resumeAutoBackup(state)) { await refresh(); setMsg(t('autoBkResumed')); setTimeout(() => setMsg(''), 4000) } }
    finally { setBusy(false) }
  }
  const off = async () => { await disableAutoBackup(); await refresh() }

  return (
    <>
      <div className="section-title">{t('autoBkTitle')}</div>
      <div className="card">
        <div className="sub">{t('autoBkSub')}</div>
        {!supported ? (
          <div className="aigen" style={{ color: 'var(--muted)' }}>{t('autoBkUnsupported')}</div>
        ) : status.active && status.granted ? (
          <>
            <div className="aigen" style={{ color: 'var(--good)' }}>✅ {t('autoBkActive')} <b>{status.name}</b></div>
            <button className="btn secondary" style={{ marginTop: 10 }} onClick={off}>{t('autoBkStop')}</button>
          </>
        ) : status.active && !status.granted ? (
          <>
            <div className="aigen" style={{ color: 'var(--amber)' }}>⏸️ {t('autoBkPaused')}</div>
            <button className="btn" style={{ marginTop: 10 }} disabled={busy} onClick={resume}>{t('autoBkResume')}</button>
          </>
        ) : (
          <button className="btn" disabled={busy} onClick={enable}>💾 {t('autoBkEnable')}</button>
        )}
      </div>
    </>
  )
}

function PersonalizationCard({ program, setState, lang, t, setMsg }) {
  const pr = program.profile
  const [pref, setPref] = useState({
    priorityGroups: pr.priorityGroups || [],
    sessionTime: pr.sessionTime ?? null,
    injuries: pr.injuries || [],
    emphasis: pr.emphasis || 'equilibrato',
  })
  const en = lang === 'en'
  const toggle = (key, val, max) => setPref((s) => {
    const cur = s[key] || []
    if (cur.includes(val)) return { ...s, [key]: cur.filter((x) => x !== val) }
    if (max && cur.length >= max) return s
    return { ...s, [key]: [...cur, val] }
  })

  const apply = () => {
    const q = en
      ? 'Regenerate the plan with these settings? You keep your load history; the structure will change.'
      : 'Rigenerare la scheda con queste impostazioni? Mantieni lo storico dei pesi; la struttura cambierà.'
    if (!confirm(q)) return
    setState((s) => ({ ...s, program: buildProgram({ ...s.program.profile, ...pref }), completed: {}, swaps: {} }))
    setMsg(en ? '✅ Plan regenerated with your personalization.' : '✅ Scheda rigenerata con la tua personalizzazione.')
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <>
      <div className="section-title">{t('persoTitle')}</div>
      <div className="card">
        <div className="sub">{t('persoProfileSub')}</div>

        <div className="section-title" style={{ marginTop: 4 }}>{t('persoPriority')}</div>
        <div className="opt-grid opt-grid-3">
          {PRIORITY_GROUPS.map((g) => (
            <button key={g.id} className={'opt' + (pref.priorityGroups.includes(g.id) ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => toggle('priorityGroups', g.id, 2)}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('pm_' + g.id)}</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoTime')}</div>
        <div className="opt-grid opt-grid-4">
          {SESSION_TIMES.map((m) => (
            <button key={m} className={'opt' + (pref.sessionTime === m ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => setPref((s) => ({ ...s, sessionTime: s.sessionTime === m ? null : m }))}>
              <span className="lbl" style={{ fontSize: 11 }}>{m}{m === 75 ? '+' : ''}′</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoInjury')}</div>
        <div className="opt-grid opt-grid-3">
          {INJURY_OPTIONS.map((id) => (
            <button key={id} className={'opt' + (pref.injuries.includes(id) ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => toggle('injuries', id)}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('inj_' + id)}</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoEmphasis')}</div>
        <div className="opt-grid opt-grid-2">
          {EMPHASIS_OPTIONS.map((id) => (
            <button key={id} className={'opt' + (pref.emphasis === id ? ' active' : '')} style={{ textAlign: 'left', padding: 10 }} onClick={() => setPref((s) => ({ ...s, emphasis: id }))}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('emp_' + id)}</span>
            </button>
          ))}
        </div>

        <button className="btn" style={{ marginTop: 14 }} onClick={apply}>{t('persoApply')}</button>
      </div>
    </>
  )
}

function Row({ k, v, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  )
}
