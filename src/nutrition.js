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

// --- Tabella alimenti/piatti comuni (kcal per 100g) ------------------------
// Curata per i cibi freschi e i piatti italiani dove Open Food Facts è debole.
// p/c/f = proteine, carboidrati, grassi (grammi per 100g)
export const COMMON_FOODS = [
  { name: 'Pizza margherita', en: 'Margherita pizza', kcal100: 270, p: 11, c: 33, f: 10 },
  { name: 'Pizza diavola', en: 'Spicy salami pizza', kcal100: 280, p: 12, c: 30, f: 12 },
  { name: 'Focaccia', en: 'Focaccia', kcal100: 290, p: 7, c: 46, f: 9 },
  { name: 'Pasta al pomodoro (cotta)', en: 'Pasta with tomato (cooked)', kcal100: 130, p: 4, c: 25, f: 2 },
  { name: 'Pasta in bianco (cotta)', en: 'Plain pasta (cooked)', kcal100: 160, p: 5, c: 31, f: 1 },
  { name: 'Pasta al ragù (cotta)', en: 'Pasta with meat sauce', kcal100: 170, p: 7, c: 24, f: 5 },
  { name: 'Lasagne', en: 'Lasagna', kcal100: 135, p: 8, c: 12, f: 6 },
  { name: 'Risotto', en: 'Risotto', kcal100: 160, p: 4, c: 25, f: 5 },
  { name: 'Riso bianco (cotto)', en: 'White rice (cooked)', kcal100: 130, p: 2.7, c: 28, f: 0.3 },
  { name: 'Pane', en: 'Bread', kcal100: 270, p: 9, c: 49, f: 3 },
  { name: 'Pane integrale', en: 'Wholemeal bread', kcal100: 240, p: 9, c: 41, f: 3 },
  { name: 'Fette biscottate', en: 'Rusks', kcal100: 410, p: 11, c: 72, f: 6 },
  { name: 'Fiocchi d\'avena', en: 'Oats', kcal100: 370, p: 13, c: 60, f: 7 },
  { name: 'Cornetto/brioche', en: 'Croissant', kcal100: 400, p: 8, c: 46, f: 20 },
  { name: 'Petto di pollo (cotto)', en: 'Chicken breast (cooked)', kcal100: 165, p: 31, c: 0, f: 3.6 },
  { name: 'Fesa di tacchino', en: 'Turkey breast', kcal100: 110, p: 22, c: 1, f: 2 },
  { name: 'Manzo magro (cotto)', en: 'Lean beef (cooked)', kcal100: 250, p: 26, c: 0, f: 15 },
  { name: 'Hamburger (carne)', en: 'Beef burger patty', kcal100: 250, p: 26, c: 0, f: 17 },
  { name: 'Salmone', en: 'Salmon', kcal100: 208, p: 20, c: 0, f: 13 },
  { name: 'Tonno al naturale', en: 'Tuna in water', kcal100: 116, p: 26, c: 0, f: 1 },
  { name: 'Merluzzo/nasello', en: 'Cod', kcal100: 82, p: 18, c: 0, f: 0.7 },
  { name: 'Uovo', en: 'Egg', kcal100: 155, p: 13, c: 1.1, f: 11 },
  { name: 'Prosciutto crudo', en: 'Cured ham', kcal100: 270, p: 26, c: 0, f: 18 },
  { name: 'Prosciutto cotto', en: 'Cooked ham', kcal100: 145, p: 20, c: 1, f: 7 },
  { name: 'Bresaola', en: 'Bresaola', kcal100: 150, p: 32, c: 0, f: 2 },
  { name: 'Mozzarella', en: 'Mozzarella', kcal100: 250, p: 18, c: 1, f: 19 },
  { name: 'Parmigiano', en: 'Parmesan', kcal100: 392, p: 36, c: 0, f: 29 },
  { name: 'Ricotta', en: 'Ricotta', kcal100: 146, p: 11, c: 3, f: 10 },
  { name: 'Yogurt greco', en: 'Greek yogurt', kcal100: 59, p: 10, c: 3.6, f: 0.4 },
  { name: 'Yogurt intero', en: 'Whole yogurt', kcal100: 61, p: 3.5, c: 4.7, f: 3.3 },
  { name: 'Latte intero', en: 'Whole milk', kcal100: 64, p: 3.2, c: 4.8, f: 3.6 },
  { name: 'Latte parz. scremato', en: 'Semi-skimmed milk', kcal100: 46, p: 3.3, c: 4.9, f: 1.6 },
  { name: 'Patate lesse', en: 'Boiled potatoes', kcal100: 80, p: 2, c: 17, f: 0.1 },
  { name: 'Patatine fritte', en: 'French fries', kcal100: 312, p: 3.4, c: 41, f: 15 },
  { name: 'Patatine in busta', en: 'Potato chips', kcal100: 536, p: 6, c: 53, f: 34 },
  { name: 'Insalata', en: 'Salad greens', kcal100: 20, p: 1.4, c: 2, f: 0.2 },
  { name: 'Pomodoro', en: 'Tomato', kcal100: 18, p: 0.9, c: 3.9, f: 0.2 },
  { name: 'Zucchine', en: 'Zucchini', kcal100: 17, p: 1.2, c: 3.1, f: 0.3 },
  { name: 'Broccoli', en: 'Broccoli', kcal100: 34, p: 2.8, c: 7, f: 0.4 },
  { name: 'Carote', en: 'Carrots', kcal100: 41, p: 0.9, c: 10, f: 0.2 },
  { name: 'Spinaci', en: 'Spinach', kcal100: 23, p: 2.9, c: 3.6, f: 0.4 },
  { name: 'Fagioli (cotti)', en: 'Beans (cooked)', kcal100: 120, p: 8, c: 21, f: 0.5 },
  { name: 'Ceci (cotti)', en: 'Chickpeas (cooked)', kcal100: 160, p: 9, c: 27, f: 2.6 },
  { name: 'Lenticchie (cotte)', en: 'Lentils (cooked)', kcal100: 116, p: 9, c: 20, f: 0.4 },
  { name: 'Mela', en: 'Apple', kcal100: 52, p: 0.3, c: 14, f: 0.2 },
  { name: 'Banana', en: 'Banana', kcal100: 89, p: 1.1, c: 23, f: 0.3 },
  { name: 'Arancia', en: 'Orange', kcal100: 47, p: 0.9, c: 12, f: 0.1 },
  { name: 'Mandorle', en: 'Almonds', kcal100: 579, p: 21, c: 22, f: 49 },
  { name: 'Noci', en: 'Walnuts', kcal100: 654, p: 15, c: 14, f: 65 },
  { name: 'Olio d\'oliva', en: 'Olive oil', kcal100: 884, p: 0, c: 0, f: 100 },
  { name: 'Burro', en: 'Butter', kcal100: 717, p: 0.9, c: 0.1, f: 81 },
  { name: 'Zucchero', en: 'Sugar', kcal100: 387, p: 0, c: 100, f: 0 },
  { name: 'Miele', en: 'Honey', kcal100: 304, p: 0.3, c: 82, f: 0 },
  { name: 'Nutella/crema nocciole', en: 'Hazelnut spread', kcal100: 530, p: 6, c: 57, f: 31 },
  { name: 'Biscotti', en: 'Biscuits', kcal100: 450, p: 7, c: 68, f: 16 },
  { name: 'Cioccolato fondente', en: 'Dark chocolate', kcal100: 546, p: 8, c: 46, f: 31 },
  { name: 'Cioccolato al latte', en: 'Milk chocolate', kcal100: 535, p: 8, c: 59, f: 30 },
  { name: 'Gelato', en: 'Ice cream', kcal100: 200, p: 3.5, c: 24, f: 10 },
  { name: 'Tiramisù', en: 'Tiramisu', kcal100: 300, p: 5, c: 30, f: 18 },
  { name: 'Sushi (nigiri/maki)', en: 'Sushi', kcal100: 140, p: 5, c: 28, f: 1 },
  { name: 'Panino con hamburger', en: 'Burger sandwich', kcal100: 250, p: 12, c: 30, f: 9 },
  { name: 'Birra', en: 'Beer', kcal100: 43, p: 0.5, c: 3.6, f: 0 },
  { name: 'Vino', en: 'Wine', kcal100: 85, p: 0.1, c: 2.6, f: 0 },
  { name: 'Coca-Cola', en: 'Coca-Cola', kcal100: 42, p: 0, c: 10.6, f: 0 },
]

export function searchLocal(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return COMMON_FOODS
    .filter((f) => f.name.toLowerCase().includes(q) || f.en.toLowerCase().includes(q))
    .slice(0, 6)
}

// --- Fabbisogno automatico (TDEE) da profilo -------------------------------
// BMR Mifflin-St Jeor, fattore attività dai giorni/settimana, aggiustato per
// obiettivo. Proteine per kg di peso corporeo.
export function nutritionTargets(profile) {
  if (!profile) return null
  const kg = parseFloat(String(profile.weight).replace(',', '.'))
  const cm = parseFloat(profile.height)
  const age = parseFloat(profile.age)
  if (!kg || !cm || !age) return null
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (profile.sex === 'f' ? -161 : 5)
  const act = { 2: 1.375, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.725 }[profile.daysPerWeek] || 1.5
  const tdee = bmr * act
  const goalMul = { dimagrimento: 0.8, ipertrofia: 1.1, forza: 1.05, ricomp: 1.0 }[profile.goal] ?? 1.0
  const kcal = Math.round(tdee * goalMul)
  const proteinPerKg = profile.goal === 'dimagrimento' ? 2.2 : 2.0
  const p = Math.round(proteinPerKg * kg)
  const f = Math.round(0.9 * kg)                       // grassi ~0.9 g/kg
  const carbsKcal = Math.max(0, kcal - p * 4 - f * 9)
  const c = Math.round(carbsKcal / 4)
  return { kcal, p, c, f, tdee: Math.round(tdee) }
}

// --- Stima calorie con AI (free-text, con chiave locale) -------------------
export async function estimateKcalAI(foodText, grams, apiKey, lang = 'it') {
  const g = parseFloat(grams) || 100
  const prompt = `Stima le calorie totali di: "${foodText}" per ${g} grammi (o per la porzione indicata). Rispondi SOLO con un numero intero di kcal, senza testo né unità.`
  const body = { model: 'claude-haiku-4-5', max_tokens: 20, messages: [{ role: 'user', content: prompt }] }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  const n = parseInt(String(text).replace(/[^0-9]/g, ''), 10)
  if (!n) throw new Error('stima non valida')
  return n
}

// --- Open Food Facts: ricerca cibo (gratis, senza chiave) ------------------
// Ritorna [{name, kcal100}] con kcal per 100g.
export async function searchFood(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments`
  const res = await fetch(url)
  if (!res.ok) throw new Error('rete')
  const data = await res.json()
  const num = (v) => (v == null ? 0 : Math.round(parseFloat(v) * 10) / 10)
  return (data.products || [])
    .map((prod) => {
      const n = prod.nutriments || {}
      const kcal100 = n['energy-kcal_100g'] ?? n['energy-kcal']
      const name = [prod.product_name, prod.brands].filter(Boolean).join(' · ')
      return kcal100 && name ? { name: name.slice(0, 60), kcal100: Math.round(kcal100), p: num(n['proteins_100g']), c: num(n['carbohydrates_100g']), f: num(n['fat_100g']) } : null
    })
    .filter(Boolean)
    .slice(0, 6)
}

export const kcalFor = (kcal100, grams) => Math.round((parseFloat(kcal100) || 0) * (parseFloat(grams) || 0) / 100)
// grammi di un macro per una porzione, dato il valore per 100g
export const macroFor = (per100, grams) => Math.round((parseFloat(per100) || 0) * (parseFloat(grams) || 0) / 100 * 10) / 10

// --- Totali macro ----------------------------------------------------------
const sumFoods = (foods, key) => foods.reduce((s, f) => s + (parseFloat(f[key]) || 0), 0)
export function dayPlannedMacros(planDay) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 }
  if (!planDay) return t
  planDay.meals.forEach((m) => m.foods.forEach((f) => { t.kcal += +f.kcal || 0; t.p += +f.p || 0; t.c += +f.c || 0; t.f += +f.f || 0 }))
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f) }
}
export function dayEatenMacros(planDay, log) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 }
  if (planDay) planDay.meals.forEach((m) => m.foods.forEach((f) => {
    if (log && log.eaten && log.eaten[f.id]) { t.kcal += +f.kcal || 0; t.p += +f.p || 0; t.c += +f.c || 0; t.f += +f.f || 0 }
  }))
  if (log && log.extras) log.extras.forEach((e) => { t.kcal += +e.kcal || 0; t.p += +e.p || 0; t.c += +e.c || 0; t.f += +e.f || 0 })
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f) }
}

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
