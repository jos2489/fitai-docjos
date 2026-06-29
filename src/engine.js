// ============================================================================
//  FitAI - Motore di programmazione basato su evidenze
//  Genera mesocicli adattati al cliente seguendo principi consolidati di
//  forza & ipertrofia: frequenza, volume (MEV-MAV), intensità (RIR), gestione
//  della fatica (deload) e progressione settimanale.
// ============================================================================

// --- Libreria esercizi -------------------------------------------------------
// equip: 'gym' (sala attrezzi completa), 'dumbbell' (manubri/casa), 'body' (corpo libero)
// type: 'compound' | 'isolation'
export const EXERCISES = [
  // PETTO
  { id: 'bench', name: 'Panca piana bilanciere', muscle: 'Petto', type: 'compound', equip: ['gym'] },
  { id: 'db_bench', name: 'Panca piana manubri', muscle: 'Petto', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'incline_db', name: 'Panca inclinata manubri', muscle: 'Petto', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'pushup', name: 'Piegamenti', muscle: 'Petto', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'cable_fly', name: 'Croci ai cavi', muscle: 'Petto', type: 'isolation', equip: ['gym'] },
  { id: 'db_fly', name: 'Croci con manubri', muscle: 'Petto', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // SCHIENA
  { id: 'pullup', name: 'Trazioni alla sbarra', muscle: 'Schiena', type: 'compound', equip: ['gym', 'body'] },
  { id: 'lat_pulldown', name: 'Lat machine', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'barbell_row', name: 'Rematore bilanciere', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'db_row', name: 'Rematore manubrio', muscle: 'Schiena', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'cable_row', name: 'Pulley basso', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'inv_row', name: 'Rematore inverso (australian)', muscle: 'Schiena', type: 'compound', equip: ['body'] },
  // GAMBE - QUADRICIPITI
  { id: 'squat', name: 'Squat bilanciere', muscle: 'Quadricipiti', type: 'compound', equip: ['gym'] },
  { id: 'goblet_squat', name: 'Goblet squat', muscle: 'Quadricipiti', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'leg_press', name: 'Leg press', muscle: 'Quadricipiti', type: 'compound', equip: ['gym'] },
  { id: 'split_squat', name: 'Affondi bulgari', muscle: 'Quadricipiti', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'leg_ext', name: 'Leg extension', muscle: 'Quadricipiti', type: 'isolation', equip: ['gym'] },
  // GAMBE - FEMORALI / GLUTEI
  { id: 'rdl', name: 'Stacco rumeno', muscle: 'Femorali', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'deadlift', name: 'Stacco da terra', muscle: 'Femorali', type: 'compound', equip: ['gym'] },
  { id: 'leg_curl', name: 'Leg curl', muscle: 'Femorali', type: 'isolation', equip: ['gym'] },
  { id: 'hip_thrust', name: 'Hip thrust', muscle: 'Glutei', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'glute_bridge', name: 'Ponte glutei a corpo libero', muscle: 'Glutei', type: 'isolation', equip: ['body'] },
  // SPALLE
  { id: 'ohp', name: 'Lento avanti bilanciere', muscle: 'Spalle', type: 'compound', equip: ['gym'] },
  { id: 'db_ohp', name: 'Lento avanti manubri', muscle: 'Spalle', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'lateral_raise', name: 'Alzate laterali', muscle: 'Spalle', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'pike_pushup', name: 'Pike push-up', muscle: 'Spalle', type: 'compound', equip: ['body'] },
  { id: 'face_pull', name: 'Face pull', muscle: 'Spalle', type: 'isolation', equip: ['gym'] },
  // BRACCIA
  { id: 'barbell_curl', name: 'Curl bilanciere', muscle: 'Bicipiti', type: 'isolation', equip: ['gym'] },
  { id: 'db_curl', name: 'Curl manubri', muscle: 'Bicipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'chinup', name: 'Chin-up (presa supina)', muscle: 'Bicipiti', type: 'compound', equip: ['gym', 'body'] },
  { id: 'triceps_pushdown', name: 'Push-down ai cavi', muscle: 'Tricipiti', type: 'isolation', equip: ['gym'] },
  { id: 'db_skull', name: 'French press manubri', muscle: 'Tricipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'dips', name: 'Dips alle parallele', muscle: 'Tricipiti', type: 'compound', equip: ['gym', 'body'] },
  // CORE
  { id: 'plank', name: 'Plank', muscle: 'Core', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'hanging_raise', name: 'Sollevamento ginocchia alla sbarra', muscle: 'Core', type: 'isolation', equip: ['gym', 'body'] },
  { id: 'cable_crunch', name: 'Crunch ai cavi', muscle: 'Core', type: 'isolation', equip: ['gym'] },
]

// --- Parametri per obiettivo (evidence-based) --------------------------------
// rep range, RIR target, recupero (s). Forza: alto carico/basse rep; ipertrofia:
// volume moderato 6-12; dimagrimento: densità alta rep+recuperi brevi.
const GOAL_PARAMS = {
  forza:        { repsLow: 3, repsHigh: 6,  rir: 2, restCompound: 180, restIso: 90,  isoReps: [6, 10] },
  ipertrofia:   { repsLow: 8, repsHigh: 12, rir: 1, restCompound: 120, restIso: 75,  isoReps: [10, 15] },
  dimagrimento: { repsLow: 12, repsHigh: 15, rir: 1, restCompound: 75, restIso: 45,  isoReps: [12, 20] },
  ricomp:       { repsLow: 6, repsHigh: 12, rir: 1, restCompound: 120, restIso: 75,  isoReps: [10, 15] },
}

// Set settimanali per gruppo muscolare in base all'esperienza (zona MEV→MAV)
const SETS_BY_EXPERIENCE = {
  principiante: { perExercise: 3, exercisesPerDay: 5 },
  intermedio:   { perExercise: 3, exercisesPerDay: 6 },
  avanzato:     { perExercise: 4, exercisesPerDay: 7 },
}

// --- Definizione degli split per numero di giorni ----------------------------
// Ogni "slot" è un gruppo muscolare prioritario; il primo è il movimento
// principale (compound) della seduta.
function splitForDays(days, experience) {
  const PUSH = { name: 'Push (spinta)', focus: 'Petto · Spalle · Tricipiti', slots: ['Petto', 'Petto', 'Spalle', 'Spalle', 'Tricipiti', 'Tricipiti'] }
  const PULL = { name: 'Pull (tirata)', focus: 'Schiena · Bicipiti', slots: ['Schiena', 'Schiena', 'Schiena', 'Spalle', 'Bicipiti', 'Bicipiti'] }
  const LEGS = { name: 'Legs (gambe)', focus: 'Quadricipiti · Femorali · Glutei', slots: ['Quadricipiti', 'Quadricipiti', 'Femorali', 'Glutei', 'Quadricipiti', 'Core'] }
  const UPPER = { name: 'Upper (parte alta)', focus: 'Petto · Schiena · Spalle · Braccia', slots: ['Petto', 'Schiena', 'Spalle', 'Schiena', 'Bicipiti', 'Tricipiti'] }
  const LOWER = { name: 'Lower (parte bassa)', focus: 'Gambe · Glutei · Core', slots: ['Quadricipiti', 'Femorali', 'Quadricipiti', 'Glutei', 'Core', 'Core'] }
  const FBA = { name: 'Full Body A', focus: 'Tutto il corpo', slots: ['Quadricipiti', 'Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Core'] }
  const FBB = { name: 'Full Body B', focus: 'Tutto il corpo', slots: ['Femorali', 'Schiena', 'Petto', 'Spalle', 'Tricipiti', 'Core'] }
  const FBC = { name: 'Full Body C', focus: 'Tutto il corpo', slots: ['Quadricipiti', 'Petto', 'Schiena', 'Glutei', 'Bicipiti', 'Tricipiti'] }

  switch (days) {
    case 2: return [FBA, FBB]
    case 3: return experience === 'principiante' ? [FBA, FBB, FBC] : [PUSH, PULL, LEGS]
    case 4: return [UPPER, LOWER, UPPER, LOWER]
    case 5: return [UPPER, LOWER, PUSH, PULL, LEGS]
    case 6: return [PUSH, PULL, LEGS, PUSH, PULL, LEGS]
    default: return [FBA, FBB, FBC]
  }
}

// --- Selezione esercizi ------------------------------------------------------
function pickExercises(slots, equip, exercisesPerDay, usedIds) {
  const pool = EXERCISES.filter(e => e.equip.includes(equip))
  const chosen = []
  const localUsed = new Set()
  for (const muscle of slots) {
    if (chosen.length >= exercisesPerDay) break
    // preferisci compound per il primo slot del muscolo, poi varia
    const candidates = pool
      .filter(e => e.muscle === muscle && !localUsed.has(e.id))
      .sort((a, b) => {
        // i compound prima, e penalizza ciò che è già stato usato in settimana
        const ca = a.type === 'compound' ? 0 : 1
        const cb = b.type === 'compound' ? 0 : 1
        if (ca !== cb) return ca - cb
        return (usedIds.get(a.id) || 0) - (usedIds.get(b.id) || 0)
      })
    const pick = candidates[0]
    if (pick) {
      chosen.push(pick)
      localUsed.add(pick.id)
      usedIds.set(pick.id, (usedIds.get(pick.id) || 0) + 1)
    }
  }
  return chosen
}

// --- Costruzione del programma completo --------------------------------------
export function buildProgram(profile) {
  const goal = GOAL_PARAMS[profile.goal] || GOAL_PARAMS.ipertrofia
  const exp = SETS_BY_EXPERIENCE[profile.experience] || SETS_BY_EXPERIENCE.intermedio
  const split = splitForDays(profile.daysPerWeek, profile.experience)
  const equip = profile.equipment || 'gym'
  const totalWeeks = Math.max(2, Math.min(12, profile.weeks || 4))
  // deload nell'ultima settimana se mesociclo ≥ 4 settimane
  const hasDeload = totalWeeks >= 4
  const usedIds = new Map()

  // 1) costruisci i giorni "base" (settimana 1)
  const baseDays = split.map((day) => {
    const exs = pickExercises(day.slots, equip, exp.exercisesPerDay, usedIds)
    const exercises = exs.map((e, i) => {
      const isMain = i === 0 && e.type === 'compound'
      const isCompound = e.type === 'compound'
      let repsLow = goal.repsLow
      let repsHigh = goal.repsHigh
      if (!isCompound) { repsLow = goal.isoReps[0]; repsHigh = goal.isoReps[1] }
      return {
        id: e.id,
        name: e.name,
        muscle: e.muscle,
        type: e.type,
        sets: isMain ? exp.perExercise + 1 : exp.perExercise,
        repsLow,
        repsHigh,
        rir: goal.rir,
        rest: isCompound ? goal.restCompound : goal.restIso,
      }
    })
    return { name: day.name, focus: day.focus, exercises }
  })

  // 2) replica per settimane con progressione + deload
  const weeks = []
  for (let w = 1; w <= totalWeeks; w++) {
    const isDeload = hasDeload && w === totalWeeks
    const progressWeek = isDeload ? 0 : w - 1
    const days = baseDays.map((d) => ({
      name: d.name,
      focus: d.focus,
      exercises: d.exercises.map((ex) => ({
        ...ex,
        // in deload: -1 set e RIR più alto (intensità ridotta)
        sets: isDeload ? Math.max(2, ex.sets - 1) : ex.sets,
        rir: isDeload ? ex.rir + 2 : ex.rir,
      })),
    }))
    weeks.push({
      week: w,
      deload: isDeload,
      note: isDeload
        ? 'Settimana di scarico: riduci carichi del ~40-50%, lascia 3-4 ripetizioni in serbatoio. Serve a recuperare la fatica accumulata.'
        : progressionNote(progressWeek, profile.goal),
      days,
    })
  }

  return {
    id: 'prog_' + Date.now(),
    createdAt: new Date().toISOString(),
    profile,
    splitName: split.map(s => s.name.split(' (')[0]).join(' · '),
    weeks,
  }
}

function progressionNote(progressWeek, goal) {
  if (progressWeek === 0) return 'Settimana base: registra carichi che ti lasciano le ripetizioni indicate in serbatoio (RIR). Sono il tuo punto di partenza.'
  const tips = goal === 'forza'
    ? 'Aggiungi ~2.5 kg sui fondamentali rispetto alla settimana scorsa mantenendo la tecnica.'
    : 'Sovraccarico progressivo: aggiungi 1 ripetizione per serie oppure +2.5% di carico rispetto alla settimana scorsa.'
  return `Settimana ${progressWeek + 1}: ${tips}`
}

// --- Adattamento del piano in base al feedback (il "ragionamento" dell'AI) ---
// feedback per ogni giorno: 'facile' | 'giusto' | 'duro' -> aggiusta il volume
export function adaptProgram(program, feedback) {
  const clone = JSON.parse(JSON.stringify(program))
  for (const week of clone.weeks) {
    if (week.deload) continue
    for (let di = 0; di < week.days.length; di++) {
      const fb = feedback[di]
      if (!fb) continue
      for (const ex of week.days[di].exercises) {
        if (fb === 'facile') ex.sets = Math.min(ex.sets + 1, 6)       // sotto il MAV: aggiungi volume
        else if (fb === 'duro') ex.sets = Math.max(ex.sets - 1, 2)    // troppa fatica: togli volume
      }
    }
  }
  clone.adaptedAt = new Date().toISOString()
  return clone
}

export const GOALS = [
  { id: 'ipertrofia', label: 'Ipertrofia (massa)', emoji: '💪' },
  { id: 'forza', label: 'Forza', emoji: '🏋️' },
  { id: 'dimagrimento', label: 'Dimagrimento', emoji: '🔥' },
  { id: 'ricomp', label: 'Ricomposizione', emoji: '⚖️' },
]
export const EXPERIENCES = [
  { id: 'principiante', label: 'Principiante', desc: '< 1 anno' },
  { id: 'intermedio', label: 'Intermedio', desc: '1-3 anni' },
  { id: 'avanzato', label: 'Avanzato', desc: '> 3 anni' },
]
export const EQUIPMENTS = [
  { id: 'gym', label: 'Palestra completa', emoji: '🏟️' },
  { id: 'dumbbell', label: 'Manubri / casa', emoji: '🏠' },
  { id: 'body', label: 'Corpo libero', emoji: '🤸' },
]
