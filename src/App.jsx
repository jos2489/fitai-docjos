import React, { useEffect, useRef, useState } from 'react'
import { loadState, saveState } from './storage.js'
import { autoWrite } from './filebackup.js'
import { LangProvider, useLang } from './i18n.jsx'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import Workout from './components/Workout.jsx'
import Stats from './components/Stats.jsx'
import History from './components/History.jsx'
import Wod from './components/Wod.jsx'
import Nutrition from './components/Nutrition.jsx'
import Profile from './components/Profile.jsx'

export default function App() {
  const [state, setState] = useState(loadState)
  const setLang = (lang) => setState((s) => ({ ...s, lang }))

  // salva ad ogni cambiamento (localStorage)
  useEffect(() => { saveState(state) }, [state])

  // salvataggio automatico su file (se attivo): sovrascrive lo stesso file,
  // con un piccolo ritardo per non scrivere ad ogni tasto.
  const abTimer = useRef(null)
  useEffect(() => {
    if (!state.program) return
    clearTimeout(abTimer.current)
    abTimer.current = setTimeout(() => { autoWrite(state) }, 1200)
    return () => clearTimeout(abTimer.current)
  }, [state])

  return (
    <LangProvider lang={state.lang || 'it'} setLang={setLang}>
      <Shell state={state} setState={setState} />
    </LangProvider>
  )
}

function Shell({ state, setState }) {
  const { t } = useLang()
  const [tab, setTab] = useState('home')
  const [workout, setWorkout] = useState(null)
  const [profileFocus, setProfileFocus] = useState(null)

  // nessun programma -> onboarding
  if (!state.program) {
    return <Onboarding
      onCreate={(program) => {
        const w = parseFloat(String(program.profile.weight).replace(',', '.'))
        const seed = w ? [{ date: new Date().toISOString().slice(0, 10), value: w }] : []
        setState((s) => ({ ...s, program, bodyweight: seed }))
      }}
      onRestore={(data) => setState((s) => ({ ...s, ...data }))}
    />
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

      {tab === 'home' && <Home state={state} setState={setState} onOpenDay={(week, dayIdx) => setWorkout({ week, dayIdx })} onPersonalize={() => { setProfileFocus('perso'); setTab('profile') }} />}
      {tab === 'stats' && <Stats state={state} setState={setState} />}
      {tab === 'history' && <History state={state} />}
      {tab === 'wod' && <Wod state={state} />}
      {tab === 'nutrition' && <Nutrition state={state} setState={setState} />}
      {tab === 'profile' && <Profile state={state} setState={setState} focus={profileFocus} onFocusDone={() => setProfileFocus(null)} />}

      <nav className="nav">
        <NavBtn id="home" tab={tab} setTab={setTab} ic="🗓️" label={t('plan')} />
        <NavBtn id="nutrition" tab={tab} setTab={setTab} ic="🍎" label={t('diet')} />
        <NavBtn id="wod" tab={tab} setTab={setTab} ic="🔥" label="WOD" />
        <NavBtn id="stats" tab={tab} setTab={setTab} ic="📈" label={t('progress')} />
        <NavBtn id="history" tab={tab} setTab={setTab} ic="📖" label={t('history')} />
        <NavBtn id="profile" tab={tab} setTab={setTab} ic="⚙️" label={t('profile')} />
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
