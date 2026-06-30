import React, { useState } from 'react'
import { dayKey } from '../storage.js'
import { buildProgram, dayName, focusName, weekNoteText } from '../engine.js'
import { useLang, goalLabel } from '../i18n.jsx'

export default function Home({ state, setState, onOpenDay }) {
  const { t, lang } = useLang()
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
          <h1>{t('hi')}{program.profile.name ? `, ${program.profile.name}` : ''} 👋</h1>
          <p>{goalLabel(lang, program.profile.goal)} · {program.profile.daysPerWeek} {t('daysUnit')} · {program.weeks.length} {t('weeksUnit')}</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>{t('splitLabel')}: <b style={{ color: 'var(--text)' }}>{program.splitName}</b></p>
          <div className="aigen"><span className="pulse" /> {progressPct}% {t('completed')}</div>
        </div>
      </div>

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

      <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => regenerate(state, setState, lang)}>
        {t('regenerate')}
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

function regenerate(state, setState, lang) {
  const q = lang === 'en' ? 'Regenerate the program? You keep your logged load history but the structure may change.' : 'Vuoi rigenerare il programma? Manterrai lo storico dei pesi registrati ma la struttura potrebbe cambiare.'
  if (!confirm(q)) return
  setState((s) => ({ ...s, program: buildProgram(s.program.profile), completed: {} }))
}
