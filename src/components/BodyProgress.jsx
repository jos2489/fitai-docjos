import React, { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useLang } from '../i18n.jsx'

const tip = { background: '#1d0c38', border: '2px solid #4a2b7a', borderRadius: 8, color: '#f3e9ff', fontSize: 13, fontFamily: 'VT323, monospace' }
const FIELDS = [['vita', 'waist'], ['braccio', 'arm'], ['coscia', 'thigh'], ['petto', 'chest'], ['fianchi', 'hips']]

export function Measurements({ state, setState }) {
  const { t } = useLang()
  const list = state.measurements || []
  const [form, setForm] = useState({})
  const [sel, setSel] = useState('vita')
  const [msg, setMsg] = useState('')

  const save = () => {
    const entry = { date: new Date().toISOString().slice(0, 10) }
    let any = false
    FIELDS.forEach(([k]) => { const v = parseFloat(String(form[k] || '').replace(',', '.')); if (v) { entry[k] = v; any = true } })
    if (!any) return
    setState((s) => ({ ...s, measurements: [...(s.measurements || []), entry] }))
    setForm({}); setMsg(t('measureSaved')); setTimeout(() => setMsg(''), 3000)
  }

  const series = list.filter((m) => m[sel] != null).map((m) => ({ label: m.date.slice(5), value: m[sel] }))

  return (
    <>
      <div className="section-title">{t('measures')}</div>
      <div className="card">
        <div className="sub">{t('measuresHint')}</div>
        <div className="measure-grid">
          {FIELDS.map(([k, key]) => (
            <label key={k} className="field" style={{ marginBottom: 0 }}>
              <span>{t(key)} (cm)</span>
              <input className="in" inputMode="decimal" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={save}>{t('saveMeasure')}</button>
        {msg && <div className="aigen" style={{ color: 'var(--good)' }}>{msg}</div>}

        {list.length > 0 && (
          <>
            <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginTop: 14 }}>
              {FIELDS.map(([k, key]) => (
                <button key={k} className={'opt' + (sel === k ? ' active' : '')} style={{ alignItems: 'center', textAlign: 'center', padding: 8 }} onClick={() => setSel(k)}>
                  <span className="lbl" style={{ fontSize: 8 }}>{t(key)}</span>
                </button>
              ))}
            </div>
            {series.length > 1 && (
              <div className="chart-wrap" style={{ height: 180, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#25304e" />
                    <XAxis dataKey="label" stroke="#8b96b8" fontSize={11} />
                    <YAxis domain={['auto', 'auto']} stroke="#8b96b8" fontSize={11} />
                    <Tooltip contentStyle={tip} />
                    <Line type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={3} dot={{ r: 3, fill: '#ff2d95' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function compressImage(file, maxW = 440, q = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      let out
      try { out = c.toDataURL('image/webp', q) } catch { out = c.toDataURL('image/jpeg', q) }
      resolve(out)
    }
    img.onerror = reject
    img.src = url
  })
}

export function ProgressPhotos({ state, setState }) {
  const { t } = useLang()
  const photos = state.photos || []
  const [view, setView] = useState(null)
  const [err, setErr] = useState('')

  const onAdd = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    setErr('')
    const img = await compressImage(file)
    const entry = { id: Math.random().toString(36).slice(2, 9), date: new Date().toISOString().slice(0, 10), img }
    // guardia spazio: stima dimensione prima di salvare
    const projected = JSON.stringify({ ...state, photos: [...photos, entry] }).length
    if (projected > 4_500_000) { setErr(t('storageFull')); return }
    setState((s) => ({ ...s, photos: [...(s.photos || []), entry] }))
  }
  const del = (id) => { if (confirm(t('deletePhoto'))) setState((s) => ({ ...s, photos: (s.photos || []).filter((p) => p.id !== id) })) }

  return (
    <>
      <div className="section-title">{t('photos')}</div>
      <div className="card">
        <div className="sub">{t('photosHint')}</div>
        <label className="btn secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
          {t('addPhoto')}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAdd} />
        </label>
        {err && <div className="aigen" style={{ color: 'var(--bad)' }}>{err}</div>}
        {photos.length > 0 && (
          <div className="photo-grid">
            {photos.slice().reverse().map((p) => (
              <div key={p.id} className="photo-thumb" onClick={() => setView(p)}>
                <img src={p.img} alt={p.date} />
                <span>{p.date.slice(5)}</span>
                <button className="photo-del" onClick={(e) => { e.stopPropagation(); del(p.id) }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {view && (
        <div className="photo-view" onClick={() => setView(null)}>
          <img src={view.img} alt={view.date} />
          <div className="photo-view-date">{view.date}</div>
        </div>
      )}
    </>
  )
}
