import React, { useState } from 'react'
import { buildProgram, GOALS, EXPERIENCES, EQUIPMENTS, PRIORITY_GROUPS, INJURY_OPTIONS, EMPHASIS_OPTIONS, SESSION_TIMES } from '../engine.js'
import { useLang, LANGUAGES, goalLabel, expLabel, expDesc, equipLabel } from '../i18n.jsx'

// Wizard di profilazione del cliente: l'Ai userà queste risposte per costruire
// il programma più adatto secondo le evidenze scientifiche.
export default function Onboarding({ onCreate, onRestore }) {
  const { t, lang, setLang } = useLang()
  const [step, setStep] = useState(0)
  const [restoreErr, setRestoreErr] = useState('')

  const restoreBackup = (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result))
        if (!data || !data.program) throw new Error('bad')
        onRestore(data)
      } catch { setRestoreErr(t('restoreErr')); setTimeout(() => setRestoreErr(''), 4000) }
    }
    r.readAsText(file)
  }
  const [p, setP] = useState({
    name: '', sex: 'm', age: 28, weight: '', height: '',
    goal: 'ipertrofia', experience: 'intermedio', equipment: 'gym',
    daysPerWeek: 4, weeks: 4,
    // personalizzazione opzionale (vuota = scheda standard)
    priorityGroups: [], sessionTime: null, injuries: [], emphasis: 'equilibrato',
  })
  const set = (patch) => setP((s) => ({ ...s, ...patch }))
  const toggleIn = (key, val, max) => setP((s) => {
    const cur = s[key] || []
    if (cur.includes(val)) return { ...s, [key]: cur.filter((x) => x !== val) }
    if (max && cur.length >= max) return s
    return { ...s, [key]: [...cur, val] }
  })

  const steps = [
    // 0 - intro + nome
    (
      <div className="card fade">
        <div className="hero hero-welcome">
          <div className="glow" />
          <img className="mascot" src="/mascot.webp" alt="Doc Jos" />
          <div className="welcome-text">
            <h1 dangerouslySetInnerHTML={{ __html: t('welcomeTitle') }} />
            <p dangerouslySetInnerHTML={{ __html: t('welcomeText') }} />
          </div>
        </div>
        <label className="field">
          <span>{t('yourName')}</span>
          <input className="in" value={p.name} placeholder={t('namePh')} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <div className="section-title" style={{ margin: '4px 4px 8px' }}>{t('sex')}</div>
        <div className="opt-grid">
          {[{ id: 'm', l: t('male') }, { id: 'f', l: t('female') }].map((o) => (
            <button key={o.id} className={'opt' + (p.sex === o.id ? ' active' : '')} onClick={() => set({ sex: o.id })} style={{ alignItems: 'center', textAlign: 'center' }}>
              <span className="lbl">{o.l}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>{t('age')}</span>
            <input className="in" inputMode="numeric" value={p.age} onChange={(e) => set({ age: e.target.value })} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>{t('weightKg')}</span>
            <input className="in" inputMode="decimal" placeholder="75" value={p.weight} onChange={(e) => set({ weight: e.target.value })} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>{t('heightCm')}</span>
            <input className="in" inputMode="numeric" placeholder="178" value={p.height} onChange={(e) => set({ height: e.target.value })} />
          </label>
        </div>
        <div className="restore-row">
          <span>{t('restoreQ')}</span>
          <label className="restore-btn">
            {t('restoreBtn')}
            <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={restoreBackup} />
          </label>
        </div>
        {restoreErr && <div className="aigen" style={{ color: 'var(--bad)' }}>{restoreErr}</div>}
      </div>
    ),
    // 1 - obiettivo
    (
      <div className="card fade">
        <h2>{t('goalQ')}</h2>
        <div className="sub">{t('goalSub')}</div>
        <div className="opt-grid">
          {GOALS.map((g) => (
            <button key={g.id} className={'opt' + (p.goal === g.id ? ' active' : '')} onClick={() => set({ goal: g.id })}>
              <span className="emoji">{g.emoji}</span>
              <span className="lbl">{goalLabel(lang, g.id)}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 2 - esperienza
    (
      <div className="card fade">
        <h2>{t('expQ')}</h2>
        <div className="sub">{t('expSub')}</div>
        <div className="opt-grid">
          {EXPERIENCES.map((g) => (
            <button key={g.id} className={'opt' + (p.experience === g.id ? ' active' : '')} onClick={() => set({ experience: g.id })}>
              <span className="lbl">{expLabel(lang, g.id)}</span>
              <span className="desc">{expDesc(lang, g.id)}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 3 - attrezzatura
    (
      <div className="card fade">
        <h2>{t('whereQ')}</h2>
        <div className="sub">{t('whereSub')}</div>
        <div className="opt-grid">
          {EQUIPMENTS.map((g) => (
            <button key={g.id} className={'opt' + (p.equipment === g.id ? ' active' : '')} onClick={() => set({ equipment: g.id })}>
              <span className="emoji">{g.emoji}</span>
              <span className="lbl">{equipLabel(lang, g.id)}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 4 - frequenza + durata
    (
      <div className="card fade">
        <h2>{t('freqTitle')}</h2>
        <div className="sub">{t('freqSub')}</div>
        <div className="section-title">{t('daysWeek')}</div>
        <Stepper value={p.daysPerWeek} min={2} max={6} unit={t('daysUnit')} onChange={(v) => set({ daysPerWeek: v })} />
        <div className="section-title">{t('mesoTitle')}</div>
        <Stepper value={p.weeks} min={2} max={12} unit={t('weeksUnit')} onChange={(v) => set({ weeks: v })} />
        <div className="aigen"><span className="pulse" /> {t('deloadHint')}</div>
      </div>
    ),
    // 5 - personalizzazione (opzionale / saltabile)
    (
      <div className="card fade">
        <h2>{t('persoTitle')}</h2>
        <div className="sub">{t('persoSub')}</div>

        <div className="section-title">{t('persoPriority')}</div>
        <div className="opt-grid opt-grid-3">
          {PRIORITY_GROUPS.map((g) => (
            <button key={g.id} className={'opt' + ((p.priorityGroups || []).includes(g.id) ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => toggleIn('priorityGroups', g.id, 2)}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('pm_' + g.id)}</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoTime')}</div>
        <div className="opt-grid opt-grid-4">
          {SESSION_TIMES.map((m) => (
            <button key={m} className={'opt' + (p.sessionTime === m ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => set({ sessionTime: p.sessionTime === m ? null : m })}>
              <span className="lbl" style={{ fontSize: 11 }}>{m}{m === 75 ? '+' : ''}′</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoInjury')}</div>
        <div className="opt-grid opt-grid-3">
          {INJURY_OPTIONS.map((id) => (
            <button key={id} className={'opt' + ((p.injuries || []).includes(id) ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 10 }} onClick={() => toggleIn('injuries', id)}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('inj_' + id)}</span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('persoEmphasis')}</div>
        <div className="opt-grid opt-grid-2">
          {EMPHASIS_OPTIONS.map((id) => (
            <button key={id} className={'opt' + (p.emphasis === id ? ' active' : '')} style={{ textAlign: 'left', padding: 10 }} onClick={() => set({ emphasis: id })}>
              <span className="lbl" style={{ fontSize: 10 }}>{t('emp_' + id)}</span>
            </button>
          ))}
        </div>
      </div>
    ),
  ]

  const last = step === steps.length - 1
  const generate = () => onCreate(buildProgram(p))

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">⚡</span>
          <span>Fit<span className="ai">Ai</span><small className="byline">by Doc Jos</small></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="lang-toggle" onClick={() => setLang(lang === 'it' ? 'en' : 'it')}>
            {LANGUAGES.find((l) => l.id === lang)?.flag} {lang.toUpperCase()}
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{step + 1}/{steps.length}</span>
        </div>
      </div>
      {steps[step]}
      <div className="btn-row">
        {step > 0 && <button className="btn secondary" onClick={() => setStep((s) => s - 1)}>{t('goBack')}</button>}
        {!last && <button className="btn" onClick={() => setStep((s) => s + 1)}>{t('continue')}</button>}
        {last && <button className="btn" onClick={generate}>{t('genProgram')}</button>}
      </div>
    </div>
  )
}

function Stepper({ value, min, max, unit, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <div className="val" style={{ textAlign: 'center' }}>{value}<small>{unit}</small></div>
      <button onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}
