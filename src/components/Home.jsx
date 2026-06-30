import React, { useState } from 'react'
import { dayKey } from '../storage.js'
import { buildProgram } from '../engine.js'

export default function Home({ state, setState, onOpenDay }) {
  const { program, completed } = state
  const [week, setWeek] = useState(() => firstIncompleteWeek(program, completed))
  const wk = program.weeks.find((w) => w.week === week) || program.weeks[0]

  const doneCount = wk.days.filter((_, i) => completed[dayKey(week, i)]).length
  const totalDays = program.weeks.length * program.weeks[0].days.length
  const totalDone = Object.keys(completed).length
  const progressPct = Math.round((totalDone / totalDays) * 100)

  return (
    <div className="fade">
      <div className="hero hero-home">
        <div className="glow" />
        <img className="mascot-sm" src="/mascot.webp" alt="Doc Jos" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Ciao{program.profile.name ? `, ${program.profile.name}` : ''} 👋</h1>
          <p>{labelGoal(program.profile.goal)} · {program.profile.daysPerWeek} giorni/sett · {program.weeks.length} settimane</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Split: <b style={{ color: 'var(--text)' }}>{program.splitName}</b></p>
          <div className="aigen"><span className="pulse" /> Programma generato dall'AI · {progressPct}% completato</div>
        </div>
      </div>

      <div className="section-title">Settimana</div>
      <div className="weeks">
        {program.weeks.map((w) => (
          <button
            key={w.week}
            className={'week-pill' + (w.week === week ? ' active' : '') + (w.deload ? ' deload' : '')}
            onClick={() => setWeek(w.week)}
          >
            {w.deload ? '🌙 Scarico' : `Sett. ${w.week}`}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: 'var(--card-2)' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          💡 {wk.note}
        </div>
      </div>

      <div className="section-title">Giornate · {doneCount}/{wk.days.length} fatte</div>
      {wk.days.map((d, i) => {
        const done = completed[dayKey(week, i)]
        return (
          <button key={i} className="day" onClick={() => onOpenDay(week, i)}>
            <div className="meta">
              <div className="name">{d.name}</div>
              <div className="focus">{d.focus} · {d.exercises.length} esercizi</div>
            </div>
            <div className="right">
              {wk.deload && <span className="badge deload">scarico</span>}
              {done && <span className="badge done">✓ fatto</span>}
              <span className="chev">›</span>
            </div>
          </button>
        )
      })}

      <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => regenerate(state, setState)}>
        🔄 Rigenera programma
      </button>
    </div>
  )
}

function firstIncompleteWeek(program, completed) {
  for (const w of program.weeks) {
    const allDone = w.days.every((_, i) => completed[dayKey(w.week, i)])
    if (!allDone) return w.week
  }
  return program.weeks[program.weeks.length - 1].week
}

function regenerate(state, setState) {
  if (!confirm('Vuoi rigenerare il programma? Manterrai lo storico dei pesi registrati ma la struttura potrebbe cambiare.')) return
  setState((s) => ({ ...s, program: buildProgram(s.program.profile), completed: {} }))
}

function labelGoal(g) {
  return { ipertrofia: '💪 Ipertrofia', forza: '🏋️ Forza', dimagrimento: '🔥 Dimagrimento', ricomp: '⚖️ Ricomposizione' }[g] || g
}
