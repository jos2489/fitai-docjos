import React, { useMemo, useState } from 'react'
import { adaptProgram, assessProgress, levelUpProgram } from '../engine.js'
import { useLang, LANGUAGES } from '../i18n.jsx'

export default function Profile({ state, setState }) {
  const { t, lang, setLang } = useLang()
  const { program } = state
  const p = program.profile
  const days = program.weeks[0].days
  const [feedback, setFeedback] = useState({})
  const [msg, setMsg] = useState('')

  const progress = useMemo(() => assessProgress(program, state.logs, state.completed), [program, state.logs, state.completed])

  const adapt = () => {
    const next = adaptProgram(program, feedback)
    setState((s) => ({ ...s, program: next }))
    setMsg('✅ Piano aggiornato: ho ricalibrato il volume in base al tuo feedback.')
    setTimeout(() => setMsg(''), 4000)
  }

  const levelUp = () => {
    if (!confirm(`Salire a livello "${progress.nextLevel}"? Genero un nuovo mesociclo con più volume e tecniche avanzate. Lo storico dei pesi resta salvato.`)) return
    setState((s) => ({ ...s, program: levelUpProgram(program), completed: {} }))
    setMsg(`🚀 Livello aggiornato a "${progress.nextLevel}"!`)
    setTimeout(() => setMsg(''), 4000)
  }

  const resetAll = () => {
    if (!confirm('Cancellare TUTTO (programma, pesi, note, grafici)? Operazione irreversibile.')) return
    setState({ program: null, logs: {}, notes: {}, bodyweight: [], completed: {}, swaps: {} })
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
        <Row k={t('goal')} v={labelGoal(p.goal)} />
        <Row k={t('experience')} v={cap(p.experience)} />
        <Row k={t('equipment')} v={labelEquip(p.equipment)} />
        <Row k={t('frequency')} v={`${p.daysPerWeek} ${t('daysPerWeekFull')}`} />
        <Row k={t('mesocycle')} v={`${program.weeks.length} ${t('weeksFull')}`} last />
      </div>

      <div className="section-title">{t('adaptTitle')}</div>
      <div className="card">
        <div className="sub">{t('adaptSub')}</div>
        {days.map((d, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{d.name}</div>
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

      <div className="section-title">{t('dataMgmt')}</div>
      <div className="card">
        <div className="sub">{t('dataSub')}</div>
        <button className="btn secondary" onClick={resetAll}>{t('resetAll')}</button>
      </div>
      <div style={{ height: 10 }} />
    </div>
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const labelGoal = (g) => ({ ipertrofia: '💪 Ipertrofia', forza: '🏋️ Forza', dimagrimento: '🔥 Dimagrimento', ricomp: '⚖️ Ricomposizione' }[g] || g)
const labelEquip = (e) => ({ gym: '🏟️ Palestra completa', dumbbell: '🏠 Manubri / casa', body: '🤸 Corpo libero' }[e] || e)
