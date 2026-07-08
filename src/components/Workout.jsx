import React, { useEffect, useMemo, useRef, useState } from 'react'
import { logKey, dayKey, lastLogFor } from '../storage.js'
import { alternativesFor, suggestNextSet, EXERCISE_BY_ID, TECHNIQUES, exName, muscleName, dayName, focusName, bestTopBefore, addExerciseToProgram, removeExerciseFromProgram, addableExercises } from '../engine.js'
import { useLang } from '../i18n.jsx'
import { mobilityForDay, REGION_LABEL, mobilitySearchUrl } from '../mobility.js'

// Sceglie una voce il più possibile maschile tra quelle installate sul device.
function pickMaleVoice(voices) {
  if (!voices || !voices.length) return null
  const male = /\b(male|maschile|uomo)\b/i
  const female = /\b(female|femminile|donna)\b/i
  // nomi di voci tipicamente maschili (iOS/macOS/Windows/Google)
  const maleNames = /(luca|diego|cosimo|paolo|matteo|giorgio|carlo|daniel|george|arthur|fred|alex|rishi|guy|david|mark|male)/i
  const score = (v) => {
    const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase()
    let s = 0
    if (male.test(n)) s += 5
    if (maleNames.test(n)) s += 3
    if (female.test(n)) s -= 6
    if (v.lang && v.lang.toLowerCase().startsWith('it')) s += 1
    return s
  }
  return voices.slice().sort((a, b) => score(b) - score(a))[0] || null
}

// Voce "pro" inclusa nell'app: file audio uguale su ogni telefono, offline.
let goAudio = null
function getGoAudio() {
  if (!goAudio) { goAudio = new Audio('/go.wav'); goAudio.preload = 'auto' }
  return goAudio
}
// Sblocca l'audio durante il tap dell'utente (necessario su iOS/Android).
function primeGoVoice() {
  try {
    const a = getGoAudio()
    a.muted = true
    const p = a.play()
    if (p && p.then) p.then(() => { a.pause(); a.currentTime = 0; a.muted = false }).catch(() => { a.muted = false })
    else { a.pause(); a.currentTime = 0; a.muted = false }
  } catch { /* niente */ }
}
// Riproduce la voce "pro"; se fallisce usa la voce del telefono come riserva.
function playGoVoice() {
  try {
    const a = getGoAudio()
    a.muted = false; a.currentTime = 0
    const p = a.play()
    if (p && p.catch) p.catch(() => speakGo())
  } catch { speakGo() }
}

// Riserva: voce "GO GO GO" con Web Speech API (voce del telefono).
function speakGo() {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const say = () => {
      const u = new SpeechSynthesisUtterance('Go! Go! Go!')
      const v = pickMaleVoice(synth.getVoices())
      if (v) u.voice = v
      u.rate = 0.95; u.pitch = 0.55; u.volume = 1 // grave + cadenza decisa = più autorevole
      synth.speak(u)
    }
    // le voci a volte si caricano in modo asincrono
    if (synth.getVoices().length) say()
    else synth.addEventListener('voiceschanged', say, { once: true })
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
    playGoVoice()
    if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400])
  } catch { /* audio non disponibile */ }
}

function videoUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('esecuzione corretta ' + name)
}

// Nota: la chiave NON include la settimana: uno swap vale per tutto il piano
// (tutte le settimane di quel mesociclo). Si azzera quando rigeneri il piano.
const swapKey = (dayIdx, exId) => `${dayIdx}-${exId}`

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
      if (newId) swaps[swapKey(dayIdx, origId)] = newId
      else delete swaps[swapKey(dayIdx, origId)]
      return { ...s, swaps }
    })
  }
  const addExercise = (exId) => {
    setState((s) => ({ ...s, program: addExerciseToProgram(s.program, dayIdx, exId) }))
  }
  const removeExercise = (exId) => {
    if (!confirm(t('removeExConfirm'))) return
    setState((s) => {
      const swaps = { ...(s.swaps || {}) }
      delete swaps[swapKey(dayIdx, exId)]
      return { ...s, program: removeExerciseFromProgram(s.program, dayIdx, exId), swaps }
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

      <MobilitySession day={day} />

      {day.exercises.map((ex) => {
        const swappedId = (state.swaps || {})[swapKey(dayIdx, ex.id)]
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
            onRemove={() => removeExercise(ex.id)}
            prevBest={bestTopBefore(program, state.logs, ex.id, week)}
          />
        )
      })}

      <AddExercise equip={equip} existingIds={day.exercises.map((e) => e.id)} onAdd={addExercise} />

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

// Wake Lock: tiene lo schermo ACCESO durante il recupero, così il timer, il
// suono e la voce partono anche se il telefono si oscurerebbe da solo. Si
// ri-acquisisce quando si torna sull'app. (Il blocco manuale del telefono
// resta un limite delle web-app: il sistema le sospende.)
function useWakeLock(enabled = true) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!enabled) { setActive(false); return }
    let lock = null, dead = false
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen')
          if (!dead) setActive(true)
          lock.addEventListener('release', () => setActive(false))
        }
      } catch { /* non supportato o negato */ }
    }
    const onVis = () => { if (document.visibilityState === 'visible' && !dead) request() }
    request()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      dead = true
      document.removeEventListener('visibilitychange', onVis)
      try { lock && lock.release() } catch { /* ignora */ }
    }
  }, [enabled])
  return active
}

// Notifica di sistema: chiede il permesso (una volta) e la mostra a fine pausa.
// Best-effort: se il telefono ha sospeso l'app in background può non arrivare.
function requestNotifyPermission() {
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() } catch { /* ignora */ }
}
function notifyGo(title, body) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', tag: 'fitai-timer', renotify: true })
    }
  } catch { /* ignora */ }
}

// Beep breve per i timer di mobilità (a tempo).
function playBeepShort() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx(); if (ctx.state === 'suspended') ctx.resume()
    const beep = (t, f) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.value = f
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      o.start(t); o.stop(t + 0.32)
    }
    const n = ctx.currentTime; beep(n, 780); beep(n + 0.35, 1040)
    if (navigator.vibrate) navigator.vibrate([150, 80, 200])
  } catch { /* audio non disponibile */ }
}

function RestTimer({ seconds, onClose }) {
  const { t } = useLang()
  const endAt = useRef(Date.now() + seconds * 1000)
  const [left, setLeft] = useState(seconds)
  const [flash, setFlash] = useState(false)
  const fired = useRef(false)
  const screenOn = useWakeLock()

  useEffect(() => {
    primeGoVoice() // sblocca l'audio finché siamo nel gesto che ha avviato il recupero
    requestNotifyPermission() // per avvisare anche se sei su un'altra schermata
    // Timer basato su timestamp: preciso anche se il sistema rallenta i tick.
    const tick = () => {
      const rem = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(rem)
      if (rem <= 0 && !fired.current) {
        fired.current = true
        playGo()
        notifyGo('💪 Recupero finito!', 'GO GO GO — riparti con la serie.')
        setFlash(true)
        setTimeout(() => setFlash(false), 2600)
      }
    }
    const id = setInterval(tick, 250)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const add15 = () => {
    const rem = Math.max(0, left) + 15
    endAt.current = Date.now() + rem * 1000
    setLeft(rem)
    fired.current = false
  }

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
          <span className="rest-time">{left === 0 ? t('go') : `⏱ ${mm}:${ss}`}{screenOn && <span className="wake-dot" title={t('screenStaysOn')}> 🔆</span>}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add15}>+15s</button>
            <button onClick={onClose}>{left === 0 ? t('close') : t('skip')}</button>
          </div>
        </div>
      </div>
    </>
  )
}

// Icona yoga da libreria web (Material Design Icons "yoga", Apache-2.0),
// ricolorata col gradiente neon dell'app.
function YogaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true" className="yoga-ic">
      <defs>
        <linearGradient id="yg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff2d95" /><stop offset="1" stopColor="#00f0ff" /></linearGradient>
      </defs>
      <path fill="url(#yg)" d="M13 2a2 2 0 1 0 0 4c1.11 0 2-.89 2-2a2 2 0 0 0-2-2M4 7v2h6v6l-5.07 5.07l1.41 1.43l6.72-6.73L17 17.13V21h2v-4.43c0-.36-.18-.68-.5-.86L15 13.6V9h6V7z" />
    </svg>
  )
}

// Timer a tempo per gli esercizi di mobilità (tenute/riscaldamento).
function MobTimer({ seconds }) {
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(seconds)
  const endRef = useRef(0)
  const fired = useRef(false)
  useWakeLock(running)
  useEffect(() => {
    if (!running) return
    fired.current = false
    endRef.current = Date.now() + seconds * 1000
    setLeft(seconds)
    const tick = () => {
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setLeft(rem)
      if (rem <= 0 && !fired.current) { fired.current = true; playBeepShort(); setRunning(false) }
    }
    const id = setInterval(tick, 200)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [running, seconds])
  return (
    <button className={'mob-link mob-timer' + (running ? ' running' : '')} onClick={() => setRunning((r) => !r)}>
      {running ? `⏱ ${left}s ✕` : `⏱ ${seconds}s`}
    </button>
  )
}

function MobilitySession({ day }) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const { region, drills } = useMemo(() => mobilityForDay(day), [day])
  const regionLabel = (REGION_LABEL[region] && REGION_LABEL[region][lang]) || REGION_LABEL[region].it
  return (
    <div className="mob-wrap">
      <button className={'mob-btn' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)}>
        <span className="mob-ic"><YogaIcon /></span>
        <span className="mob-txt">
          <b>{t('mobilityTitle')}</b>
          <small>{t('mobilityOptional')} · {regionLabel}</small>
        </span>
        <span className="mob-chev">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mob-panel fade">
          <div className="sub">{t('mobilityHint')}</div>
          {drills.map((d) => (
            <div key={d.id} className="mob-drill">
              <div className="mob-drill-head">
                <span className="mob-name">{lang === 'en' ? d.en : d.it}</span>
                <span className="mob-dose">{lang === 'en' ? d.doseEn : d.doseIt}</span>
              </div>
              <div className="mob-links">
                <a className="mob-link vid" href={d.video} target="_blank" rel="noreferrer">▶ {t('mobilityVideo')}</a>
                <a className="mob-link" href={mobilitySearchUrl(d.search)} target="_blank" rel="noreferrer">🔎 {t('mobilitySearch')}</a>
                <MobTimer seconds={d.secs || 40} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddExercise({ equip, existingIds, onAdd }) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const [muscle, setMuscle] = useState('')
  const byMuscle = useMemo(() => addableExercises(equip, existingIds), [equip, existingIds])
  const muscles = Object.keys(byMuscle)
  if (!open) {
    return (
      <button className="btn secondary add-ex-btn" onClick={() => setOpen(true)}>
        ➕ {t('addExercise')}
      </button>
    )
  }
  const curMuscle = muscles.includes(muscle) ? muscle : ''
  return (
    <div className="card add-ex-panel fade">
      <div className="section-title" style={{ marginTop: 0 }}>{t('addExercise')}</div>
      <div className="sub">{t('chooseMuscle')}</div>
      <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {muscles.map((m) => (
          <button key={m} className={'opt' + (curMuscle === m ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 8 }} onClick={() => setMuscle(m)}>
            <span className="lbl" style={{ fontSize: 9 }}>{muscleName(lang, m)}</span>
          </button>
        ))}
      </div>
      {curMuscle && (
        <div className="alts fade" style={{ marginTop: 10 }}>
          {byMuscle[curMuscle].map((e) => (
            <button key={e.id} className="alt-opt" onClick={() => { onAdd(e.id); setOpen(false); setMuscle('') }}>
              <span>{exName(lang, e.id)}</span>
              <span className="alt-type">{e.type === 'compound' ? t('compoundShort') : t('isoShort')}</span>
            </button>
          ))}
        </div>
      )}
      <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => { setOpen(false); setMuscle('') }}>{t('cancel')}</button>
    </div>
  )
}

function ExerciseCard({ ex, display, swapped, alternatives, existing, last, onChange, onRest, onSwap, onRemove, prevBest }) {
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
        <a className="video-btn" href={display.video || videoUrl(dispName)} target="_blank" rel="noreferrer">{t('videoBtn')}</a>
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
          {onRemove && (
            <button className="alt-opt remove-ex" onClick={() => { setShowAlts(false); onRemove() }}>
              🗑 {t('removeExercise')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
