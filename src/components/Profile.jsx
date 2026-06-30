import React, { useMemo, useState } from 'react'
import { adaptProgram, assessProgress, levelUpProgram } from '../engine.js'

export default function Profile({ state, setState }) {
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
      <div className="section-title">🧠 Livello e progressi</div>
      <div className={'card' + (progress.suggestLevelUp ? ' levelup' : '')}>
        <div className="lu-msg">{progress.message}</div>
        {progress.suggestLevelUp && (
          <button className="btn" onClick={levelUp}>🚀 Sali a livello "{progress.nextLevel}"</button>
        )}
      </div>

      <div className="section-title">Il tuo profilo</div>
      <div className="card">
        <Row k="Nome" v={p.name || '—'} />
        <Row k="Obiettivo" v={labelGoal(p.goal)} />
        <Row k="Esperienza" v={cap(p.experience)} />
        <Row k="Attrezzatura" v={labelEquip(p.equipment)} />
        <Row k="Frequenza" v={`${p.daysPerWeek} giorni / settimana`} />
        <Row k="Mesociclo" v={`${program.weeks.length} settimane`} last />
      </div>

      <div className="section-title">🤖 Adatta il piano con l'AI</div>
      <div className="card">
        <div className="sub">Dimmi com'è andata ogni tipo di seduta: aggiusterò il volume di conseguenza (più serie se è troppo facile, meno se è troppo dura).</div>
        {days.map((d, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{d.name}</div>
            <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[
                { id: 'facile', l: '😎 Facile' },
                { id: 'giusto', l: '👍 Giusto' },
                { id: 'duro', l: '🥵 Duro' },
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
          ✨ Ricalibra il programma
        </button>
        {msg && <div className="aigen" style={{ color: 'var(--good)' }}>{msg}</div>}
      </div>

      <div className="section-title">Gestione dati</div>
      <div className="card">
        <div className="sub">I tuoi dati restano salvati solo su questo dispositivo.</div>
        <button className="btn secondary" onClick={resetAll}>🗑️ Reset completo</button>
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
