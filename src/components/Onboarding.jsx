import React, { useState } from 'react'
import { buildProgram, GOALS, EXPERIENCES, EQUIPMENTS } from '../engine.js'

// Wizard di profilazione del cliente: l'Ai userà queste risposte per costruire
// il programma più adatto secondo le evidenze scientifiche.
export default function Onboarding({ onCreate }) {
  const [step, setStep] = useState(0)
  const [p, setP] = useState({
    name: '', sex: 'm', age: 28, weight: '', height: '',
    goal: 'ipertrofia', experience: 'intermedio', equipment: 'gym',
    daysPerWeek: 4, weeks: 4,
  })
  const set = (patch) => setP((s) => ({ ...s, ...patch }))

  const steps = [
    // 0 - intro + nome
    (
      <div className="card fade">
        <div className="hero">
          <div className="glow" />
          <h1>Ciao 👋 Sono FitAi</h1>
          <p>L'assistente di allenamento creato da <b style={{ color: 'var(--text)' }}>Doc Jos</b>. Dimmi qualcosa su di te: costruirò un programma su misura seguendo le evidenze scientifiche e lo aggiornerò man mano che progredisci.</p>
        </div>
        <label className="field">
          <span>Come ti chiami?</span>
          <input className="in" value={p.name} placeholder="Il tuo nome" onChange={(e) => set({ name: e.target.value })} />
        </label>
        <div className="section-title" style={{ margin: '4px 4px 8px' }}>Sesso</div>
        <div className="opt-grid">
          {[{ id: 'm', l: 'Uomo' }, { id: 'f', l: 'Donna' }].map((o) => (
            <button key={o.id} className={'opt' + (p.sex === o.id ? ' active' : '')} onClick={() => set({ sex: o.id })} style={{ alignItems: 'center', textAlign: 'center' }}>
              <span className="lbl">{o.l}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Età</span>
            <input className="in" inputMode="numeric" value={p.age} onChange={(e) => set({ age: e.target.value })} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Peso (kg)</span>
            <input className="in" inputMode="decimal" placeholder="es. 75" value={p.weight} onChange={(e) => set({ weight: e.target.value })} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Altezza (cm)</span>
            <input className="in" inputMode="numeric" placeholder="es. 178" value={p.height} onChange={(e) => set({ height: e.target.value })} />
          </label>
        </div>
      </div>
    ),
    // 1 - obiettivo
    (
      <div className="card fade">
        <h2>Qual è il tuo obiettivo?</h2>
        <div className="sub">Determina rep range, intensità e recuperi.</div>
        <div className="opt-grid">
          {GOALS.map((g) => (
            <button key={g.id} className={'opt' + (p.goal === g.id ? ' active' : '')} onClick={() => set({ goal: g.id })}>
              <span className="emoji">{g.emoji}</span>
              <span className="lbl">{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 2 - esperienza
    (
      <div className="card fade">
        <h2>Quanta esperienza hai?</h2>
        <div className="sub">Regola il volume di partenza (zona MEV→MAV).</div>
        <div className="opt-grid">
          {EXPERIENCES.map((g) => (
            <button key={g.id} className={'opt' + (p.experience === g.id ? ' active' : '')} onClick={() => set({ experience: g.id })}>
              <span className="lbl">{g.label}</span>
              <span className="desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 3 - attrezzatura
    (
      <div className="card fade">
        <h2>Dove ti alleni?</h2>
        <div className="sub">Sceglierò solo esercizi che puoi davvero eseguire.</div>
        <div className="opt-grid">
          {EQUIPMENTS.map((g) => (
            <button key={g.id} className={'opt' + (p.equipment === g.id ? ' active' : '')} onClick={() => set({ equipment: g.id })}>
              <span className="emoji">{g.emoji}</span>
              <span className="lbl">{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 4 - frequenza + durata
    (
      <div className="card fade">
        <h2>Frequenza e durata</h2>
        <div className="sub">Quante volte a settimana e per quante settimane.</div>
        <div className="section-title">Giorni a settimana</div>
        <Stepper value={p.daysPerWeek} min={2} max={6} unit="giorni / sett." onChange={(v) => set({ daysPerWeek: v })} />
        <div className="section-title">Durata del mesociclo</div>
        <Stepper value={p.weeks} min={2} max={12} unit="settimane" onChange={(v) => set({ weeks: v })} />
        <div className="aigen"><span className="pulse" /> L'AI inserirà automaticamente una settimana di scarico se servirà.</div>
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
        <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{step + 1}/{steps.length}</span>
      </div>
      {steps[step]}
      <div className="btn-row">
        {step > 0 && <button className="btn secondary" onClick={() => setStep((s) => s - 1)}>Indietro</button>}
        {!last && <button className="btn" onClick={() => setStep((s) => s + 1)}>Continua</button>}
        {last && <button className="btn" onClick={generate}>✨ Genera il mio programma</button>}
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
