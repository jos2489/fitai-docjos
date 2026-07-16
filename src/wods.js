// ============================================================================
//  FitAi — Generatore WOD (CrossFit) e circuiti HYBRID — bilingue IT/EN
//  Formati standard con spiegazione, scalati per livello e attrezzatura.
// ============================================================================

const MOVES = [
  { name: 'Burpees', en: 'Burpees', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Air squat (squat libero)', en: 'Air squat', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Push-up', en: 'Push-up', cat: 'push', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Sit-up', en: 'Sit-up', cat: 'core', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Affondi alternati', en: 'Alternating lunges', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Mountain climber', en: 'Mountain climbers', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Plank', en: 'Plank', cat: 'core', equip: ['gym', 'dumbbell', 'body'], unit: 'sec' },
  { name: 'Jumping jack', en: 'Jumping jacks', cat: 'cond', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Salto sul posto / broad jump', en: 'Broad jumps', cat: 'legs', equip: ['gym', 'dumbbell', 'body'], unit: 'rep' },
  { name: 'Thruster con manubri', en: 'Dumbbell thrusters', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Snatch con manubrio', en: 'Dumbbell snatch', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Swing kettlebell/manubrio', en: 'Kettlebell/dumbbell swing', cat: 'post', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Clean & press manubri', en: 'Dumbbell clean & press', cat: 'full', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Renegade row', en: 'Renegade row', cat: 'pull', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Push press manubri', en: 'Dumbbell push press', cat: 'push', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Goblet squat', en: 'Goblet squat', cat: 'legs', equip: ['gym', 'dumbbell'], unit: 'rep' },
  { name: 'Thruster bilanciere', en: 'Barbell thrusters', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Wall ball', en: 'Wall ball', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Box jump', en: 'Box jumps', cat: 'legs', equip: ['gym'], unit: 'rep' },
  { name: 'Trazioni alla sbarra', en: 'Pull-ups', cat: 'pull', equip: ['gym'], unit: 'rep' },
  { name: 'Toes-to-bar', en: 'Toes-to-bar', cat: 'core', equip: ['gym'], unit: 'rep' },
  { name: 'Stacco da terra', en: 'Deadlift', cat: 'post', equip: ['gym'], unit: 'rep' },
  { name: 'Power clean', en: 'Power clean', cat: 'full', equip: ['gym'], unit: 'rep' },
  { name: 'Double-under (saltelli con corda)', en: 'Double-unders', cat: 'cond', equip: ['gym'], unit: 'rep' },
  { name: 'Vogatore (calorie)', en: 'Row (calories)', cat: 'cardio', equip: ['gym'], unit: 'cal' },
  { name: 'Assault bike (calorie)', en: 'Assault bike (calories)', cat: 'cardio', equip: ['gym'], unit: 'cal' },
]

const FORMATS = {
  amrap: {
    name: 'AMRAP', full: 'As Many Rounds As Possible',
    desc: 'Completa più giri possibili del circuito nel tempo previsto. Segna i giri (e le ripetizioni extra) come punteggio.',
    stimulus: 'Ritmo costante e sostenibile: non partire troppo forte, trova un passo che puoi tenere fino alla fine.',
    descEn: 'Complete as many rounds of the circuit as possible in the given time. Score is rounds (and extra reps).',
    stimulusEn: 'Steady, sustainable pace: don\'t start too hot, find a pace you can hold to the end.',
  },
  fortime: {
    name: 'For Time', full: 'Rounds For Time',
    desc: 'Completa tutti i giri prescritti il più velocemente possibile, entro il time cap. Il tempo è il tuo punteggio.',
    stimulus: 'Spingi ma gestisci il fiato: spezza le serie PRIMA di arrivare al cedimento per non bloccarti.',
    descEn: 'Complete all prescribed rounds as fast as possible, within the time cap. Your time is the score.',
    stimulusEn: 'Push but manage your breathing: break sets BEFORE failure so you don\'t stall.',
  },
  emom: {
    name: 'EMOM', full: 'Every Minute On the Minute',
    desc: "All'inizio di ogni minuto esegui le ripetizioni indicate; il tempo che avanza è recupero. Se non finisci in tempo, è troppo intenso: scala.",
    stimulus: 'Lavoro intervallato: scegli ripetizioni che ti lascino almeno 15-20s di recupero ogni minuto.',
    descEn: 'At the start of each minute do the prescribed reps; the remaining time is rest. If you can\'t finish in time, it\'s too hard: scale.',
    stimulusEn: 'Interval work: pick reps that leave at least 15-20s of rest each minute.',
  },
  chipper: {
    name: 'Chipper', full: 'Chipper list',
    desc: 'Una lista di esercizi da completare in ordine, UNA volta sola, il più rapidamente possibile entro il time cap.',
    stimulus: 'Gara di resistenza: parti gestito, l\'obiettivo è non fermarti mai del tutto.',
    descEn: 'A list of exercises to complete in order, ONCE, as fast as possible within the time cap.',
    stimulusEn: 'Endurance grind: start controlled, the goal is to never fully stop.',
  },
}

const pick = (arr, n) => {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  return out
}

function repsFor(move, level) {
  const f = level === 'rx' ? 1.4 : level === 'scaled' ? 0.7 : 1
  const base = { cond: 12, legs: 15, push: 12, pull: 8, core: 15, full: 10, post: 12, cardio: 12 }[move.cat] || 12
  let r = Math.round(base * f)
  if (move.unit === 'sec') r = level === 'rx' ? 45 : level === 'scaled' ? 20 : 30
  if (move.unit === 'cal') r = level === 'rx' ? 15 : level === 'scaled' ? 8 : 12
  return r
}

export function generateWod({ style = 'crossfit', minutes = 12, level = 'normale', equipment = 'gym', lang = 'it' }) {
  const en = lang === 'en'
  const pool = MOVES.filter((m) => m.equip.includes(equipment))
  const fmtKeys = minutes <= 8 ? ['amrap', 'emom', 'fortime'] : ['amrap', 'fortime', 'chipper', 'emom']
  const fmtKey = fmtKeys[Math.floor(Math.random() * fmtKeys.length)]
  const fmt = FORMATS[fmtKey]
  const timeCapSec = minutes * 60
  const mvName = (m) => (en ? m.en : m.name)

  let strength = null
  if (style === 'hybrid') {
    const lift = pick(pool.filter((m) => ['full', 'post', 'legs', 'push', 'pull'].includes(m.cat)), 1)[0]
    const scheme = en
      ? (level === 'rx' ? '5 × 5 heavy (RIR 1-2)' : level === 'scaled' ? '4 × 8 controlled' : '5 × 5 (RIR 2)')
      : (level === 'rx' ? '5 × 5 pesante (RIR 1-2)' : level === 'scaled' ? '4 × 8 controllato' : '5 × 5 (RIR 2)')
    strength = {
      name: lift ? mvName(lift) : (en ? 'Squat' : 'Squat'),
      scheme,
      note: en
        ? 'STRENGTH part before conditioning: full rest between sets (2-3 min), technique before load.'
        : 'Parte di FORZA prima del condizionamento: recupero pieno tra le serie (2-3 min), tecnica prima del carico.',
    }
  }

  const nMoves = fmtKey === 'chipper' ? 4 : fmtKey === 'emom' ? 2 : 3
  const chosen = pick(pool, Math.min(nMoves, pool.length))
  const blocks = chosen.map((m) => ({ name: mvName(m), reps: repsFor(m, level), unit: m.unit }))

  let prescription
  if (fmtKey === 'amrap') prescription = en ? `AMRAP ${minutes}': as many rounds as possible of` : `AMRAP ${minutes}': più giri possibili di`
  else if (fmtKey === 'fortime') prescription = en ? `${level === 'rx' ? 5 : level === 'scaled' ? 3 : 4} rounds FOR TIME (cap ${minutes}') of` : `${level === 'rx' ? 5 : level === 'scaled' ? 3 : 4} giri FOR TIME (cap ${minutes}') di`
  else if (fmtKey === 'emom') prescription = en ? `EMOM ${minutes}': each minute alternate` : `EMOM ${minutes}': ogni minuto alterna`
  else prescription = en ? `CHIPPER (cap ${minutes}'): complete once` : `CHIPPER (cap ${minutes}'): completa una volta`

  const scaling = en
    ? (level === 'rx' ? 'Rx version (advanced): full loads and volumes. Drop intensity if technique breaks down.'
      : level === 'scaled' ? 'Scaled version: reduced volumes and simple movements. Perfect to start safely.'
        : 'Intermediate version: a good balance of intensity and technique.')
    : (level === 'rx' ? 'Versione Rx (avanzata): carichi e volumi pieni. Scendi di intensità se la tecnica cede.'
      : level === 'scaled' ? 'Versione scalata: volumi ridotti e movimenti semplici. Perfetta per iniziare in sicurezza.'
        : 'Versione intermedia: buon equilibrio tra intensità e tecnica.')

  return {
    style, level, minutes, timeCapSec,
    format: fmt.name, formatFull: fmt.full,
    formatDesc: en ? fmt.descEn : fmt.desc,
    stimulus: en ? fmt.stimulusEn : fmt.stimulus,
    prescription, strength, blocks, scaling,
  }
}

export const WOD_STYLES = [
  { id: 'crossfit', label: 'CrossFit', emoji: '🏋️' },
  { id: 'hybrid', label: 'Hybrid', emoji: '⚡' },
  { id: 'hyrox', label: 'HYROX', emoji: '🏁' },
]
export const WOD_LEVELS = [
  { id: 'scaled' },
  { id: 'normale' },
  { id: 'rx' },
]
