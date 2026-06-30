import React, { useState } from 'react'
import { useLang } from '../i18n.jsx'
import {
  uid, todayKey, dayPlannedKcal, mealKcal, dayEatenKcal,
  parseDietCSV, searchFood, searchLocal, kcalFor, parseDietWithAI, estimateKcalAI,
} from '../nutrition.js'

export default function Nutrition({ state, setState }) {
  const { t } = useLang()
  const [sub, setSub] = useState('today')
  return (
    <div className="fade">
      <div className="hero">
        <div className="glow" />
        <h1>🍎 NUTRIZIONE</h1>
        <p>{t('planned')} vs {t('eaten')}: tieni sotto controllo le calorie del giorno, sgarro incluso.</p>
      </div>
      <div className="opt-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
        <button className={'opt' + (sub === 'today' ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setSub('today')}><span className="lbl">{t('nutToday')}</span></button>
        <button className={'opt' + (sub === 'plan' ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center' }} onClick={() => setSub('plan')}><span className="lbl">{t('nutPlan')}</span></button>
      </div>
      {sub === 'today' ? <Today state={state} setState={setState} /> : <Plan state={state} setState={setState} />}
    </div>
  )
}

// ============================ OGGI (tracker) ============================
function Today({ state, setState }) {
  const { t } = useLang()
  const diet = state.diet
  const date = todayKey()
  const log = (state.nutritionLog || {})[date] || { planDayId: diet ? diet.days[0]?.id : null, eaten: {}, extras: [] }
  const [adding, setAdding] = useState(false)

  const setLog = (next) => setState((s) => ({ ...s, nutritionLog: { ...(s.nutritionLog || {}), [date]: next } }))

  if (!diet || !diet.days.length) {
    return <div className="card empty"><div className="big">🍽️</div><div>{t('noDietSub')}</div></div>
  }

  const planDay = diet.days.find((d) => d.id === log.planDayId) || diet.days[0]
  const planned = dayPlannedKcal(planDay)
  const eaten = dayEatenKcal(planDay, log)
  const diff = eaten - planned

  const toggleFood = (fid) => setLog({ ...log, eaten: { ...log.eaten, [fid]: !log.eaten[fid] } })
  const addExtra = (food) => { setLog({ ...log, extras: [...(log.extras || []), { ...food, id: uid() }] }); setAdding(false) }
  const removeExtra = (id) => setLog({ ...log, extras: (log.extras || []).filter((e) => e.id !== id) })

  return (
    <div className="fade">
      <div className="section-title" style={{ marginTop: 4 }}>{t('planDay')}</div>
      <div className="weeks">
        {diet.days.map((d) => (
          <button key={d.id} className={'week-pill' + (d.id === planDay.id ? ' active' : '')} onClick={() => setLog({ ...log, planDayId: d.id })}>{d.name}</button>
        ))}
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="stat"><div className="k">{t('planned')}</div><div className="v">{planned}<small> kcal</small></div></div>
        <div className="stat"><div className="k">{t('eaten')}</div><div className="v" style={{ color: 'var(--amber)' }}>{eaten}<small> kcal</small></div></div>
        <div className="stat"><div className="k">{t('diff')}</div><div className="v" style={{ color: diff > 0 ? 'var(--bad)' : 'var(--good)' }}>{diff > 0 ? '+' : ''}{diff}</div></div>
      </div>

      {planDay.meals.map((meal) => (
        <div className="ex" key={meal.id}>
          <div className="ex-head"><div><div className="name">{meal.name}</div><div className="ex-prescription">{mealKcal(meal)} kcal</div></div></div>
          {meal.foods.map((f) => (
            <label key={f.id} className="food-row">
              <input type="checkbox" checked={!!log.eaten[f.id]} onChange={() => toggleFood(f.id)} />
              <span className="food-name">{f.name} {f.qty && <small>· {f.qty}</small>}</span>
              <span className="food-kcal">{f.kcal} kcal</span>
            </label>
          ))}
        </div>
      ))}

      <div className="section-title">{t('extras')}</div>
      <div className="card">
        {(log.extras || []).map((e) => (
          <div className="food-row" key={e.id}>
            <span className="food-name">{e.name} {e.qty && <small>· {e.qty}</small>}</span>
            <span className="food-kcal">{e.kcal} kcal</span>
            <button className="rm" onClick={() => removeExtra(e.id)}>×</button>
          </div>
        ))}
        {adding ? <FoodPicker apiKey={state.anthropicKey} onAdd={addExtra} onCancel={() => setAdding(false)} />
          : <button className="addset" onClick={() => setAdding(true)}>{t('addExtra')}</button>}
      </div>
    </div>
  )
}

// ============================ PIANO (editor) ============================
function Plan({ state, setState }) {
  const { t, lang } = useLang()
  const diet = state.diet
  const [picker, setPicker] = useState(null) // {dayId, mealId}
  const [key, setKey] = useState(state.anthropicKey || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const setDiet = (d) => setState((s) => ({ ...s, diet: d }))

  const createEmpty = () => setDiet({ name: t('dietName'), days: [{ id: uid(), name: lang === 'en' ? 'Day 1' : 'Giorno 1', meals: [] }] })
  const addDay = () => setDiet({ ...diet, days: [...diet.days, { id: uid(), name: `${lang === 'en' ? 'Day' : 'Giorno'} ${diet.days.length + 1}`, meals: [] }] })
  const addMeal = (dayId) => setDiet({ ...diet, days: diet.days.map((d) => d.id === dayId ? { ...d, meals: [...d.meals, { id: uid(), name: lang === 'en' ? 'Meal' : 'Pasto', foods: [] }] } : d) })
  const renameDay = (dayId, name) => setDiet({ ...diet, days: diet.days.map((d) => d.id === dayId ? { ...d, name } : d) })
  const renameMeal = (dayId, mealId, name) => setDiet({ ...diet, days: diet.days.map((d) => d.id === dayId ? { ...d, meals: d.meals.map((m) => m.id === mealId ? { ...m, name } : m) } : d) })
  const addFood = (dayId, mealId, food) => { setDiet({ ...diet, days: diet.days.map((d) => d.id === dayId ? { ...d, meals: d.meals.map((m) => m.id === mealId ? { ...m, foods: [...m.foods, { ...food, id: uid() }] } : m) } : d) }); setPicker(null) }
  const removeFood = (dayId, mealId, fid) => setDiet({ ...diet, days: diet.days.map((d) => d.id === dayId ? { ...d, meals: d.meals.map((m) => m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== fid) } : m) } : d) })
  const reset = () => { if (confirm(lang === 'en' ? 'Delete the whole diet?' : 'Eliminare tutta la dieta?')) setState((s) => ({ ...s, diet: null })) }

  const onCSV = (e) => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => { const d = parseDietCSV(String(r.result)); if (d) setDiet(d); else setErr('CSV non valido') }
    r.readAsText(file)
    e.target.value = ''
  }
  const onAI = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    if (!key) { setErr(t('needKey')); return }
    setErr(''); setBusy(true)
    try { const d = await parseDietWithAI(file, key, lang); setDiet(d) }
    catch (ex) { setErr(t('readError') + ': ' + ex.message) }
    setBusy(false)
  }
  const saveKey = () => setState((s) => ({ ...s, anthropicKey: key.trim() }))

  return (
    <div className="fade">
      {!diet ? (
        <div className="card">
          <div className="sub">{t('noDietSub')}</div>
          <button className="btn" onClick={createEmpty}>{t('createDiet')}</button>
          <div style={{ height: 10 }} />
          <label className="btn secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            {t('importCsv')}<input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onCSV} />
          </label>
          <div className="csv-hint">{t('csvHint')}</div>
        </div>
      ) : (
        <>
          {diet.days.map((day) => (
            <div className="card" key={day.id}>
              <input className="in day-name-in" value={day.name} onChange={(e) => renameDay(day.id, e.target.value)} placeholder={t('dayNamePh')} />
              {day.meals.map((meal) => (
                <div className="meal-block" key={meal.id}>
                  <input className="in meal-name-in" value={meal.name} onChange={(e) => renameMeal(day.id, meal.id, e.target.value)} placeholder={t('mealNamePh')} />
                  {meal.foods.map((f) => (
                    <div className="food-row" key={f.id}>
                      <span className="food-name">{f.name} {f.qty && <small>· {f.qty}</small>}</span>
                      <span className="food-kcal">{f.kcal} kcal</span>
                      <button className="rm" onClick={() => removeFood(day.id, meal.id, f.id)}>×</button>
                    </div>
                  ))}
                  {picker && picker.dayId === day.id && picker.mealId === meal.id
                    ? <FoodPicker apiKey={state.anthropicKey} onAdd={(food) => addFood(day.id, meal.id, food)} onCancel={() => setPicker(null)} />
                    : <button className="addset" onClick={() => setPicker({ dayId: day.id, mealId: meal.id })}>{t('addFood')}</button>}
                </div>
              ))}
              <button className="addset alt" style={{ marginTop: 8 }} onClick={() => addMeal(day.id)}>{t('addMeal')}</button>
            </div>
          ))}
          <button className="btn secondary" onClick={addDay}>{t('addDay')}</button>
          <div style={{ height: 10 }} />
          <button className="btn ghost" onClick={reset}>{t('resetDiet')}</button>
        </>
      )}

      {/* import + AI */}
      {diet && (
        <div className="card" style={{ marginTop: 14 }}>
          <label className="btn secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            {t('importCsv')}<input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onCSV} />
          </label>
          <div className="csv-hint">{t('csvHint')}</div>
        </div>
      )}

      <div className="section-title">{t('aiKeyTitle')}</div>
      <div className="card">
        <div className="sub">{t('aiKeySub')}</div>
        <label className="btn" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', opacity: busy ? 0.5 : 1, marginBottom: 12 }}>
          {busy ? t('reading') : t('aiRead')}
          <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onAI} disabled={busy} />
        </label>
        <input className="in" type="password" value={key} placeholder={t('keyPh')} onChange={(e) => setKey(e.target.value)} />
        <button className="btn secondary" style={{ marginTop: 8 }} onClick={saveKey}>{t('saveKey')}</button>
        {err && <div className="aigen" style={{ color: 'var(--bad)' }}>{err}</div>}
      </div>
      <div style={{ height: 10 }} />
    </div>
  )
}

// ============================ Food picker ============================
function FoodPicker({ onAdd, onCancel, apiKey }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState(null)   // {name, kcal100}
  const [grams, setGrams] = useState('')
  const [manual, setManual] = useState({ name: '', qty: '', kcal: '' })
  const [aiBusy, setAiBusy] = useState(false)
  const [aiErr, setAiErr] = useState('')

  const doSearch = async () => {
    if (!q.trim()) return
    setBusy(true); setResults(null); setSel(null)
    const local = searchLocal(q).map((r) => ({ name: r.name, kcal100: r.kcal100, src: 'tab' }))
    let off = []
    try { off = (await searchFood(q)).map((r) => ({ ...r, src: 'off' })) } catch { /* rete */ }
    setResults([...local, ...off])
    setBusy(false)
  }

  const aiEstimate = async () => {
    if (!manual.name) return
    setAiErr(''); setAiBusy(true)
    try { const kcal = await estimateKcalAI(manual.name, manual.qty, apiKey, lang); setManual((m) => ({ ...m, kcal: String(kcal) })) }
    catch (e) { setAiErr(String(e.message || e)) }
    setAiBusy(false)
  }

  return (
    <div className="picker fade">
      <div className="picker-row">
        <input className="in" value={q} placeholder={t('searchFood')} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
        <button className="btn secondary" style={{ width: 'auto', padding: '0 14px' }} onClick={doSearch}>🔍</button>
      </div>
      {busy && <div className="csv-hint">{t('searching')}</div>}
      {results && results.length > 0 && !sel && results.map((r, i) => (
        <button key={i} className="alt-opt" onClick={() => setSel(r)}>
          <span>{r.src === 'tab' ? '📋 ' : ''}{r.name}</span><span className="alt-type">{r.kcal100} kcal/100g</span>
        </button>
      ))}
      {results && results.length === 0 && !sel && <div className="csv-hint">{t('noResults')}</div>}

      {sel && (
        <div className="picker-row" style={{ marginTop: 8 }}>
          <span style={{ flex: 1, fontSize: 15 }}>{sel.name}</span>
          <input className="in" style={{ width: 80 }} inputMode="numeric" placeholder="g" value={grams} onChange={(e) => setGrams(e.target.value)} />
          <button className="btn" style={{ width: 'auto', padding: '0 14px' }} disabled={!grams} onClick={() => onAdd({ name: sel.name.split(' · ')[0], qty: grams + ' g', kcal: kcalFor(sel.kcal100, grams) })}>{t('add')}</button>
        </div>
      )}

      <div className="csv-hint" style={{ marginTop: 10 }}>— {t('manualEntry')} —</div>
      <div className="picker-row">
        <input className="in" placeholder={t('foodName')} value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
      </div>
      <div className="picker-row" style={{ marginTop: 6 }}>
        <input className="in" style={{ width: 90 }} inputMode="numeric" placeholder={t('grams')} value={manual.qty} onChange={(e) => setManual({ ...manual, qty: e.target.value })} />
        <input className="in" style={{ width: 80 }} inputMode="numeric" placeholder={t('kcal')} value={manual.kcal} onChange={(e) => setManual({ ...manual, kcal: e.target.value })} />
        <button className="btn" style={{ width: 'auto', padding: '0 14px' }} disabled={!manual.name || !manual.kcal} onClick={() => onAdd({ name: manual.name, qty: manual.qty ? manual.qty + ' g' : '', kcal: parseInt(manual.kcal) || 0 })}>{t('add')}</button>
      </div>
      {apiKey ? (
        <button className="addset alt" style={{ marginTop: 6 }} disabled={!manual.name || aiBusy} onClick={aiEstimate}>{aiBusy ? t('estimating') : t('aiEstimate')}</button>
      ) : null}
      {aiErr && <div className="csv-hint" style={{ color: 'var(--bad)' }}>{aiErr}</div>}
      <button className="addset" style={{ marginTop: 8 }} onClick={onCancel}>{t('cancel')}</button>
    </div>
  )
}
