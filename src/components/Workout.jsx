import React, { useEffect, useMemo, useRef, useState } from 'react'
import { logKey, dayKey, lastLogFor } from '../storage.js'
import { alternativesFor, suggestNextSet, EXERCISE_BY_ID, TECHNIQUES, exName, muscleName, dayName, focusName, bestTopBefore } from '../engine.js'
import { useLang } from '../i18n.jsx'

// Voce "GO GO GO" con Web Speech API (offline sui più diffusi, gratis).
function speakGo() {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance('Go! Go! Go!')
    u.rate = 1.15; u.pitch = 1; u.volume = 1
    synth.speak(u)
  } catch { /* voce non disponibile */ }
}

// Suono di fine pausa con Web Audio API: nessun file audio, funziona offline.
// 3 bip in salita (ritmo GO-GO-GO) + un tono lungo finale.
function playGo() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    if (ctx.state === 'suspended') ctx.resume()
    const tone = (t, freq, dur, type = 'square', peak = 0.35) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = type; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t); osc.stop(t + dur + 0.02)
    }
    const now = ctx.currentTime
    tone(now, 660, 0.22); tone(now + 0.28, 660, 0.22); tone(now + 0.56, 880, 0.22)
    // tono lungo finale (più prolungato)
    tone(now + 0.9, 990, 1.1, 'sawtooth', 0.4)
    tone(now + 0.9, 660, 1.1, 'square', 0.18)
    speakGo()
    if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400])
  } catch { /* audio non disponibile */ }
}

function videoUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('esecuzione corretta ' + name)
}

const swapKey = (week, dayIdx, exId) => `${week}-${dayIdx}-${exId}`

// Autoregolazione giornaliera (RIR/RPE): adatta volume e intensità del giorno
// in base a come ti senti, restando nelle zone corrette.
const READINESS_ADJ = {
  scarico: { sets: -1, rir: +1, label: '🪫 Giornata storta: tolgo una serie per esercizio e alzo il RIR (carichi più cauti) per gestire la fatica e non scavare buche.' },
  normale: { sets: 0, rir: 0, label: null },
  carico: { sets: 0, rir: -1, label: '🔋 Giornata TOP: RIR più basso, puoi avvicinarti di più al cedimento mantenendo la tecnica. Se te la senti, aggiungi una serie.' },
}
const READINESS_OPTS = [
  { id: 'scarico', emoji: '🪫', key: 'tired' },
  { id: 'normale', emoji: '😐', key: 'normal' },
  { id: 'carico', emoji: '🔋', key: 'charged' },
]

export default function Workout({ state, setState, week, dayIdx, onBack }) {
  const { t, lang } = useLang()
  const { program } = state
  const equip = program.profile.equipment || 'gym'
  const wk = program.weeks.find((w) => w.week === week)
  const day = wk.days[dayIdx]
  const dk = dayKey(week, dayIdx)
  const [note, setNote] = useState(state.notes[dk] || '')
  const [rest, setRest] = useState(null)
  const readiness = (state.readiness || {})[dk] || null
  const adj = READINESS_ADJ[readiness] || READINESS_ADJ.normale
  const setReadiness = (level) => setState((s) => ({ ...s, readiness: { ...(s.readiness || {}), [dk]: level } }))

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
        <button className="back" onClick={onBack}>{t('back')}</button>
        <span className="scanlabel">{wk.deload ? t('deloadPill') : `${t('weekShort')} ${week}`}</span>
      </div>

      <div className="hero" style={{ marginBottom: 14 }}>
        <div className="glow" />
        <h1>{dayName(lang, day.name)}</h1>
        <p>{focusName(lang, day.focus)}</p>
      </div>

      <div className="card readiness">
        <h2>{t('feelToday')}</h2>
        <div className="sub">{t('feelSub')}</div>
        <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {READINESS_OPTS.map((o) => (
            <button key={o.id} className={'opt' + (readiness === o.id ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setReadiness(o.id)}>
              <span className="emoji">{o.emoji}</span>
              <span className="lbl">{t(o.key)}</span>
            </button>
          ))}
        </div>
        {adj.label && <div className="adjust-banner fade">{adj.label}</div>}
      </div>

      {day.exercises.map((ex) => {
        const swappedId = (state.swaps || {})[swapKey(week, dayIdx, ex.id)]
        const display = swappedId ? EXERCISE_BY_ID[swappedId] : EXERCISE_BY_ID[ex.id]
        const adjEx = { ...ex, sets: Math.max(2, ex.sets + adj.sets), rir: Math.max(0, ex.rir + adj.rir) }
        return (
          <ExerciseCard
            key={ex.id + '-' + readiness}
            ex={adjEx}
            display={display}
            swapped={!!swappedId}
            alternatives={alternativesFor(ex.id, equip)}
            existing={state.logs[logKey(week, dayIdx, ex.id)]}
            last={lastLogFor(state.logs, week, dayIdx, ex.id)}
            onChange={(sets) => setLog(ex.id, sets)}
            onRest={() => setRest(ex.rest)}
            onSwap={(newId) => swapExercise(ex.id, newId)}
            prevBest={bestTopBefore(program, state.logs, ex.id, week)}
          />
        )
      })}

      <div className="card">
        <h2>{t('notesTitle')}</h2>
        <textarea
          className="in"
          placeholder={t('notesPh')}
          value={note}
          onChange={(e) => saveNote(e.target.value)}
        />
      </div>

      <button className="btn" onClick={complete}>{t('completeWorkout')}</button>
      <div style={{ height: 20 }} />

      {rest != null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}
    </div>
  )
}

function RestTimer({ seconds, onClose }) {
  const { t } = useLang()
  const [left, setLeft] = useState(seconds)
  const [flash, setFlash] = useState(false)
  const ref = useRef(null)
  const fired = useRef(false)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(ref.current)
          if (!fired.current) {
            fired.current = true
            playGo()
            setFlash(true)
            setTimeout(() => setFlash(false), 2600)
          }
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = ((seconds - left) / seconds) * 100
  return (
    <>
      {flash && (
        <div className="go-flash" onClick={() => setFlash(false)}>
          <span>{t('goFlash')}</span>
        </div>
      )}
      <div className="rest-bar">
        <div className="rest-fill" style={{ width: pct + '%' }} />
        <div className="rest-inner">
          <span className="rest-time">{left === 0 ? t('go') : `⏱ ${mm}:${ss}`}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLeft((l) => l + 15)}>+15s</button>
            <button onClick={onClose}>{left === 0 ? t('close') : t('skip')}</button>
          </div>
        </div>
      </div>
    </>
  )
}

function ExerciseCard({ ex, display, swapped, alternatives, existing, last, onChange, onRest, onSwap, prevBest }) {
  const { t, lang } = useLang()
  const dispName = exName(lang, display.id)
  const init = useMemo(() => {
    if (existing && existing.length) return existing
    return Array.from({ length: ex.sets }, (_, i) => {
      const prev = last && last[i]
      return { weight: prev ? prev.weight : '', reps: prev ? prev.reps : '' }
    })
  }, [])
  const [sets, setSets] = useState(init)
  const [showAlts, setShowAlts] = useState(false)
  const [showTech, setShowTech] = useState(false)
  const tech = ex.technique ? TECHNIQUES[ex.technique] : null

  const apply = (next) => { setSets(next); onChange(next) }
  const setField = (i, field, val) => apply(sets.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))
  const addSet = () => apply([...sets, { weight: '', reps: '' }])
  const removeSet = (i) => apply(sets.filter((_, idx) => idx !== i))

  const suggestion = useMemo(() => suggestNextSet(last, ex, lang), [last, ex, lang])
  const curTop = Math.max(0, ...sets.filter((s) => parseInt(s.reps) > 0).map((s) => parseFloat(s.weight) || 0))
  const isPR = prevBest > 0 && curTop > prevBest

  return (
    <div className="ex">
      <div className="ex-head">
        <div>
          <div className="name">{dispName}{swapped && <span className="swapped-tag">↺ alt</span>}{isPR && <span className="pr-badge">{t('newRecord')}</span>}</div>
          <div className="muscle">{muscleName(lang, display.muscle)}</div>
          <div className="ex-prescription">
            {ex.sets} × {ex.repsLow}-{ex.repsHigh} REP · RIR {ex.rir} · REST {ex.rest}s
          </div>
          {last && (
            <div className="lastlog">
              ⏮ {t('lastTime')}: {last.map((s) => `${s.weight || '–'}×${s.reps || '–'}`).join(' ')}
            </div>
          )}
        </div>
        <a className="video-btn" href={videoUrl(dispName)} target="_blank" rel="noreferrer">{t('videoBtn')}</a>
      </div>

      <div className="suggestion">💡 {suggestion.text}</div>

      {tech && (
        <div className="tech">
          <button className="tech-head" onClick={() => setShowTech((v) => !v)}>
            <span>{tech.emoji} {t('technique')}: {tech.name}</span>
            <span className="tech-toggle">{showTech ? '−' : t('howto')}</span>
          </button>
          {showTech && (
            <div className="tech-body fade">
              <div><b>{t('execution')}:</b> {lang === 'en' ? tech.howEn : tech.how}</div>
              <div style={{ marginTop: 6 }}><b>{t('why')}:</b> {lang === 'en' ? tech.whyEn : tech.why}</div>
            </div>
          )}
        </div>
      )}

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
        <button className="addset" onClick={addSet}>{t('addSet')}</button>
        <button className="addset rest" onClick={onRest}>{t('restBtn')} {ex.rest}s</button>
        <button className="addset alt" onClick={() => setShowAlts((v) => !v)}>{t('swapBtn')}</button>
      </div>

      {showAlts && (
        <div className="alts fade">
          <div className="alts-title">{t('altTitle')}</div>
          {swapped && (
            <button className="alt-opt restore" onClick={() => { onSwap(null); setShowAlts(false) }}>
              {t('restore')}
            </button>
          )}
          {alternatives.length === 0 && <div className="alts-empty">{t('altEmpty')}</div>}
          {alternatives.map((a) => (
            <button key={a.id} className="alt-opt" onClick={() => { onSwap(a.id); setShowAlts(false) }}>
              <span>{exName(lang, a.id)}</span>
              <span className="alt-type">{a.type === 'compound' ? t('compoundShort') : t('isoShort')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
