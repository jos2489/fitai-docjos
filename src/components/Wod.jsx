import React, { useEffect, useRef, useState } from 'react'
import { generateWod, WOD_STYLES, WOD_LEVELS } from '../wods.js'

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const beep = (t, f) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.value = f
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      o.start(t); o.stop(t + 0.25)
    }
    const n = ctx.currentTime
    beep(n, 660); beep(n + 0.3, 660); beep(n + 0.6, 990)
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  } catch { /* */ }
}

export default function Wod({ state }) {
  const equip = state.program?.profile?.equipment || 'gym'
  const [style, setStyle] = useState('crossfit')
  const [level, setLevel] = useState('normale')
  const [minutes, setMinutes] = useState(12)
  const [wod, setWod] = useState(null)
  const [timer, setTimer] = useState(false)

  const gen = () => { setWod(generateWod({ style, minutes, level, equipment: equip })); setTimer(false) }

  return (
    <div className="fade">
      <div className="hero">
        <div className="glow" />
        <h1>🔥 WOD GENERATOR</h1>
        <p>Allenamenti <b>CrossFit</b> e circuiti <b>Hybrid</b> generati al volo, scalati per il tuo livello e la tua attrezzatura — con spiegazione del formato.</p>
      </div>

      <div className="card">
        <div className="section-title" style={{ margin: '2px 2px 10px' }}>Stile</div>
        <div className="opt-grid">
          {WOD_STYLES.map((s) => (
            <button key={s.id} className={'opt' + (style === s.id ? ' active' : '')} onClick={() => setStyle(s.id)}>
              <span className="emoji">{s.emoji}</span>
              <span className="lbl">{s.label}</span>
              <span className="desc">{s.desc}</span>
            </button>
          ))}
        </div>

        <div className="section-title" style={{ margin: '16px 2px 10px' }}>Livello</div>
        <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {WOD_LEVELS.map((l) => (
            <button key={l.id} className={'opt' + (level === l.id ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setLevel(l.id)}>
              <span className="lbl">{l.label}</span>
            </button>
          ))}
        </div>

        <div className="section-title" style={{ margin: '16px 2px 10px' }}>Durata</div>
        <div className="stepper">
          <button onClick={() => setMinutes((m) => Math.max(4, m - 2))}>−</button>
          <div className="val">{minutes}<small>minuti</small></div>
          <button onClick={() => setMinutes((m) => Math.min(30, m + 2))}>+</button>
        </div>

        <button className="btn" style={{ marginTop: 16 }} onClick={gen}>⚡ GENERA WOD</button>
      </div>

      {wod && <WodCard wod={wod} timer={timer} setTimer={setTimer} />}
    </div>
  )
}

function WodCard({ wod, timer, setTimer }) {
  return (
    <div className="card fade" style={{ borderColor: 'var(--accent)' }}>
      <div className="wod-format">{wod.format} · {wod.minutes}'</div>
      <div className="wod-full">{wod.formatFull}</div>

      {wod.strength && (
        <div className="wod-block strength">
          <div className="wod-block-title">💪 FORZA</div>
          <div className="wod-move"><b>{wod.strength.name}</b> — {wod.strength.scheme}</div>
          <div className="wod-note">{wod.strength.note}</div>
        </div>
      )}

      <div className="wod-block">
        <div className="wod-block-title">🔥 METCON</div>
        <div className="wod-presc">{wod.prescription}:</div>
        {wod.blocks.map((b, i) => (
          <div className="wod-move" key={i}>
            <span className="wod-reps">{b.reps}{b.unit === 'sec' ? 's' : b.unit === 'cal' ? ' cal' : ''}</span>
            <span>{b.name}</span>
          </div>
        ))}
      </div>

      <div className="wod-expl">
        <div><b>📖 Formato:</b> {wod.formatDesc}</div>
        <div style={{ marginTop: 8 }}><b>🎯 Stimolo:</b> {wod.stimulus}</div>
        <div style={{ marginTop: 8 }}><b>⚙️ Scaling:</b> {wod.scaling}</div>
      </div>

      <button className="btn" style={{ marginTop: 14 }} onClick={() => setTimer(true)}>⏱ AVVIA TIMER ({wod.minutes}')</button>
      {timer && <WodTimer seconds={wod.timeCapSec} onClose={() => setTimer(false)} />}
    </div>
  )
}

function WodTimer({ seconds, onClose }) {
  const [left, setLeft] = useState(seconds)
  const ref = useRef(null)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(ref.current); playBeep(); return 0 }
        // beep negli ultimi 3 secondi
        if (l <= 4) playBeep()
        return l - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = ((seconds - left) / seconds) * 100
  return (
    <div className="rest-bar">
      <div className="rest-fill" style={{ width: pct + '%' }} />
      <div className="rest-inner">
        <span className="rest-time">{left === 0 ? '✅ TIME!' : `${mm}:${ss}`}</span>
        <button onClick={onClose}>{left === 0 ? 'CHIUDI' : 'STOP'}</button>
      </div>
    </div>
  )
}
