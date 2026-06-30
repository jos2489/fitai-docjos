// ============================================================================
//  FitAi — Generatore WOD (CrossFit) e circuiti HYBRID
//  Formati standard con spiegazione, scalati per livello e attrezzatura.
// ============================================================================

// Movimenti taggati per categoria e attrezzatura.
// equip: 'gym' (bilanciere/box/corda/macchine), 'dumbbell' (manubri/kettlebell), 'body'
const MOVES = [
  // a corpo libero (sempre disponibili)
  { name: 'Burpees', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Air squat (squat libero)', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Push-up', cat: 'push', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Sit-up', cat: 'core', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Affondi alternati', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Mountain climber', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Plank', cat: 'core', equip: ['gym', 'dumbbell', 'body'], unit: 'sec' },
  { name: 'Jumping jack', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Salto sul posto / broad jump', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  // manubri / kettlebell
  { name: 'Thruster con manubri', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Snatch con manubrio', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Swing kettlebell/manubrio', cat: 'post', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Clean & press manubri', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Renegade row', cat: 'pull', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Push press manubri', cat: 'push', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Goblet squat', cat: 'legs', equip: ['gym', 'dumbbell'], unit: 'rep' },
  // palestra attrezzata / box CrossFit
  { name: 'Thruster bilanciere', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Wall ball', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Box jump', cat: 'legs', equip: ['gym'], unit: 'rep' },
  { name: 'Trazioni alla sbarra', cat: 'pull', equip: ['gym'], unit: 'rep' },
  { name: 'Toes-to-bar', cat: 'core', equip: ['gym'], unit: 'rep' },
  { name: 'Stacco da terra', cat: 'post', equip: ['gym'], unit: 'rep' },
  { name: 'Power clean', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Double-under (saltelli con corda)', cat: 'cond', equip: ['gym'], unit: 'rep' },
  { name: 'Vogatore (calorie)', cat: 'cardio', equip: ['gym'], unit: 'cal' },
  { name: 'Assault bike (calorie)', cat: 'cardio', equip: ['gym'], unit: 'cal' },
]

const FORMATS = {
  amrap: {
    name: 'AMRAP', full: 'As Many Rounds As Possible',
    desc: 'Completa più giri possibili del circuito nel tempo previsto. Segna i giri (e le ripetizioni extra) come punteggio.',
    stimulus: 'Ritmo costante e sostenibile: non partire troppo forte, trova un passo che puoi tenere fino alla fine.',
  },
  fortime: {
    name: 'For Time', full: 'Rounds For Time',
    desc: 'Completa tutti i giri prescritti il più velocemente possibile, entro il time cap. Il tempo è il tuo punteggio.',
    stimulus: 'Spingi ma gestisci il fiato: spezza le serie PRIMA di arrivare al cedimento per non bloccarti.',
  },
  emom: {
    name: 'EMOM', full: 'Every Minute On the Minute',
    desc: 'All\'inizio di ogni minuto esegui le ripetizioni indicate; il tempo che avanza è recupero. Se non finisci in tempo, è troppo intenso: scala.',
    stimulus: 'Lavoro intervallato: scegli ripetizioni che ti lascino almeno 15-20s di recupero ogni minuto.',
  },
  chipper: {
    name: 'Chipper', full: 'Lista da "spuntare"',
    desc: 'Una lista di esercizi da completare in ordine, UNA volta sola, il più rapidamente possibile entro il time cap.',
    stimulus: 'Gara di resistenza: parti gestito, l\'obiettivo è non fermarti mai del tutto.',
  },
}

const pick = (arr, n) => {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  return out
}

// reps base per categoria, scalate per livello
function repsFor(move, level) {
  const f = level === 'rx' ? 1.4 : level === 'scaled' ? 0.7 : 1
  const base = {
    cond: 12, legs: 15, push: 12, pull: 8, core: 15, full: 10, post: 12, cardio: 12,
  }[move.cat] || 12
  let r = Math.round((base * f) / (move.unit === 'sec' ? 1 : 1))
  if (move.unit === 'sec') r = level === 'rx' ? 45 : level === 'scaled' ? 20 : 30
  if (move.unit === 'cal') r = level === 'rx' ? 15 : level === 'scaled' ? 8 : 12
  return r
}

export function generateWod({ style = 'crossfit', minutes = 12, level = 'normale', equipment = 'gym' }) {
  const pool = MOVES.filter((m) => m.equip.includes(equipment))
  const fmtKeys = minutes <= 8 ? ['amrap', 'emom', 'fortime'] : ['amrap', 'fortime', 'chipper', 'emom']
  const fmtKey = fmtKeys[Math.floor(Math.random() * fmtKeys.length)]
  const fmt = FORMATS[fmtKey]
  const timeCapSec = minutes * 60

  // HYBRID = parte di forza + finisher metcon; CrossFit = solo metcon
  let strength = null
  if (style === 'hybrid') {
    const lift = pick(pool.filter((m) => ['full', 'post', 'legs', 'push', 'pull'].includes(m.cat)), 1)[0]
    strength = {
      name: lift ? lift.name : 'Squat',
      scheme: level === 'rx' ? '5 × 5 pesante (RIR 1-2)' : level === 'scaled' ? '4 × 8 controllato' : '5 × 5 (RIR 2)',
      note: 'Parte di FORZA prima del condizionamento: recupero pieno tra le serie (2-3 min), tecnica prima del carico.',
    }
  }

  // scegli i movimenti del metcon
  const nMoves = fmtKey === 'chipper' ? 4 : fmtKey === 'emom' ? 2 : 3
  // varietà: evita due cardio insieme, mescola spinta/tirata/gambe/core
  const chosen = pick(pool, Math.min(nMoves, pool.length))
  const blocks = chosen.map((m) => {
    const reps = repsFor(m, level)
    return { name: m.name, reps, unit: m.unit }
  })

  let prescription
  if (fmtKey === 'amrap') prescription = `AMRAP ${minutes}': più giri possibili di`
  else if (fmtKey === 'fortime') prescription = `${level === 'rx' ? 5 : level === 'scaled' ? 3 : 4} giri FOR TIME (cap ${minutes}') di`
  else if (fmtKey === 'emom') prescription = `EMOM ${minutes}': ogni minuto alterna`
  else prescription = `CHIPPER (cap ${minutes}'): completa una volta`

  return {
    style,
    level,
    minutes,
    timeCapSec,
    format: fmt.name,
    formatFull: fmt.full,
    formatDesc: fmt.desc,
    stimulus: fmt.stimulus,
    prescription,
    strength,
    blocks,
    scaling: level === 'rx'
      ? 'Versione Rx (avanzata): carichi e volumi pieni. Scendi di intensità se la tecnica cede.'
      : level === 'scaled'
        ? 'Versione scalata: volumi ridotti e movimenti semplici. Perfetta per iniziare in sicurezza.'
        : 'Versione intermedia: buon equilibrio tra intensità e tecnica.',
  }
}

export const WOD_STYLES = [
  { id: 'crossfit', label: 'CrossFit', emoji: '🏋️', desc: 'Metcon ad alta intensità' },
  { id: 'hybrid', label: 'Hybrid', emoji: '⚡', desc: 'Forza + condizionamento' },
]
export const WOD_LEVELS = [
  { id: 'scaled', label: 'Scalato' },
  { id: 'normale', label: 'Intermedio' },
  { id: 'rx', label: 'Rx (avanzato)' },
]
