import React, { useEffect, useRef, useState } from 'react'
import { generateWod, WOD_STYLES, WOD_LEVELS } from '../wods.js'
import { generateHyroxPlan, HYROX_INFO } from '../hyrox.js'
import { useLang } from '../i18n.jsx'

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
  const { t, lang } = useLang()
  const equip = state.program?.profile?.equipment || 'gym'
  const [style, setStyle] = useState('crossfit')
  const [level, setLevel] = useState('normale')
  const [minutes, setMinutes] = useState(12)
  const [wod, setWod] = useState(null)
  const [timer, setTimer] = useState(false)
  const [weeksCfg, setWeeksCfg] = useState(8)
  const [daysCfg, setDaysCfg] = useState(state.program?.profile?.daysPerWeek || 4)
  const [plan, setPlan] = useState(null)

  const isHyrox = style === 'hyrox'
  const gen = () => { setWod(generateWod({ style, minutes, level, equipment: equip, lang })); setTimer(false) }
  const genPlan = () => setPlan(generateHyroxPlan({ weeks: weeksCfg, days: daysCfg, level, equipment: equip, lang }))
  const styleDesc = (id) => t(id === 'crossfit' ? 'wodCrossfitDesc' : id === 'hybrid' ? 'wodHybridDesc' : 'wodHyroxDesc')

  return (
    <div className="fade">
      <div className="hero">
        <div className="glow" />
        <h1>{t('wodTitle')}</h1>
        <p dangerouslySetInnerHTML={{ __html: t('wodIntro') }} />
      </div>

      <div className="card">
        <div className="section-title" style={{ margin: '2px 2px 10px' }}>{t('style')}</div>
        <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {WOD_STYLES.map((s) => (
            <button key={s.id} className={'opt' + (style === s.id ? ' active' : '')} onClick={() => setStyle(s.id)}>
              <span className="emoji">{s.emoji}</span>
              <span className="lbl">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="csv-hint" style={{ marginTop: 8 }}>{styleDesc(style)}</div>

        <div className="section-title" style={{ margin: '16px 2px 10px' }}>{t('level')}</div>
        <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {WOD_LEVELS.map((l) => (
            <button key={l.id} className={'opt' + (level === l.id ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setLevel(l.id)}>
              <span className="lbl">{t(l.id === 'scaled' ? 'lvlScaled' : l.id === 'rx' ? 'lvlRx' : 'lvlNormale')}</span>
            </button>
          ))}
        </div>

        {!isHyrox ? (
          <>
            <div className="section-title" style={{ margin: '16px 2px 10px' }}>{t('duration')}</div>
            <div className="stepper">
              <button onClick={() => setMinutes((m) => Math.max(4, m - 2))}>−</button>
              <div className="val">{minutes}<small>{t('minutes')}</small></div>
              <button onClick={() => setMinutes((m) => Math.min(30, m + 2))}>+</button>
            </div>
            <button className="btn" style={{ marginTop: 16 }} onClick={gen}>{t('genWod')}</button>
          </>
        ) : (
          <>
            <div className="section-title" style={{ margin: '16px 2px 10px' }}>{t('hyroxWeeks')}</div>
            <div className="stepper">
              <button onClick={() => setWeeksCfg((w) => Math.max(4, w - 1))}>−</button>
              <div className="val">{weeksCfg}<small>{t('weeksUnit')}</small></div>
              <button onClick={() => setWeeksCfg((w) => Math.min(16, w + 1))}>+</button>
            </div>
            <div className="section-title" style={{ margin: '16px 2px 10px' }}>{t('hyroxDays')}</div>
            <div className="stepper">
              <button onClick={() => setDaysCfg((v) => Math.max(2, v - 1))}>−</button>
              <div className="val">{daysCfg}<small>{t('daysUnit')}</small></div>
              <button onClick={() => setDaysCfg((v) => Math.min(6, v + 1))}>+</button>
            </div>
            <button className="btn" style={{ marginTop: 16 }} onClick={genPlan}>🏁 {t('genHyrox')}</button>
          </>
        )}
      </div>

      {!isHyrox && wod && <WodCard wod={wod} timer={timer} setTimer={setTimer} />}
      {isHyrox && plan && <HyroxPlan plan={plan} />}
    </div>
  )
}

function HyroxPlan({ plan }) {
  const { t, lang } = useLang()
  const [wk, setWk] = useState(1)
  const info = HYROX_INFO[lang === 'en' ? 'en' : 'it']
  const week = plan.weeks.find((w) => w.week === wk) || plan.weeks[0]
  return (
    <div className="fade">
      <div className="card" style={{ background: 'var(--card-2)' }}>
        <div className="section-title" style={{ marginTop: 0 }}>🏁 {info.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{info.body}</div>
      </div>

      <div className="csv-hint" style={{ margin: '2px 2px 10px' }}>{plan.basis}</div>

      <div className="section-title">{t('week')}</div>
      <div className="weeks">
        {plan.weeks.map((w) => (
          <button key={w.week} className={'week-pill' + (w.week === wk ? ' active' : '') + (w.deload || w.phase === 'taper' ? ' deload' : '')} onClick={() => setWk(w.week)}>
            {t('weekShort')} {w.week}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: 'var(--card-2)' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{week.note}</div>
      </div>

      {week.days.map((d, i) => (
        <div className="card fade hyrox-day" key={i}>
          <div className="hyrox-day-head"><span className="hyrox-ic">{d.icon}</span><div><div className="hyrox-title">{t('dayShort')} {i + 1} · {d.title}</div><div className="hyrox-focus">{d.focus}</div></div></div>
          <ul className="hyrox-lines">
            {d.lines.map((l, j) => <li key={j}>{l}</li>)}
          </ul>
          {d.note && <div className="hyrox-note">{d.note}</div>}
        </div>
      ))}
    </div>
  )
}

function WodCard({ wod, timer, setTimer }) {
  const { t } = useLang()
  return (
    <div className="card fade" style={{ borderColor: 'var(--accent)' }}>
      <div className="wod-format">{wod.format} · {wod.minutes}'</div>
      <div className="wod-full">{wod.formatFull}</div>

      {wod.strength && (
        <div className="wod-block strength">
          <div className="wod-block-title">{t('strength')}</div>
          <div className="wod-move"><b>{wod.strength.name}</b> — {wod.strength.scheme}</div>
          <div className="wod-note">{wod.strength.note}</div>
        </div>
      )}

      <div className="wod-block">
        <div className="wod-block-title">{t('metcon')}</div>
        <div className="wod-presc">{wod.prescription}:</div>
        {wod.blocks.map((b, i) => (
          <div className="wod-move" key={i}>
            <span className="wod-reps">{b.reps}{b.unit === 'sec' ? 's' : b.unit === 'cal' ? ' cal' : ''}</span>
            <span>{b.name}</span>
          </div>
        ))}
      </div>

      <div className="wod-expl">
        <div><b>{t('format')}:</b> {wod.formatDesc}</div>
        <div style={{ marginTop: 8 }}><b>{t('stimulus')}:</b> {wod.stimulus}</div>
        <div style={{ marginTop: 8 }}><b>{t('scaling')}:</b> {wod.scaling}</div>
      </div>

      <button className="btn" style={{ marginTop: 14 }} onClick={() => setTimer(true)}>{t('startTimer')} ({wod.minutes}')</button>
      {timer && <WodTimer seconds={wod.timeCapSec} onClose={() => setTimer(false)} />}
    </div>
  )
}

function WodTimer({ seconds, onClose }) {
  const { t } = useLang()
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
        <span className="rest-time">{left === 0 ? t('timeUp') : `${mm}:${ss}`}</span>
        <button onClick={onClose}>{left === 0 ? t('close') : t('stop')}</button>
      </div>
    </div>
  )
}
