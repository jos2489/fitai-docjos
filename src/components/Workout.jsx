import React, { useEffect, useMemo, useRef, useState } from 'react'
import { logKey, dayKey, lastLogFor } from '../storage.js'

// Beep con Web Audio API: nessun file audio, funziona offline.
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const beep = (t, freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t); osc.stop(t + 0.25)
    }
    const now = ctx.currentTime
    beep(now, 880); beep(now + 0.3, 880); beep(now + 0.6, 1320)
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  } catch { /* audio non disponibile */ }
}

function videoUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('esecuzione corretta ' + name)
}

export default function Workout({ state, setState, week, dayIdx, onBack }) {
  const { program } = state
  const wk = program.weeks.find((w) => w.week === week)
  const day = wk.days[dayIdx]
  const dk = dayKey(week, dayIdx)
  const [note, setNote] = useState(state.notes[dk] || '')
  const [rest, setRest] = useState(null) // secondi totali del recupero in corso

  const setLog = (exId, sets) => {
    setState((s) => ({ ...s, logs: { ...s.logs, [logKey(week, dayIdx, exId)]: sets } }))
  }
  const saveNote = (v) => {
    setNote(v)
    setState((s) => ({ ...s, notes: { ...s.notes, [dk]: v } }))
  }
  const complete = () => {
    setState((s) => ({ ...s, completed: { ...s.completed, [dk]: new Date().toISOString() } }))
    onBack()
  }

  return (
    <div className="app fade">
      <div className="topbar">
        <button className="back" onClick={onBack}>‹ Indietro</button>
        <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>
          {wk.deload ? '🌙 Scarico' : `Sett. ${week}`}
        </span>
      </div>

      <div className="hero" style={{ marginBottom: 14 }}>
        <div className="glow" />
        <h1>{day.name}</h1>
        <p>{day.focus}</p>
      </div>

      {day.exercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          ex={ex}
          existing={state.logs[logKey(week, dayIdx, ex.id)]}
          last={lastLogFor(state.logs, week, dayIdx, ex.id)}
          onChange={(sets) => setLog(ex.id, sets)}
          onRest={() => setRest(ex.rest)}
        />
      ))}

      <div className="card">
        <h2>📝 Note seduta</h2>
        <textarea
          className="in"
          placeholder="Come ti sei sentito? Dolori, energia, tecnica, regolazioni macchine..."
          value={note}
          onChange={(e) => saveNote(e.target.value)}
        />
      </div>

      <button className="btn" onClick={complete}>✓ Completa allenamento</button>
      <div style={{ height: 20 }} />

      {rest != null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}
    </div>
  )
}

function RestTimer({ seconds, onClose }) {
  const [left, setLeft] = useState(seconds)
  const ref = useRef(null)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(ref.current); playBeep(); return 0 }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = ((seconds - left) / seconds) * 100
  return (
    <div className="rest-bar">
      <div className="rest-fill" style={{ width: pct + '%' }} />
      <div className="rest-inner">
        <span className="rest-time">{left === 0 ? '✅ Vai!' : `⏱ ${mm}:${ss}`}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setLeft((l) => l + 15)}>+15s</button>
          <button onClick={onClose}>{left === 0 ? 'Chiudi' : 'Salta'}</button>
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({ ex, existing, last, onChange, onRest }) {
  const init = useMemo(() => {
    if (existing && existing.length) return existing
    return Array.from({ length: ex.sets }, (_, i) => {
      const prev = last && last[i]
      return { weight: prev ? prev.weight : '', reps: prev ? prev.reps : '' }
    })
  }, [])
  const [sets, setSets] = useState(init)

  const apply = (next) => { setSets(next); onChange(next) }
  const setField = (i, field, val) => apply(sets.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))
  const addSet = () => apply([...sets, { weight: '', reps: '' }])
  const removeSet = (i) => apply(sets.filter((_, idx) => idx !== i))

  return (
    <div className="ex">
      <div className="ex-head">
        <div>
          <div className="name">{ex.name}</div>
          <div className="muscle">{ex.muscle}</div>
          <div className="ex-prescription">
            {ex.sets} × {ex.repsLow}-{ex.repsHigh} rip · RIR {ex.rir} · recupero {ex.rest}s
          </div>
          {last && (
            <div className="lastlog">
              ⏮ Ultima volta: {last.map((s) => `${s.weight || '–'}kg×${s.reps || '–'}`).join('  ')}
            </div>
          )}
        </div>
        <a className="video-btn" href={videoUrl(ex.name)} target="_blank" rel="noreferrer">▶ Tecnica</a>
      </div>

      <div className="set-head"><span>#</span><span>Kg</span><span>Rip</span><span /></div>
      {sets.map((s, i) => (
        <div className="set-row" key={i}>
          <div className="sidx">{i + 1}</div>
          <input inputMode="decimal" placeholder={last && last[i] ? String(last[i].weight) : 'kg'}
            value={s.weight} onChange={(e) => setField(i, 'weight', e.target.value)} />
          <input inputMode="numeric" placeholder={last && last[i] ? String(last[i].reps) : 'rip'}
            value={s.reps} onChange={(e) => setField(i, 'reps', e.target.value)} />
          <button className="rm" onClick={() => removeSet(i)} aria-label="Rimuovi serie">×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="addset" onClick={addSet}>+ Serie</button>
        <button className="addset rest" onClick={onRest}>⏱ Recupero {ex.rest}s</button>
      </div>
    </div>
  )
}
