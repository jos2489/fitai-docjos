// ============================================================================
//  FitAi — Motore Nutrizione
//  Gestione piano alimentare, calorie da Open Food Facts (gratis, senza chiave),
//  e confronto pianificato vs realmente mangiato.
// ============================================================================

export const uid = () => Math.random().toString(36).slice(2, 9)
export const todayKey = () => new Date().toISOString().slice(0, 10)

// --- Totali ----------------------------------------------------------------
export function dayPlannedKcal(planDay) {
  if (!planDay) return 0
  return planDay.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + (parseFloat(f.kcal) || 0), 0), 0)
}
export function mealKcal(meal) {
  return meal.foods.reduce((s, f) => s + (parseFloat(f.kcal) || 0), 0)
}
// kcal effettivamente mangiate: cibi pianificati spuntati + extra (sgarro)
export function dayEatenKcal(planDay, log) {
  let eaten = 0
  if (planDay) {
    planDay.meals.forEach((m) => m.foods.forEach((f) => {
      if (log && log.eaten && log.eaten[f.id]) eaten += parseFloat(f.kcal) || 0
    }))
  }
  if (log && log.extras) log.extras.forEach((e) => { eaten += parseFloat(e.kcal) || 0 })
  return eaten
}

// --- Import CSV ------------------------------------------------------------
// Formato atteso (intestazione flessibile): giorno, pasto, alimento, quantità, kcal
export function parseDietCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null
  const sep = lines[0].includes(';') ? ';' : ','
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim())
  const idx = (names) => header.findIndex((h) => names.some((n) => h.includes(n)))
  const ci = { day: idx(['giorno', 'day']), meal: idx(['pasto', 'meal']), food: idx(['alimento', 'cibo', 'food']), qty: idx(['quant', 'grammi', 'qty', 'grams', 'g']), kcal: idx(['kcal', 'calor', 'cal']) }
  // se manca l'intestazione, assume ordine fisso
  const hasHeader = ci.food >= 0 || ci.kcal >= 0
  const rows = hasHeader ? lines.slice(1) : lines
  const order = hasHeader ? ci : { day: 0, meal: 1, food: 2, qty: 3, kcal: 4 }
  const days = []
  const dayMap = {}
  for (const line of rows) {
    const cols = line.split(sep).map((c) => c.trim())
    const dayName = cols[order.day] || 'Giorno 1'
    const mealName = cols[order.meal] || 'Pasto'
    const foodName = cols[order.food] || ''
    if (!foodName) continue
    const qty = cols[order.qty] || ''
    const kcal = parseFloat((cols[order.kcal] || '').replace(',', '.')) || 0
    if (!dayMap[dayName]) { dayMap[dayName] = { id: uid(), name: dayName, meals: [], _m: {} }; days.push(dayMap[dayName]) }
    const d = dayMap[dayName]
    if (!d._m[mealName]) { d._m[mealName] = { id: uid(), name: mealName, foods: [] }; d.meals.push(d._m[mealName]) }
    d._m[mealName].foods.push({ id: uid(), name: foodName, qty, kcal })
  }
  days.forEach((d) => { delete d._m })
  return days.length ? { name: 'Dieta importata', days } : null
}

// --- Open Food Facts: ricerca cibo (gratis, senza chiave) ------------------
// Ritorna [{name, kcal100}] con kcal per 100g.
export async function searchFood(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments`
  const res = await fetch(url)
  if (!res.ok) throw new Error('rete')
  const data = await res.json()
  return (data.products || [])
    .map((p) => {
      const kcal100 = p.nutriments && (p.nutriments['energy-kcal_100g'] ?? p.nutriments['energy-kcal'])
      const name = [p.product_name, p.brands].filter(Boolean).join(' · ')
      return kcal100 && name ? { name: name.slice(0, 60), kcal100: Math.round(kcal100) } : null
    })
    .filter(Boolean)
    .slice(0, 6)
}

export const kcalFor = (kcal100, grams) => Math.round((parseFloat(kcal100) || 0) * (parseFloat(grams) || 0) / 100)

// --- Auto-lettura AI (opzionale, con chiave Anthropic LOCALE) ---------------
// La chiave resta sul dispositivo; la chiamata parte dal browser direttamente
// verso Anthropic (header di accesso diretto). Usa Claude Haiku (economico).
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export async function parseDietWithAI(file, apiKey, lang = 'it') {
  const b64 = await fileToBase64(file)
  const isPdf = file.type === 'application/pdf'
  const source = { type: 'base64', media_type: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'), data: b64 }
  const block = isPdf ? { type: 'document', source } : { type: 'image', source }
  const prompt = 'Estrai questa dieta in JSON valido. Schema esatto: {"name": string, "days":[{"name": string, "meals":[{"name": string, "foods":[{"name": string, "qty": string, "kcal": number}]}]}]}. "qty" è la quantità con unità (es. "80 g"). Stima le kcal se non indicate. Rispondi SOLO con il JSON, senza testo prima o dopo.'
  const body = { model: 'claude-haiku-4-5', max_tokens: 4000, messages: [{ role: 'user', content: [block, { type: 'text', text: prompt }] }] }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`API ${res.status}: ${e.slice(0, 160)}`)
  }
  const data = await res.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  const m = text.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(m ? m[0] : text)
  return {
    name: parsed.name || 'Dieta',
    days: (parsed.days || []).map((d) => ({
      id: uid(), name: d.name || 'Giorno',
      meals: (d.meals || []).map((meal) => ({
        id: uid(), name: meal.name || 'Pasto',
        foods: (meal.foods || []).map((f) => ({ id: uid(), name: f.name || '', qty: String(f.qty || ''), kcal: Math.round(f.kcal || 0) })),
      })),
    })),
  }
}
