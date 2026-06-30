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
export const COMMON_FOODS = [
  { name: 'Pizza margherita', en: 'Margherita pizza', kcal100: 270 },
  { name: 'Pizza diavola', en: 'Spicy salami pizza', kcal100: 280 },
  { name: 'Focaccia', en: 'Focaccia', kcal100: 290 },
  { name: 'Pasta al pomodoro (cotta)', en: 'Pasta with tomato (cooked)', kcal100: 130 },
  { name: 'Pasta in bianco (cotta)', en: 'Plain pasta (cooked)', kcal100: 160 },
  { name: 'Pasta al ragù (cotta)', en: 'Pasta with meat sauce', kcal100: 170 },
  { name: 'Lasagne', en: 'Lasagna', kcal100: 135 },
  { name: 'Risotto', en: 'Risotto', kcal100: 160 },
  { name: 'Riso bianco (cotto)', en: 'White rice (cooked)', kcal100: 130 },
  { name: 'Pane', en: 'Bread', kcal100: 270 },
  { name: 'Pane integrale', en: 'Wholemeal bread', kcal100: 240 },
  { name: 'Fette biscottate', en: 'Rusks', kcal100: 410 },
  { name: 'Fiocchi d\'avena', en: 'Oats', kcal100: 370 },
  { name: 'Cornetto/brioche', en: 'Croissant', kcal100: 400 },
  { name: 'Petto di pollo (cotto)', en: 'Chicken breast (cooked)', kcal100: 165 },
  { name: 'Fesa di tacchino', en: 'Turkey breast', kcal100: 110 },
  { name: 'Manzo magro (cotto)', en: 'Lean beef (cooked)', kcal100: 250 },
  { name: 'Hamburger (carne)', en: 'Beef burger patty', kcal100: 250 },
  { name: 'Salmone', en: 'Salmon', kcal100: 208 },
  { name: 'Tonno al naturale', en: 'Tuna in water', kcal100: 116 },
  { name: 'Merluzzo/nasello', en: 'Cod', kcal100: 82 },
  { name: 'Uovo', en: 'Egg', kcal100: 155 },
  { name: 'Prosciutto crudo', en: 'Cured ham', kcal100: 270 },
  { name: 'Prosciutto cotto', en: 'Cooked ham', kcal100: 145 },
  { name: 'Bresaola', en: 'Bresaola', kcal100: 150 },
  { name: 'Mozzarella', en: 'Mozzarella', kcal100: 250 },
  { name: 'Parmigiano', en: 'Parmesan', kcal100: 392 },
  { name: 'Ricotta', en: 'Ricotta', kcal100: 146 },
  { name: 'Yogurt greco', en: 'Greek yogurt', kcal100: 59 },
  { name: 'Yogurt intero', en: 'Whole yogurt', kcal100: 61 },
  { name: 'Latte intero', en: 'Whole milk', kcal100: 64 },
  { name: 'Latte parz. scremato', en: 'Semi-skimmed milk', kcal100: 46 },
  { name: 'Patate lesse', en: 'Boiled potatoes', kcal100: 80 },
  { name: 'Patatine fritte', en: 'French fries', kcal100: 312 },
  { name: 'Patatine in busta', en: 'Potato chips', kcal100: 536 },
  { name: 'Insalata', en: 'Salad greens', kcal100: 20 },
  { name: 'Pomodoro', en: 'Tomato', kcal100: 18 },
  { name: 'Zucchine', en: 'Zucchini', kcal100: 17 },
  { name: 'Broccoli', en: 'Broccoli', kcal100: 34 },
  { name: 'Carote', en: 'Carrots', kcal100: 41 },
  { name: 'Spinaci', en: 'Spinach', kcal100: 23 },
  { name: 'Fagioli (cotti)', en: 'Beans (cooked)', kcal100: 120 },
  { name: 'Ceci (cotti)', en: 'Chickpeas (cooked)', kcal100: 160 },
  { name: 'Lenticchie (cotte)', en: 'Lentils (cooked)', kcal100: 116 },
  { name: 'Mela', en: 'Apple', kcal100: 52 },
  { name: 'Banana', en: 'Banana', kcal100: 89 },
  { name: 'Arancia', en: 'Orange', kcal100: 47 },
  { name: 'Mandorle', en: 'Almonds', kcal100: 579 },
  { name: 'Noci', en: 'Walnuts', kcal100: 654 },
  { name: 'Olio d\'oliva', en: 'Olive oil', kcal100: 884 },
  { name: 'Burro', en: 'Butter', kcal100: 717 },
  { name: 'Zucchero', en: 'Sugar', kcal100: 387 },
  { name: 'Miele', en: 'Honey', kcal100: 304 },
  { name: 'Nutella/crema nocciole', en: 'Hazelnut spread', kcal100: 530 },
  { name: 'Biscotti', en: 'Biscuits', kcal100: 450 },
  { name: 'Cioccolato fondente', en: 'Dark chocolate', kcal100: 546 },
  { name: 'Cioccolato al latte', en: 'Milk chocolate', kcal100: 535 },
  { name: 'Gelato', en: 'Ice cream', kcal100: 200 },
  { name: 'Tiramisù', en: 'Tiramisu', kcal100: 300 },
  { name: 'Sushi (nigiri/maki)', en: 'Sushi', kcal100: 140 },
  { name: 'Panino con hamburger', en: 'Burger sandwich', kcal100: 250 },
  { name: 'Birra', en: 'Beer', kcal100: 43 },
  { name: 'Vino', en: 'Wine', kcal100: 85 },
  { name: 'Coca-Cola', en: 'Coca-Cola', kcal100: 42 },
]

export function searchLocal(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return COMMON_FOODS
    .filter((f) => f.name.toLowerCase().includes(q) || f.en.toLowerCase().includes(q))
    .slice(0, 6)
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
