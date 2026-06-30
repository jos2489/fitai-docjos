import React, { useEffect, useMemo, useRef, useState } from 'react'
import { logKey, dayKey, lastLogFor } from '../storage.js'
import { alternativesFor, suggestNextSet, EXERCISE_BY_ID } from '../engine.js'

// Beep con Web Audio API: nessun file audio, funziona offline.
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const beep = (t, freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'square'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t); osc.stop(t + 0.25)
    }
    const now = ctx.currentTime
    beep(now, 660); beep(now + 0.3, 660); beep(now + 0.6, 990)
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  } catch { /* audio non disponibile */ }
}

function videoUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('esecuzione corretta ' + name)
}

const swapKey = (week, dayIdx, exId) => `${week}-${dayIdx}-${exId}`

export default function Workout({ state, setState, week, dayIdx, onBack }) {
  const { program } = state
  const equip = program.profile.equipment || 'gym'
  const wk = program.weeks.find((w) => w.week === week)
  const day = wk.days[dayIdx]
  const dk = dayKey(week, dayIdx)
  const [note, setNote] = useState(state.notes[dk] || '')
  const [rest, setRest] = useState(null)

  const setLog = (exId, sets) => {
    setState((s) => ({ ...s, logs: { ...s.logs, [logKey(week, dayIdx, exId)]: sets } }))
  }
  const saveNote = (v) => {
    setNote(v)
    setState((s) => ({ ...s, notes: { ...s.notes, [dk]: v } }))
  }
  const swapExercise = (origId, newId) => {
    setState((s) => {
      const swaps = { ...(s.swaps || {}) }
      if (newId) swaps[swapKey(week, dayIdx, origId)] = newId
      else delete swaps[swapKey(week, dayIdx, origId)]
      return { ...s, swaps }
    })
  }
  const complete = () => {
    setState((s) => ({ ...s, completed: { ...s.completed, [dk]: new Date().toISOString() } }))
    onBack()
  }

  return (
    <div className="app fade">
      <div className="topbar">
        <button className="back" onClick={onBack}>‹ INDIETRO</button>
        <span className="scanlabel">{wk.deload ? '🌙 SCARICO' : `SETT. ${week}`}</span>
      </div>

      <div className="hero" style={{ marginBottom: 14 }}>
        <div className="glow" />
        <h1>{day.name}</h1>
        <p>{day.focus}</p>
      </div>

      {day.exercises.map((ex) => {
        const swappedId = (state.swaps || {})[swapKey(week, dayIdx, ex.id)]
        const display = swappedId ? EXERCISE_BY_ID[swappedId] : EXERCISE_BY_ID[ex.id]
        return (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            display={display}
            swapped={!!swappedId}
            alternatives={alternativesFor(ex.id, equip)}
            existing={state.logs[logKey(week, dayIdx, ex.id)]}
            last={lastLogFor(state.logs, week, dayIdx, ex.id)}
            onChange={(sets) => setLog(ex.id, sets)}
            onRest={() => setRest(ex.rest)}
            onSwap={(newId) => swapExercise(ex.id, newId)}
          />
        )
      })}

      <div className="card">
        <h2>📝 NOTE SEDUTA</h2>
        <textarea
          className="in"
          placeholder="Come ti sei sentito? Dolori, energia, tecnica, regolazioni macchine..."
          value={note}
          onChange={(e) => saveNote(e.target.value)}
        />
      </div>

      <button className="btn" onClick={complete}>✓ COMPLETA ALLENAMENTO</button>
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
        <span className="rest-time">{left === 0 ? '✅ GO!' : `⏱ ${mm}:${ss}`}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setLeft((l) => l + 15)}>+15s</button>
          <button onClick={onClose}>{left === 0 ? 'CHIUDI' : 'SALTA'}</button>
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({ ex, display, swapped, alternatives, existing, last, onChange, onRest, onSwap }) {
  const init = useMemo(() => {
    if (existing && existing.length) return existing
    return Array.from({ length: ex.sets }, (_, i) => {
      const prev = last && last[i]
      return { weight: prev ? prev.weight : '', reps: prev ? prev.reps : '' }
    })
  }, [])
  const [sets, setSets] = useState(init)
  const [showAlts, setShowAlts] = useState(false)

  const apply = (next) => { setSets(next); onChange(next) }
  const setField = (i, field, val) => apply(sets.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))
  const addSet = () => apply([...sets, { weight: '', reps: '' }])
  const removeSet = (i) => apply(sets.filter((_, idx) => idx !== i))

  const suggestion = useMemo(() => suggestNextSet(last, ex), [last, ex])

  return (
    <div className="ex">
      <div className="ex-head">
        <div>
          <div className="name">{display.name}{swapped && <span className="swapped-tag">↺ alt</span>}</div>
          <div className="muscle">{display.muscle}</div>
          <div className="ex-prescription">
            {ex.sets} × {ex.repsLow}-{ex.repsHigh} REP · RIR {ex.rir} · REST {ex.rest}s
          </div>
          {last && (
            <div className="lastlog">
              ⏮ Ultima: {last.map((s) => `${s.weight || '–'}×${s.reps || '–'}`).join(' ')}
            </div>
          )}
        </div>
        <a className="video-btn" href={videoUrl(display.name)} target="_blank" rel="noreferrer">▶ TECNICA</a>
      </div>

      <div className="suggestion">💡 {suggestion.text}</div>

      <div className="set-head"><span>#</span><span>KG</span><span>REP</span><span /></div>
      {sets.map((s, i) => (
        <div className="set-row" key={i}>
          <div className="sidx">{i + 1}</div>
          <input inputMode="decimal" placeholder={suggestion.weight != null ? String(suggestion.weight) : (last && last[i] ? String(last[i].weight) : 'kg')}
            value={s.weight} onChange={(e) => setField(i, 'weight', e.target.value)} />
          <input inputMode="numeric" placeholder={suggestion.reps != null ? String(suggestion.reps) : 'rep'}
            value={s.reps} onChange={(e) => setField(i, 'reps', e.target.value)} />
          <button className="rm" onClick={() => removeSet(i)} aria-label="Rimuovi serie">×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="addset" onClick={addSet}>+ SERIE</button>
        <button className="addset rest" onClick={onRest}>⏱ REST {ex.rest}s</button>
        <button className="addset alt" onClick={() => setShowAlts((v) => !v)}>🔄 CAMBIA</button>
      </div>

      {showAlts && (
        <div className="alts fade">
          <div className="alts-title">Macchina occupata o assente? Scegli un'alternativa per lo stesso muscolo:</div>
          {swapped && (
            <button className="alt-opt restore" onClick={() => { onSwap(null); setShowAlts(false) }}>
              ↩ Ripristina esercizio originale
            </button>
          )}
          {alternatives.length === 0 && <div className="alts-empty">Nessuna alternativa disponibile con la tua attrezzatura.</div>}
          {alternatives.map((a) => (
            <button key={a.id} className="alt-opt" onClick={() => { onSwap(a.id); setShowAlts(false) }}>
              <span>{a.name}</span>
              <span className="alt-type">{a.type === 'compound' ? 'multiart.' : 'isolam.'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
