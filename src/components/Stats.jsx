import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { logKey, dayKey } from '../storage.js'

const ACCENT = '#ff2d95'
const ACCENT2 = '#00f0ff'

export default function Stats({ state, setState }) {
  const { program, logs, completed } = state

  const data = useMemo(() => computeStats(program, logs, completed), [program, logs, completed])

  return (
    <div className="fade">
      <div className="section-title">Riepilogo</div>
      <div className="stat-grid">
        <div className="stat"><div className="k">Allenamenti completati</div><div className="v">{data.sessions}</div></div>
        <div className="stat"><div className="k">Volume totale</div><div className="v">{fmt(data.totalTonnage)}<small> kg</small></div></div>
        <div className="stat"><div className="k">Serie registrate</div><div className="v">{data.totalSets}</div></div>
        <div className="stat"><div className="k">Settimana corrente</div><div className="v">{data.currentWeek}<small>/{program.weeks.length}</small></div></div>
      </div>

      {data.tonnageSeries.length > 0 ? (
        <>
          <div className="section-title">Volume per seduta (kg sollevati)</div>
          <div className="card">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.tonnageSeries} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={ACCENT} /><stop offset="100%" stopColor={ACCENT2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25304e" />
                  <XAxis dataKey="label" stroke="#8b96b8" fontSize={11} />
                  <YAxis stroke="#8b96b8" fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="tonnage" stroke="url(#g1)" strokeWidth={3} dot={{ r: 3, fill: ACCENT2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section-title">Serie per gruppo muscolare</div>
          <div className="card">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.muscleSeries} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25304e" vertical={false} />
                  <XAxis dataKey="muscle" stroke="#8b96b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis stroke="#8b96b8" fontSize={11} />
                  <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(124,92,255,0.1)' }} />
                  <Bar dataKey="sets" radius={[6, 6, 0, 0]}>
                    {data.muscleSeries.map((_, i) => <Cell key={i} fill={i % 2 ? ACCENT2 : ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="card empty">
          <div className="big">📊</div>
          <div>Registra il tuo primo allenamento per vedere i grafici dei progressi.</div>
        </div>
      )}

      <BodyweightTracker state={state} setState={setState} />
    </div>
  )
}

function BodyweightTracker({ state, setState }) {
  const [val, setVal] = useState('')
  const bw = state.bodyweight || []

  const add = () => {
    const v = parseFloat(val.replace(',', '.'))
    if (!v) return
    const entry = { date: new Date().toISOString().slice(0, 10), value: v }
    setState((s) => ({ ...s, bodyweight: [...(s.bodyweight || []), entry] }))
    setVal('')
  }

  return (
    <>
      <div className="section-title">Peso corporeo</div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: bw.length ? 14 : 0 }}>
          <input className="in" inputMode="decimal" placeholder="es. 78.5 kg" value={val} onChange={(e) => setVal(e.target.value)} />
          <button className="btn" style={{ width: 'auto', padding: '0 20px' }} onClick={add}>＋</button>
        </div>
        {bw.length > 1 && (
          <div className="chart-wrap" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bw.map((b) => ({ label: b.date.slice(5), value: b.value }))} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#25304e" />
                <XAxis dataKey="label" stroke="#8b96b8" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#8b96b8" fontSize={11} />
                <Tooltip contentStyle={tip} />
                <Line type="monotone" dataKey="value" stroke={ACCENT2} strokeWidth={3} dot={{ r: 3, fill: ACCENT }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {bw.length === 1 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Aggiungi almeno 2 misurazioni per vedere l'andamento.</div>}
      </div>
    </>
  )
}

function computeStats(program, logs, completed) {
  let totalTonnage = 0, totalSets = 0, sessions = 0
  const muscleSets = {}
  const tonnageSeries = []

  program.weeks.forEach((wk) => {
    wk.days.forEach((day, di) => {
      const dk = dayKey(wk.week, di)
      if (!completed[dk]) return
      sessions++
      let sessionTon = 0
      day.exercises.forEach((ex) => {
        const log = logs[logKey(wk.week, di, ex.id)]
        if (!log) return
        log.forEach((s) => {
          const w = parseFloat(s.weight) || 0
          const r = parseInt(s.reps) || 0
          if (r > 0) { totalSets++; muscleSets[ex.muscle] = (muscleSets[ex.muscle] || 0) + 1 }
          sessionTon += w * r
        })
      })
      totalTonnage += sessionTon
      tonnageSeries.push({ label: `S${wk.week}G${di + 1}`, tonnage: Math.round(sessionTon) })
    })
  })

  const currentWeek = firstIncompleteWeek(program, completed)
  const muscleSeries = Object.entries(muscleSets).map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets)

  return { totalTonnage, totalSets, sessions, tonnageSeries, muscleSeries, currentWeek }
}

function firstIncompleteWeek(program, completed) {
  for (const w of program.weeks) {
    const allDone = w.days.every((_, i) => completed[dayKey(w.week, i)])
    if (!allDone) return w.week
  }
  return program.weeks.length
}

const tip = { background: '#1d0c38', border: '2px solid #4a2b7a', borderRadius: 8, color: '#f3e9ff', fontSize: 13, fontFamily: 'VT323, monospace' }
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n)
