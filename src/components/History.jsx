import React, { useMemo, useState } from 'react'
import { logKey, dayKey } from '../storage.js'
import { useLang } from '../i18n.jsx'

export default function History({ state }) {
  const { t, lang } = useLang()
  const { program, logs, completed, notes } = state
  const [open, setOpen] = useState(null)

  const sessions = useMemo(() => {
    const list = []
    program.weeks.forEach((wk) => {
      wk.days.forEach((day, di) => {
        const dk = dayKey(wk.week, di)
        const date = completed[dk]
        if (!date) return
        let tonnage = 0, setCount = 0
        const exLogs = day.exercises.map((ex) => {
          const log = logs[logKey(wk.week, di, ex.id)] || []
          log.forEach((s) => {
            const w = parseFloat(s.weight) || 0
            const r = parseInt(s.reps) || 0
            if (r > 0) setCount++
            tonnage += w * r
          })
          return { name: ex.name, muscle: ex.muscle, log }
        })
        list.push({ dk, week: wk.week, deload: wk.deload, name: day.name, focus: day.focus, date, tonnage, setCount, note: notes[dk], exLogs })
      })
    })
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [program, logs, completed, notes])

  if (sessions.length === 0) {
    return (
      <div className="fade">
        <div className="section-title">{t('historyTitle')}</div>
        <div className="card empty">
          <div className="big">📖</div>
          <div>{t('historyEmpty')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade">
      <div className="section-title">{t('history')} · {sessions.length} {t('workoutsCount')}</div>
      {sessions.map((s) => (
        <div key={s.dk} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <button className="hist-head" onClick={() => setOpen(open === s.dk ? null : s.dk)}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{s.name} {s.deload && '🌙'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{fmtDate(s.date, lang)} · {t('weekShort')} {s.week}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-2)' }}>{fmt(s.tonnage)} kg</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.setCount} {t('sets')}</div>
            </div>
          </button>
          {open === s.dk && (
            <div className="hist-body fade">
              {s.exLogs.map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.name} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {e.muscle}</span></div>
                  <div style={{ color: 'var(--accent-2)', fontSize: 13, marginTop: 2 }}>
                    {e.log.length ? e.log.map((x) => `${x.weight || '–'}×${x.reps || '–'}`).join('   ') : t('notLogged')}
                  </div>
                </div>
              ))}
              {s.note && (
                <div style={{ marginTop: 6, padding: 10, background: 'var(--bg)', borderRadius: 10, fontSize: 13, color: 'var(--muted)' }}>
                  📝 {s.note}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function fmtDate(iso, lang = 'it') {
  const loc = lang === 'en' ? 'en-GB' : 'it-IT'
  const d = new Date(iso)
  return d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
}
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n)
