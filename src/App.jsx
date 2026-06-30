import React, { useEffect, useMemo, useState } from 'react'
import { loadState, saveState } from './storage.js'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import Workout from './components/Workout.jsx'
import Stats from './components/Stats.jsx'
import History from './components/History.jsx'
import Wod from './components/Wod.jsx'
import Profile from './components/Profile.jsx'

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('home')          // home | stats | profile
  const [workout, setWorkout] = useState(null)     // { week, dayIdx } quando si allena

  // salva ad ogni cambiamento
  useEffect(() => { saveState(state) }, [state])

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  // nessun programma -> onboarding
  if (!state.program) {
    return <Onboarding onCreate={(program) => {
      const w = parseFloat(String(program.profile.weight).replace(',', '.'))
      const seed = w ? [{ date: new Date().toISOString().slice(0, 10), value: w }] : []
      setState((s) => ({ ...s, program, bodyweight: seed }))
    }} />
  }

  // schermata di allenamento (logging)
  if (workout) {
    return (
      <Workout
        state={state}
        setState={setState}
        week={workout.week}
        dayIdx={workout.dayIdx}
        onBack={() => setWorkout(null)}
      />
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">⚡</span>
          <span>Fit<span className="ai">Ai</span><small className="byline">by Doc Jos</small></span>
        </div>
      </div>

      {tab === 'home' && <Home state={state} setState={setState} onOpenDay={(week, dayIdx) => setWorkout({ week, dayIdx })} />}
      {tab === 'stats' && <Stats state={state} setState={setState} />}
      {tab === 'history' && <History state={state} />}
      {tab === 'wod' && <Wod state={state} />}
      {tab === 'profile' && <Profile state={state} setState={setState} />}

      <nav className="nav">
        <NavBtn id="home" tab={tab} setTab={setTab} ic="🗓️" label="Piano" />
        <NavBtn id="wod" tab={tab} setTab={setTab} ic="🔥" label="WOD" />
        <NavBtn id="stats" tab={tab} setTab={setTab} ic="📈" label="Progressi" />
        <NavBtn id="history" tab={tab} setTab={setTab} ic="📖" label="Storico" />
        <NavBtn id="profile" tab={tab} setTab={setTab} ic="⚙️" label="Profilo" />
      </nav>
    </div>
  )
}

function NavBtn({ id, tab, setTab, ic, label }) {
  return (
    <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
      <span className="ic">{ic}</span>
      <span>{label}</span>
    </button>
  )
}
