import React, { useState, useEffect } from 'react'
import { dayKey } from '../storage.js'
import { buildProgram, dayName, focusName, weekNoteText, workoutStats, assessProgress, levelUpProgram } from '../engine.js'
import { useLang, goalLabel } from '../i18n.jsx'

const POSES = [
  { src: '/mascot.webp', bubble: false },
  { src: '/mascot-point.webp', bubble: true },
  { src: '/mascot-drink.webp', bubble: false },
]

function MascotHero({ onStart }) {
  const { t } = useLang()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % POSES.length), 3000)
    return () => clearInterval(id)
  }, [])
  const pose = POSES[i]
  return (
    <button className="mascot-anim" onClick={onStart} aria-label={t('startWorkout')}>
      {pose.bubble && <span className="mascot-bubble">{t('startWorkout')}</span>}
      <img className="mascot-sm" src={pose.src} alt="Doc Jos" />
    </button>
  )
}

export default function Home({ state, setState, onOpenDay, onPersonalize }) {
  const { t, lang } = useLang()
  const { program, completed } = state
  const [week, setWeek] = useState(() => firstIncompleteWeek(program, completed))
  const wk = program.weeks.find((w) => w.week === week) || program.weeks[0]

  const doneCount = wk.days.filter((_, i) => completed[dayKey(week, i)]).length
  const totalDays = program.weeks.length * program.weeks[0].days.length
  const totalDone = Object.keys(completed).length
  const progressPct = Math.round((totalDone / totalDays) * 100)
  const stats = workoutStats(completed)
  const blockDone = totalDone >= totalDays
  const progress = blockDone ? assessProgress(program, state.logs, completed, lang) : null

  return (
    <div className="fade">
      <div className="hero hero-home">
        <div className="glow" />
        <MascotHero onStart={() => onOpenDay(week, firstIncompleteDay(wk, week, completed))} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{t('hi')}{program.profile.name ? `, ${program.profile.name}` : ''} 👋</h1>
          <p>{goalLabel(lang, program.profile.goal)} · {program.profile.daysPerWeek} {t('daysUnit')} · {program.weeks.length} {t('weeksUnit')}</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>{t('splitLabel')}: <b style={{ color: 'var(--text)' }}>{program.splitName}</b></p>
          <div className="aigen"><span className="pulse" /> {progressPct}% {t('completed')}</div>
        </div>
      </div>

      {blockDone && (
        <div className="card block-done fade">
          <div className="bd-head">🏁 {t('blockDoneTitle')}</div>
          <div className="bd-msg">{progress.message}</div>

          {progress.nextLevel ? (
            <button className={'btn bd-cta' + (progress.suggestLevelUp ? '' : ' secondary')} onClick={() => levelUp(state, setState, lang, progress.nextLevel)}>
              ⬆️ {t('levelUpCta')}
              <span className="bd-sub">{progress.suggestLevelUp ? t('levelUpSubGood') : t('levelUpSubOpt')}</span>
            </button>
          ) : (
            <div className="bd-maxed">🏆 {t('levelMaxed')}</div>
          )}

          <button className="btn secondary bd-cta" onClick={() => regenerate(state, setState, lang)}>
            🔄 {t('regenSameCta')}
            <span className="bd-sub">{t('regenSameSub')}</span>
          </button>
        </div>
      )}

      {stats.total > 0 && (
        <div className="gami">
          <div className="gami-badge">{stats.badge}</div>
          <div className="gami-stat"><b>{stats.total}</b><span>{t('workoutsTotal')}</span></div>
          <div className="gami-stat"><b>{stats.thisWeek}</b><span>{t('thisWeek')}</span></div>
          {stats.streak > 1 && <div className="gami-stat"><b>🔥{stats.streak}</b><span>{t('streakDays')}</span></div>}
        </div>
      )}

      <div className="section-title">{t('week')}</div>
      <div className="weeks">
        {program.weeks.map((w) => (
          <button
            key={w.week}
            className={'week-pill' + (w.week === week ? ' active' : '') + (w.deload ? ' deload' : '')}
            onClick={() => setWeek(w.week)}
          >
            {w.deload ? t('deloadPill') : `${t('weekShort')} ${w.week}`}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: 'var(--card-2)' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          💡 {weekNoteText(lang, program, wk)}
        </div>
      </div>

      <div className="section-title">{t('days')} · {doneCount}/{wk.days.length} {t('done')}</div>
      {wk.days.map((d, i) => {
        const done = completed[dayKey(week, i)]
        return (
          <button key={i} className="day" onClick={() => onOpenDay(week, i)}>
            <div className="meta">
              <div className="name">{dayName(lang, d.name)}</div>
              <div className="focus">{focusName(lang, d.focus)} · {d.exercises.length} {t('exercises')}</div>
            </div>
            <div className="right">
              {wk.deload && <span className="badge deload">{t('deloadBadge')}</span>}
              {done && <span className="badge done">{t('doneBadge')}</span>}
              <span className="chev">›</span>
            </div>
          </button>
        )
      })}

      <button className="btn secondary" style={{ marginTop: 8 }} onClick={onPersonalize}>
        {t('personalizeBtn')}
      </button>
      <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => regenerate(state, setState, lang)}>
        {t('regenerate')}
      </button>
    </div>
  )
}

function firstIncompleteDay(wk, week, completed) {
  const idx = wk.days.findIndex((_, i) => !completed[dayKey(week, i)])
  return idx === -1 ? 0 : idx
}

function firstIncompleteWeek(program, completed) {
  for (const w of program.weeks) {
    const allDone = w.days.every((_, i) => completed[dayKey(w.week, i)])
    if (!allDone) return w.week
  }
  return program.weeks[program.weeks.length - 1].week
}

function regenerate(state, setState, lang) {
  const q = lang === 'en' ? 'Regenerate the program? You keep your logged load history but the structure may change.' : 'Vuoi rigenerare il programma? Manterrai lo storico dei pesi registrati ma la struttura potrebbe cambiare.'
  if (!confirm(q)) return
  setState((s) => ({ ...s, program: buildProgram(s.program.profile), completed: {}, swaps: {} }))
}

function levelUp(state, setState, lang, nextLevel) {
  const q = lang === 'en'
    ? `Level up to "${nextLevel}"? I'll generate a new block with more volume and advanced techniques. Your load history stays saved.`
    : `Salire al livello "${nextLevel}"? Genero un nuovo blocco con più volume e tecniche avanzate. Lo storico dei pesi resta salvato.`
  if (!confirm(q)) return
  setState((s) => ({ ...s, program: levelUpProgram(s.program), completed: {}, swaps: {} }))
}
