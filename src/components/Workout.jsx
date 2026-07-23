import React, { useEffect, useMemo, useRef, useState } from 'react'
import { logKey, dayKey, lastLogFor } from '../storage.js'
import { alternativesFor, suggestNextSet, EXERCISE_BY_ID, TECHNIQUES, exName, muscleName, dayName, focusName, bestTopBefore, addExerciseToProgram, removeExerciseFromProgram, addableExercises } from '../engine.js'
import { useLang } from '../i18n.jsx'
import { mobilityForDay, REGION_LABEL, mobilitySearchUrl } from '../mobility.js'
import { backupNow } from '../backup.js'

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

// Spiega su QUALE serie applicare la tecnica, in base al numero di serie.
function techScopeText(techId, nSets, lang) {
  const en = lang === 'en'
  const n = Math.max(2, nSets || 2)
  if (techId === 'back_off') {
    return en
      ? `Set 1 = heavy top set · Sets 2-${n} = back-off (drop load 10-20%, more reps, same RIR)`
      : `Serie 1 = top set pesante · Serie 2-${n} = back-off (−10/20% carico, più ripetizioni, stesso RIR)`
  }
  if (techId === 'drop_set' || techId === 'myo_reps') {
    return en ? `Apply it on the LAST set (set ${n})` : `Applicala sull'ULTIMA serie (serie ${n})`
  }
  if (techId === 'rest_pause') {
    return en ? 'Apply it on the last work set' : "Applicala sull'ultima serie di lavoro"
  }
  return null
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
  const [done, setDone] = useState(null)
  const readiness = (state.readiness || {})[dk] || null
  const adj = READINESS_ADJ[readiness] || READINESS_ADJ.normale
  const setReadiness = (level) => setState((s) => ({ ...s, readiness: { ...(s.readiness || {}), [dk]: level } }))

  const setLog = (exId, sets) => {
    setState((s) => ({ ...s, logs: { ...s.logs, [logKey(week, dayIdx, exId)]: sets } }))
  }
  const setExNote = (exId, v) => {
    setState((s) => {
      const exNotes = { ...(s.exNotes || {}) }
      if (v && v.trim()) exNotes[exId] = v
      else delete exNotes[exId]
      return { ...s, exNotes }
    })
  }
  const saveNote = (v) => {
    setNote(v)
    setState((s) => ({ ...s, notes: { ...s.notes, [dk]: v } }))
  }
  const swapExercise = (origId, newId) => {
    setState((s) => {
      const swaps = { ...(s.swaps || {}) }
      if (newId) {
        // Guardia anti-collisione: rifiuta lo scambio verso un esercizio già
        // presente nella giornata (originale o come scambio di un altro slot),
        // altrimenti due card condividerebbero gli stessi log pesi/ripetizioni.
        const dayExs = s.program.weeks[0].days[dayIdx].exercises
        const effNow = new Set(dayExs.filter((e) => e.id !== origId).map((e) => swaps[swapKey(dayIdx, e.id)] || e.id))
        if (effNow.has(newId)) return s
        swaps[swapKey(dayIdx, origId)] = newId
      } else delete swaps[swapKey(dayIdx, origId)]
      return { ...s, swaps }
    })
  }
  const addExercise = (exId, afterExId = null) => {
    setState((s) => ({ ...s, program: addExerciseToProgram(s.program, dayIdx, exId, afterExId) }))
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
    const next = { ...state, completed: { ...state.completed, [dk]: new Date().toISOString() } }
    setState(next)
    setDone({ bk: 'saving' }) // conferma a schermo
    // backup immediato che sovrascrive il precedente (file + cloud)
    backupNow(next).then((r) => setDone({ bk: r })).catch(() => setDone({ bk: 'fail' }))
    setTimeout(onBack, 1500)
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

      {(() => {
        // Mappa slot -> esercizio EFFETTIVO con sanificazione anti-collisione:
        // se due slot puntano allo stesso esercizio (scambio salvato da versioni
        // vecchie), lo scambio del secondo viene ignorato. Evita che due card
        // condividano gli stessi log pesi/ripetizioni.
        // Due fasi: prima gli slot NON scambiati riservano il proprio esercizio,
        // poi gli scambi vengono accettati solo se non collidono con un esercizio
        // EFFETTIVAMENTE mostrato da un altro slot. (Scambiare verso un esercizio
        // "liberato" da un altro scambio è legittimo e ora funziona.)
        const swapsMap = state.swaps || {}
        const desired = new Map(day.exercises.map((e) => [e.id, swapsMap[swapKey(dayIdx, e.id)] || e.id]))
        const taken = new Set()
        day.exercises.forEach((e) => { if (desired.get(e.id) === e.id) taken.add(e.id) })
        const effMap = new Map()
        day.exercises.forEach((e) => {
          let eid = desired.get(e.id)
          if (eid !== e.id) {
            if (taken.has(eid)) eid = e.id // collisione reale: ignora lo scambio
            taken.add(eid)
          }
          effMap.set(e.id, eid)
        })
        const effIds = new Set(effMap.values())
        return day.exercises.map((ex) => {
          const effId = effMap.get(ex.id) || ex.id
          const swappedId = effId !== ex.id ? effId : null
          const display = EXERCISE_BY_ID[effId] || EXERCISE_BY_ID[ex.id]
          const adjEx = { ...ex, sets: Math.max(2, ex.sets + adj.sets), rir: Math.max(0, ex.rir + adj.rir) }
          return (
            <React.Fragment key={ex.id + '-' + effId + '-' + readiness}>
              <ExerciseCard
                ex={adjEx}
                display={display}
                swapped={!!swappedId}
                alternatives={alternativesFor(effId, equip).filter((a) => !effIds.has(a.id))}
                existing={state.logs[logKey(week, dayIdx, effId)]}
                last={lastLogFor(state.logs, week, dayIdx, effId)}
                onChange={(sets) => setLog(effId, sets)}
                onRest={() => setRest(ex.rest)}
                onSwap={(newId) => swapExercise(ex.id, newId)}
                onRemove={() => removeExercise(ex.id)}
                exNote={(state.exNotes || {})[effId] || ''}
                onExNote={(v) => setExNote(effId, v)}
                prevBest={bestTopBefore(program, state.logs, effId, week, dayIdx)}
              />
              <AddExercise equip={equip} existingIds={[...effIds]} onAdd={(id) => addExercise(id, ex.id)} compact />
            </React.Fragment>
          )
        })
      })()}

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

      {done && (
        <div className="done-flash">
          <div className="done-box">
            <div className="done-main">💪 {t('workoutDoneMsg')}</div>
            {done.bk === 'saving' && <div className="done-bk">💾 {t('bkSaving')}</div>}
            {done.bk === 'ok' && <div className="done-bk ok">💾 {t('bkSavedOk')}</div>}
            {done.bk === 'fail' && <div className="done-bk warn">⚠️ {t('bkSavedFail')}</div>}
          </div>
        </div>
      )}
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
function MobTimer({ seconds, perSide }) {
  const { t } = useLang()
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(seconds)
  const [side, setSide] = useState(1) // 1 o 2 (solo se perSide)
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
      if (rem <= 0 && !fired.current) {
        fired.current = true
        playBeepShort()
        if (perSide && side === 1) { setSide(2) } // passa automaticamente al lato 2
        else { setRunning(false); setSide(1) }
      }
    }
    const id = setInterval(tick, 200)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [running, side, seconds, perSide])

  const start = () => { setSide(1); setRunning((r) => !r) }
  let label
  if (running) label = perSide ? `⏱ ${t('side')} ${side}/2 · ${left}s ✕` : `⏱ ${left}s ✕`
  else label = perSide ? `⏱ ${seconds}s ×2` : `⏱ ${seconds}s`
  return (
    <button className={'mob-link mob-timer' + (running ? ' running' : '')} onClick={start}>
      {label}
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
                <MobTimer seconds={d.secs || 40} perSide={!!d.perSide} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddExercise({ equip, existingIds, onAdd, compact }) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const [muscle, setMuscle] = useState('')
  const byMuscle = useMemo(() => addableExercises(equip, existingIds), [equip, existingIds])
  const muscles = Object.keys(byMuscle)
  if (!open) {
    return (
      <button className={compact ? 'add-ex-inline' : 'btn secondary add-ex-btn'} onClick={() => setOpen(true)}>
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

function ExerciseCard({ ex, display, swapped, alternatives, existing, last, onChange, onRest, onSwap, onRemove, exNote, onExNote, prevBest }) {
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
  const techScope = tech ? techScopeText(ex.technique, sets.length, lang) : null

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
          {techScope && <div className="tech-scope">🎯 {techScope}</div>}
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

      <input
        className="in ex-note"
        placeholder={t('exNotePh')}
        value={exNote}
        onChange={(e) => onExNote(e.target.value)}
      />

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
