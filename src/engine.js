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

  // ===== LIBRERIA AMPLIATA =====
  // PETTO
  { id: 'incline_barbell', name: 'Panca inclinata bilanciere', muscle: 'Petto', type: 'compound', equip: ['gym'] },
  { id: 'machine_press', name: 'Chest press alla macchina', muscle: 'Petto', type: 'compound', equip: ['gym'] },
  { id: 'decline_db', name: 'Panca declinata manubri', muscle: 'Petto', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'pec_deck', name: 'Pectoral machine (pec deck)', muscle: 'Petto', type: 'isolation', equip: ['gym'] },
  { id: 'low_cable_fly', name: 'Croci ai cavi bassi', muscle: 'Petto', type: 'isolation', equip: ['gym'] },
  // SCHIENA
  { id: 'tbar_row', name: 'T-bar row', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'pendlay_row', name: 'Pendlay row', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'machine_row', name: 'Rematore alla macchina', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'wide_pulldown', name: 'Lat machine presa larga', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'straight_arm_pd', name: 'Pulldown a braccia tese', muscle: 'Schiena', type: 'isolation', equip: ['gym'] },
  { id: 'db_pullover', name: 'Pullover con manubrio', muscle: 'Schiena', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // SPALLE
  { id: 'arnold_press', name: 'Arnold press', muscle: 'Spalle', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'machine_shoulder', name: 'Shoulder press alla macchina', muscle: 'Spalle', type: 'compound', equip: ['gym'] },
  { id: 'upright_row', name: 'Tirate al mento', muscle: 'Spalle', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'cable_lateral', name: 'Alzate laterali ai cavi', muscle: 'Spalle', type: 'isolation', equip: ['gym'] },
  { id: 'rear_delt_fly', name: 'Alzate posteriori (rear delt)', muscle: 'Spalle', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // QUADRICIPITI
  { id: 'front_squat', name: 'Front squat', muscle: 'Quadricipiti', type: 'compound', equip: ['gym'] },
  { id: 'hack_squat', name: 'Hack squat', muscle: 'Quadricipiti', type: 'compound', equip: ['gym'] },
  { id: 'walking_lunge', name: 'Affondi camminata', muscle: 'Quadricipiti', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'sissy_squat', name: 'Sissy squat', muscle: 'Quadricipiti', type: 'isolation', equip: ['gym', 'body'] },
  // FEMORALI
  { id: 'seated_leg_curl', name: 'Leg curl da seduto', muscle: 'Femorali', type: 'isolation', equip: ['gym'] },
  { id: 'nordic_curl', name: 'Nordic hamstring curl', muscle: 'Femorali', type: 'compound', equip: ['body'] },
  { id: 'good_morning', name: 'Good morning', muscle: 'Femorali', type: 'compound', equip: ['gym'] },
  // GLUTEI
  { id: 'step_up', name: 'Step-up', muscle: 'Glutei', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'cable_pull_through', name: 'Pull-through ai cavi', muscle: 'Glutei', type: 'compound', equip: ['gym'] },
  { id: 'cable_kickback', name: 'Slanci glutei ai cavi', muscle: 'Glutei', type: 'isolation', equip: ['gym'] },
  { id: 'hip_abduction', name: 'Abduction machine', muscle: 'Glutei', type: 'isolation', equip: ['gym'] },
  // BICIPITI
  { id: 'hammer_curl', name: 'Hammer curl', muscle: 'Bicipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'preacher_curl', name: 'Panca Scott (preacher)', muscle: 'Bicipiti', type: 'isolation', equip: ['gym'] },
  { id: 'incline_db_curl', name: 'Curl su panca inclinata', muscle: 'Bicipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'cable_curl', name: 'Curl ai cavi', muscle: 'Bicipiti', type: 'isolation', equip: ['gym'] },
  // TRICIPITI
  { id: 'rope_pushdown', name: 'Push-down con corda', muscle: 'Tricipiti', type: 'isolation', equip: ['gym'] },
  { id: 'overhead_rope', name: 'Estensioni sopra la testa ai cavi', muscle: 'Tricipiti', type: 'isolation', equip: ['gym'] },
  { id: 'close_grip_bench', name: 'Panca presa stretta', muscle: 'Tricipiti', type: 'compound', equip: ['gym'] },
  { id: 'bench_dip', name: 'Dip tra le panche', muscle: 'Tricipiti', type: 'compound', equip: ['body'] },
  { id: 'db_kickback', name: 'Kickback manubri', muscle: 'Tricipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // CORE
  { id: 'leg_raise', name: 'Sollevamento gambe a terra', muscle: 'Core', type: 'isolation', equip: ['gym', 'body'] },
  { id: 'russian_twist', name: 'Russian twist', muscle: 'Core', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'ab_wheel', name: 'Ab wheel rollout', muscle: 'Core', type: 'isolation', equip: ['gym', 'body'] },
  { id: 'side_plank', name: 'Plank laterale', muscle: 'Core', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'dead_bug', name: 'Dead bug', muscle: 'Core', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
  // POLPACCI
  { id: 'standing_calf', name: 'Calf raise in piedi', muscle: 'Polpacci', type: 'isolation', equip: ['gym'] },
  { id: 'seated_calf', name: 'Calf raise da seduto', muscle: 'Polpacci', type: 'isolation', equip: ['gym'] },
  { id: 'calf_raise_bw', name: 'Calf raise a corpo libero', muscle: 'Polpacci', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },

  // ===== VARIANTI UNILATERALI (braccio/gamba singola) e ulteriori =====
  // SCHIENA
  { id: 'single_arm_pulldown', name: 'Lat machine a un braccio', muscle: 'Schiena', type: 'isolation', equip: ['gym'] },
  { id: 'single_arm_cable_row', name: 'Pulley a un braccio', muscle: 'Schiena', type: 'compound', equip: ['gym'] },
  { id: 'chest_supported_row', name: 'Rematore con appoggio al petto', muscle: 'Schiena', type: 'compound', equip: ['gym', 'dumbbell'] },
  // PETTO
  { id: 'single_arm_db_press', name: 'Panca manubri a un braccio', muscle: 'Petto', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'single_arm_cable_fly', name: 'Croce ai cavi a un braccio', muscle: 'Petto', type: 'isolation', equip: ['gym'] },
  // SPALLE
  { id: 'single_arm_db_ohp', name: 'Lento manubrio a un braccio', muscle: 'Spalle', type: 'compound', equip: ['gym', 'dumbbell'] },
  { id: 'single_arm_lateral', name: 'Alzata laterale a un braccio al cavo', muscle: 'Spalle', type: 'isolation', equip: ['gym'] },
  { id: 'landmine_press', name: 'Landmine press', muscle: 'Spalle', type: 'compound', equip: ['gym'] },
  { id: 'reverse_pec_deck', name: 'Reverse pec deck (posteriori)', muscle: 'Spalle', type: 'isolation', equip: ['gym'] },
  // QUADRICIPITI
  { id: 'single_leg_press', name: 'Leg press a una gamba', muscle: 'Quadricipiti', type: 'compound', equip: ['gym'] },
  { id: 'reverse_lunge', name: 'Affondi indietro', muscle: 'Quadricipiti', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'pistol_squat', name: 'Pistol squat (una gamba)', muscle: 'Quadricipiti', type: 'compound', equip: ['body'] },
  { id: 'single_leg_ext', name: 'Leg extension a una gamba', muscle: 'Quadricipiti', type: 'isolation', equip: ['gym'] },
  // FEMORALI
  { id: 'single_leg_curl', name: 'Leg curl a una gamba', muscle: 'Femorali', type: 'isolation', equip: ['gym'] },
  { id: 'single_leg_rdl', name: 'Stacco rumeno a una gamba', muscle: 'Femorali', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  // GLUTEI
  { id: 'single_leg_hip_thrust', name: 'Hip thrust a una gamba', muscle: 'Glutei', type: 'compound', equip: ['gym', 'dumbbell', 'body'] },
  { id: 'single_leg_glute_bridge', name: 'Ponte glutei a una gamba', muscle: 'Glutei', type: 'isolation', equip: ['body'] },
  // BICIPITI
  { id: 'spider_curl', name: 'Spider curl', muscle: 'Bicipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  { id: 'zottman_curl', name: 'Zottman curl', muscle: 'Bicipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // TRICIPITI
  { id: 'single_arm_pushdown', name: 'Push-down a un braccio', muscle: 'Tricipiti', type: 'isolation', equip: ['gym'] },
  { id: 'single_arm_oh_ext', name: 'Estensione sopra la testa a un braccio', muscle: 'Tricipiti', type: 'isolation', equip: ['gym', 'dumbbell'] },
  // POLPACCI
  { id: 'single_leg_calf', name: 'Calf raise a una gamba', muscle: 'Polpacci', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
  // CORE
  { id: 'pallof_press', name: 'Pallof press (anti-rotazione)', muscle: 'Core', type: 'isolation', equip: ['gym'] },
  { id: 'bird_dog', name: 'Bird dog', muscle: 'Core', type: 'isolation', equip: ['gym', 'dumbbell', 'body'] },
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
  const LEGS = { name: 'Legs (gambe)', focus: 'Quadricipiti · Femorali · Glutei', slots: ['Quadricipiti', 'Quadricipiti', 'Femorali', 'Glutei', 'Polpacci', 'Core'] }
  const UPPER = { name: 'Upper (parte alta)', focus: 'Petto · Schiena · Spalle · Braccia', slots: ['Petto', 'Schiena', 'Spalle', 'Schiena', 'Bicipiti', 'Tricipiti'] }
  const LOWER = { name: 'Lower (parte bassa)', focus: 'Gambe · Glutei · Core', slots: ['Quadricipiti', 'Femorali', 'Quadricipiti', 'Glutei', 'Polpacci', 'Core'] }
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
// I primi slot della seduta sono fondamentali (compound), gli ultimi accessori
// di isolamento: struttura sana per ipertrofia e necessaria perché le tecniche
// di intensità (drop set, myo-reps...) abbiano un esercizio adatto su cui girare.
function pickExercises(slots, equip, exercisesPerDay, usedIds) {
  const pool = EXERCISES.filter(e => e.equip.includes(equip))
  const chosen = []
  const localUsed = new Set()
  const n = Math.min(slots.length, exercisesPerDay)
  for (let i = 0; i < slots.length; i++) {
    if (chosen.length >= exercisesPerDay) break
    const muscle = slots[i]
    const preferIso = i >= Math.ceil(n / 2) // seconda metà = accessori di isolamento
    const candidates = pool
      .filter(e => e.muscle === muscle && !localUsed.has(e.id))
      .sort((a, b) => {
        // preferenza di tipo in base alla posizione nella seduta
        const ra = (preferIso ? (a.type === 'isolation' ? 0 : 1) : (a.type === 'compound' ? 0 : 1))
        const rb = (preferIso ? (b.type === 'isolation' ? 0 : 1) : (b.type === 'compound' ? 0 : 1))
        if (ra !== rb) return ra - rb
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
      exercises: d.exercises.map((ex, ei, arr) => ({
        ...ex,
        // in deload: -1 set e RIR più alto (intensità ridotta)
        sets: isDeload ? Math.max(2, ex.sets - 1) : ex.sets,
        rir: isDeload ? ex.rir + 2 : ex.rir,
        // tecnica avanzata sbloccata in base a livello/settimana (no in deload)
        technique: assignTechnique(ex, ei, arr, profile.experience, w, isDeload),
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

// ============================================================================
//  ADATTIVITÀ — alternative esercizi & progressione automatica
// ============================================================================

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

// --- Localizzazione contenuti (EN) ------------------------------------------
const EXERCISE_NAME_EN = {
  bench: 'Barbell bench press', db_bench: 'Dumbbell bench press', incline_db: 'Incline dumbbell press', pushup: 'Push-up', cable_fly: 'Cable fly', db_fly: 'Dumbbell fly',
  pullup: 'Pull-up', lat_pulldown: 'Lat pulldown', barbell_row: 'Barbell row', db_row: 'One-arm dumbbell row', cable_row: 'Seated cable row', inv_row: 'Inverted row',
  squat: 'Barbell squat', goblet_squat: 'Goblet squat', leg_press: 'Leg press', split_squat: 'Bulgarian split squat', leg_ext: 'Leg extension',
  rdl: 'Romanian deadlift', deadlift: 'Deadlift', leg_curl: 'Lying leg curl', hip_thrust: 'Hip thrust', glute_bridge: 'Bodyweight glute bridge',
  ohp: 'Barbell overhead press', db_ohp: 'Dumbbell shoulder press', lateral_raise: 'Lateral raise', pike_pushup: 'Pike push-up', face_pull: 'Face pull',
  barbell_curl: 'Barbell curl', db_curl: 'Dumbbell curl', chinup: 'Chin-up', triceps_pushdown: 'Cable push-down', db_skull: 'Dumbbell skull crusher', dips: 'Parallel bar dips',
  plank: 'Plank', hanging_raise: 'Hanging knee raise', cable_crunch: 'Cable crunch',
  incline_barbell: 'Incline barbell press', machine_press: 'Machine chest press', decline_db: 'Decline dumbbell press', pec_deck: 'Pec deck', low_cable_fly: 'Low cable fly',
  tbar_row: 'T-bar row', pendlay_row: 'Pendlay row', machine_row: 'Machine row', wide_pulldown: 'Wide-grip pulldown', straight_arm_pd: 'Straight-arm pulldown', db_pullover: 'Dumbbell pullover',
  arnold_press: 'Arnold press', machine_shoulder: 'Machine shoulder press', upright_row: 'Upright row', cable_lateral: 'Cable lateral raise', rear_delt_fly: 'Rear delt fly',
  front_squat: 'Front squat', hack_squat: 'Hack squat', walking_lunge: 'Walking lunge', sissy_squat: 'Sissy squat',
  seated_leg_curl: 'Seated leg curl', nordic_curl: 'Nordic hamstring curl', good_morning: 'Good morning',
  step_up: 'Step-up', cable_pull_through: 'Cable pull-through', cable_kickback: 'Cable glute kickback', hip_abduction: 'Hip abduction machine',
  hammer_curl: 'Hammer curl', preacher_curl: 'Preacher curl', incline_db_curl: 'Incline dumbbell curl', cable_curl: 'Cable curl',
  rope_pushdown: 'Rope push-down', overhead_rope: 'Overhead cable extension', close_grip_bench: 'Close-grip bench press', bench_dip: 'Bench dip', db_kickback: 'Dumbbell kickback',
  leg_raise: 'Lying leg raise', russian_twist: 'Russian twist', ab_wheel: 'Ab wheel rollout', side_plank: 'Side plank', dead_bug: 'Dead bug',
  standing_calf: 'Standing calf raise', seated_calf: 'Seated calf raise', calf_raise_bw: 'Bodyweight calf raise',
  single_arm_pulldown: 'Single-arm lat pulldown', single_arm_cable_row: 'Single-arm cable row', chest_supported_row: 'Chest-supported row',
  single_arm_db_press: 'Single-arm dumbbell press', single_arm_cable_fly: 'Single-arm cable fly',
  single_arm_db_ohp: 'Single-arm dumbbell press', single_arm_lateral: 'Single-arm cable lateral raise', landmine_press: 'Landmine press', reverse_pec_deck: 'Reverse pec deck',
  single_leg_press: 'Single-leg press', reverse_lunge: 'Reverse lunge', pistol_squat: 'Pistol squat', single_leg_ext: 'Single-leg extension',
  single_leg_curl: 'Single-leg curl', single_leg_rdl: 'Single-leg Romanian deadlift',
  single_leg_hip_thrust: 'Single-leg hip thrust', single_leg_glute_bridge: 'Single-leg glute bridge',
  spider_curl: 'Spider curl', zottman_curl: 'Zottman curl',
  single_arm_pushdown: 'Single-arm push-down', single_arm_oh_ext: 'Single-arm overhead extension',
  single_leg_calf: 'Single-leg calf raise', pallof_press: 'Pallof press', bird_dog: 'Bird dog',
}
const MUSCLE_EN = { Petto: 'Chest', Schiena: 'Back', Quadricipiti: 'Quads', Femorali: 'Hamstrings', Glutei: 'Glutes', Spalle: 'Shoulders', Bicipiti: 'Biceps', Tricipiti: 'Triceps', Core: 'Core', Polpacci: 'Calves' }
const DAY_NAME_EN = { 'Push (spinta)': 'Push', 'Pull (tirata)': 'Pull', 'Legs (gambe)': 'Legs', 'Upper (parte alta)': 'Upper', 'Lower (parte bassa)': 'Lower', 'Full Body A': 'Full Body A', 'Full Body B': 'Full Body B', 'Full Body C': 'Full Body C' }
const FOCUS_EN = {
  'Petto · Spalle · Tricipiti': 'Chest · Shoulders · Triceps', 'Schiena · Bicipiti': 'Back · Biceps',
  'Quadricipiti · Femorali · Glutei': 'Quads · Hamstrings · Glutes', 'Petto · Schiena · Spalle · Braccia': 'Chest · Back · Shoulders · Arms',
  'Gambe · Glutei · Core': 'Legs · Glutes · Core', 'Tutto il corpo': 'Full body',
}
export const exName = (lang, id) => (lang === 'en' && EXERCISE_NAME_EN[id]) || (EXERCISE_BY_ID[id] ? EXERCISE_BY_ID[id].name : id)
export const muscleName = (lang, m) => (lang === 'en' ? (MUSCLE_EN[m] || m) : m)
export const dayName = (lang, n) => (lang === 'en' ? (DAY_NAME_EN[n] || n) : n)
export const focusName = (lang, f) => (lang === 'en' ? (FOCUS_EN[f] || f) : f)

// Nota della settimana ricalcolata nella lingua scelta (non resta "congelata").
export function weekNoteText(lang, program, wk) {
  if (wk.deload) {
    return lang === 'en'
      ? 'Deload week: cut loads by ~40-50% and leave 3-4 reps in the tank. It lets you recover accumulated fatigue.'
      : 'Settimana di scarico: riduci carichi del ~40-50%, lascia 3-4 ripetizioni in serbatoio. Serve a recuperare la fatica accumulata.'
  }
  const pw = wk.week - 1
  if (pw === 0) {
    return lang === 'en'
      ? 'Base week: log loads that leave the prescribed reps in reserve (RIR). They are your starting point.'
      : 'Settimana base: registra carichi che ti lasciano le ripetizioni indicate in serbatoio (RIR). Sono il tuo punto di partenza.'
  }
  const goal = program.profile.goal
  if (lang === 'en') {
    const tip = goal === 'forza' ? 'Add ~2.5 kg on the main lifts vs last week, keeping technique.' : 'Progressive overload: add 1 rep per set or +2.5% load vs last week.'
    return `Week ${wk.week}: ${tip}`
  }
  const tip = goal === 'forza' ? 'Aggiungi ~2.5 kg sui fondamentali rispetto alla settimana scorsa mantenendo la tecnica.' : 'Sovraccarico progressivo: aggiungi 1 ripetizione per serie oppure +2.5% di carico rispetto alla settimana scorsa.'
  return `Settimana ${wk.week}: ${tip}`
}

// Esercizi alternativi per lo stesso muscolo (macchina occupata o assente).
// Ordina mettendo prima chi condivide il tipo (compound/isolation) e che usa
// attrezzatura diversa, così proponiamo davvero una variante utile.
export function alternativesFor(exId, equip = 'gym') {
  const base = EXERCISE_BY_ID[exId]
  if (!base) return []
  return EXERCISES
    .filter((e) => e.id !== exId && e.muscle === base.muscle && e.equip.includes(equip))
    .sort((a, b) => {
      const sameTypeA = a.type === base.type ? 0 : 1
      const sameTypeB = b.type === base.type ? 0 : 1
      return sameTypeA - sameTypeB
    })
}

// --- Progressione automatica: DOPPIA PROGRESSIONE + RIR ----------------------
// Principio (consenso meta-analitico, cfr. Schoenfeld/Israetel/Nippard):
// si lavora dentro un range di ripetizioni a un RIR target; quando TUTTE le
// serie raggiungono il tetto del range, si incrementa il carico e si riparte
// dal fondo del range. Se invece si è sotto, si aggiunge 1 ripetizione.
function loadIncrement(ex) {
  // incrementi minimi sensati: fondamentali +2.5 kg, isolamento +1-2.5 kg
  if (ex.type === 'compound') return 2.5
  return 1.25
}

export function suggestNextSet(lastLog, ex, lang = 'it') {
  const en = lang === 'en'
  if (!lastLog || !lastLog.length) {
    return { text: en ? `Start with a load that leaves ~${ex.rir} reps in reserve (RIR ${ex.rir}) within ${ex.repsLow}-${ex.repsHigh}.` : `Parti con un carico che ti lasci ~${ex.rir} ripetizioni in serbatoio (RIR ${ex.rir}) entro ${ex.repsLow}-${ex.repsHigh}.`, weight: null, reps: ex.repsLow }
  }
  const valid = lastLog.filter((s) => parseFloat(s.weight) > 0 && parseInt(s.reps) > 0)
  if (!valid.length) {
    return { text: en ? `Log your sets: then I'll automatically tell you load and reps for next time.` : `Registra le serie: poi ti dirò automaticamente carico e ripetizioni della volta dopo.`, weight: null, reps: ex.repsLow }
  }
  const topWeight = Math.max(...valid.map((s) => parseFloat(s.weight)))
  const repsAtTop = valid.filter((s) => parseFloat(s.weight) === topWeight).map((s) => parseInt(s.reps))
  const minRepsAtTop = Math.min(...repsAtTop)
  const inc = loadIncrement(ex)

  if (minRepsAtTop >= ex.repsHigh) {
    const next = +(topWeight + inc).toFixed(2)
    return { text: en ? `You hit ${ex.repsHigh}+ reps: go up to ${next} kg and restart from ${ex.repsLow} reps (double progression).` : `Hai chiuso ${ex.repsHigh}+ rip: sali a ${next} kg e riparti da ${ex.repsLow} rip (doppia progressione).`, weight: next, reps: ex.repsLow, up: true }
  }
  if (minRepsAtTop < ex.repsLow) {
    return { text: en ? `Below ${ex.repsLow} reps: keep ${topWeight} kg and aim for one more rep, holding RIR ${ex.rir}.` : `Sei sotto ${ex.repsLow} rip: mantieni ${topWeight} kg e punta a una ripetizione in più, tenendo RIR ${ex.rir}.`, weight: topWeight, reps: minRepsAtTop + 1 }
  }
  return { text: en ? `Same load (${topWeight} kg), try ${minRepsAtTop + 1} reps keeping RIR ${ex.rir}.` : `Stesso carico (${topWeight} kg), prova ${minRepsAtTop + 1} rip mantenendo RIR ${ex.rir}.`, weight: topWeight, reps: minRepsAtTop + 1 }
}

// ============================================================================
//  TECNICHE AVANZATE (sbloccate per livello/progressione)
// ============================================================================
// Razionale allineato alle meta-analisi: tecniche di intensità aggiungono
// volume effettivo/stress vicino al cedimento. Vanno usate con parsimonia, sugli
// esercizi giusti, da chi ha già una base tecnica (intermedio/avanzato).
export const TECHNIQUES = {
  back_off: {
    name: 'Back-off set', emoji: '⬇️', target: 'compound',
    how: "Dopo la serie pesante (top set), togli il 10-20% del carico e fai 1-2 serie con più ripetizioni allo stesso RIR.",
    why: "Aggiunge volume effettivo dopo aver espresso forza sul top set: ottimo compromesso forza+ipertrofia.",
    howEn: "After the heavy top set, drop the load 10-20% and do 1-2 sets with more reps at the same RIR.",
    whyEn: "Adds effective volume after expressing strength on the top set: a great strength+hypertrophy compromise.",
  },
  rest_pause: {
    name: 'Rest-pause', emoji: '⏸️', target: 'any',
    how: "Arriva a ~1 RIR, riposa 15-20s, riprendi per 2-4 rip con lo STESSO carico, ripeti 2-3 volte.",
    why: "Accumula ripetizioni stimolanti vicino al cedimento risparmiando tempo (densità).",
    howEn: "Reach ~1 RIR, rest 15-20s, resume for 2-4 reps with the SAME load, repeat 2-3 times.",
    whyEn: "Accumulates stimulating reps near failure while saving time (density).",
  },
  drop_set: {
    name: 'Drop set', emoji: '🪂', target: 'isolation',
    how: "Sull'ultima serie, raggiunto ~1 RIR, riduci subito il carico del 20-30% e continua senza pausa fino a quasi cedimento (1-2 drop).",
    why: "Massimizza stress metabolico e reclutamento nelle ultime ripetizioni. Ideale sugli isolamenti.",
    howEn: "On the last set, at ~1 RIR, immediately cut the load 20-30% and continue without rest to near failure (1-2 drops).",
    whyEn: "Maximises metabolic stress and recruitment in the final reps. Ideal on isolation moves.",
  },
  myo_reps: {
    name: 'Myo-reps', emoji: '🔁', target: 'isolation',
    how: "Serie di attivazione fino a ~1 RIR, poi mini-serie da 3-5 rip con 3-5 respiri di pausa, finché riesci a completarle.",
    why: "Tante ripetizioni stimolanti in pochissimo tempo: efficientissima su isolamenti e macchine.",
    howEn: "Activation set to ~1 RIR, then mini-sets of 3-5 reps with 3-5 breaths of rest, until you can't complete them.",
    whyEn: "Lots of stimulating reps in very little time: super efficient on isolation moves and machines.",
  },
}

const ISO_TECHS = ['drop_set', 'myo_reps', 'rest_pause']

// Decide se e quale tecnica assegnare a un esercizio.
// Principiante: mai (prima la tecnica e la progressione). Intermedio: 1 tecnica
// sull'ultimo isolamento dalla settimana 2. Avanzato: back-off sul fondamentale
// principale + una tecnica sull'ultimo isolamento, dalla settimana 2.
function assignTechnique(ex, index, arr, experience, week, isDeload) {
  if (isDeload || experience === 'principiante' || week < 2) return null
  const isMain = index === 0 && ex.type === 'compound'
  // ultimo esercizio di ISOLAMENTO del giorno (lì applichiamo la tecnica)
  let lastIsoIdx = -1
  for (let i = 0; i < arr.length; i++) if (arr[i].type === 'isolation') lastIsoIdx = i
  // avanzato: back-off sul fondamentale principale
  if (experience === 'avanzato' && isMain) return 'back_off'
  // intermedio/avanzato: tecnica di intensità sull'ultimo isolamento (ruota per varietà)
  if (index === lastIsoIdx) return ISO_TECHS[(week - 2) % ISO_TECHS.length]
  // se il giorno non ha isolamenti, l'avanzato usa rest-pause sull'ultimo esercizio
  if (experience === 'avanzato' && lastIsoIdx === -1 && index === arr.length - 1) return 'rest_pause'
  return null
}

// ============================================================================
//  AVANZAMENTO AUTOMATICO DI LIVELLO (basato sui dati registrati)
// ============================================================================
const LEVEL_ORDER = ['principiante', 'intermedio', 'avanzato']

// Analizza il mesociclo concluso: sessioni completate e se i carichi sono
// cresciuti. Se è andato bene e non sei già avanzato, propone il salto di livello.
export function assessProgress(program, logs, completed, lang = 'it') {
  const en = lang === 'en'
  const totalSessions = program.weeks.length * program.weeks[0].days.length
  const doneSessions = Object.keys(completed || {}).length
  const completion = totalSessions ? doneSessions / totalSessions : 0

  // progressione carichi: confronta il primo e l'ultimo top-set registrato per esercizio
  let improved = 0, tracked = 0
  const first = {}, lastSeen = {}
  program.weeks.forEach((wk) => {
    wk.days.forEach((day, di) => {
      day.exercises.forEach((ex) => {
        const log = (logs || {})[`${wk.week}-${di}-${ex.id}`]
        if (!log) return
        const top = Math.max(0, ...log.map((s) => parseFloat(s.weight) || 0))
        if (top <= 0) return
        if (first[ex.id] === undefined) first[ex.id] = top
        lastSeen[ex.id] = top
      })
    })
  })
  Object.keys(first).forEach((id) => { tracked++; if (lastSeen[id] > first[id]) improved++ })
  const progressRatio = tracked ? improved / tracked : 0

  const idx = LEVEL_ORDER.indexOf(program.profile.experience)
  const canLevelUp = idx >= 0 && idx < LEVEL_ORDER.length - 1
  const wellDone = completion >= 0.7 && progressRatio >= 0.5
  const suggestLevelUp = canLevelUp && wellDone

  const pct = Math.round(completion * 100)
  let message
  if (!doneSessions) message = en ? 'Log your sessions: I\'ll analyse your progress and adjust volume, techniques and level.' : 'Registra le tue sedute: analizzerò i progressi e adatterò volume, tecniche e livello.'
  else if (suggestLevelUp) message = en ? `Great job! You completed ${pct}% of sessions and improved your loads: you're ready to level up to "${LEVEL_ORDER[idx + 1]}" (more volume and advanced techniques).` : `Ottimo lavoro! Hai completato il ${pct}% delle sedute e migliorato i carichi: sei pronto a salire a livello "${LEVEL_ORDER[idx + 1]}" (più volume e tecniche avanzate).`
  else if (wellDone && !canLevelUp) message = en ? 'You\'re already advanced and progressing: keep up progressive overload and intensity techniques.' : 'Sei già a livello avanzato e stai progredendo: continua col sovraccarico progressivo e le tecniche di intensità.'
  else message = en ? `Progress: ${pct}% sessions completed, loads improved on ${improved}/${tracked} exercises. Finish the mesocycle while progressing to unlock the next level.` : `Progressi: ${pct}% sedute completate, carichi migliorati su ${improved}/${tracked} esercizi. Completa il mesociclo progredendo per sbloccare il livello successivo.`

  return { completion, progressRatio, suggestLevelUp, nextLevel: canLevelUp ? LEVEL_ORDER[idx + 1] : null, improved, tracked, message }
}

// Rigenera il programma al livello successivo mantenendo obiettivo e impostazioni.
export function levelUpProgram(program) {
  const idx = LEVEL_ORDER.indexOf(program.profile.experience)
  const next = LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)]
  return buildProgram({ ...program.profile, experience: next })
}

// ============================================================================
//  STATISTICHE — progressi per esercizio, record (PR), streak & badge
// ============================================================================
const _log = (logs, wk, di, exId) => (logs || {})[`${wk}-${di}-${exId}`]
const _topOf = (log) => {
  let top = 0, e1rm = 0
  ;(log || []).forEach((s) => {
    const w = parseFloat(s.weight) || 0, r = parseInt(s.reps) || 0
    if (w > 0 && r > 0) { if (w > top) top = w; const e = w * (1 + r / 30); if (e > e1rm) e1rm = e }
  })
  return { top, e1rm: Math.round(e1rm) }
}

// Esercizi che hanno almeno un carico registrato (per il selettore progressi)
export function exercisesWithLogs(program, logs) {
  const ids = new Set()
  program.weeks.forEach((wk) => wk.days.forEach((day, di) => day.exercises.forEach((ex) => {
    const log = _log(logs, wk.week, di, ex.id)
    if (log && log.some((s) => parseFloat(s.weight) > 0 && parseInt(s.reps) > 0)) ids.add(ex.id)
  })))
  return [...ids]
}

// Serie temporale del top-set (kg) e 1RM stimato per un esercizio, per settimana
export function exerciseSeries(program, logs, exId) {
  const out = []
  program.weeks.forEach((wk) => wk.days.forEach((day, di) => {
    if (!day.exercises.some((e) => e.id === exId)) return
    const log = _log(logs, wk.week, di, exId)
    if (!log) return
    const { top, e1rm } = _topOf(log)
    if (top > 0) out.push({ label: `S${wk.week}`, week: wk.week, top, e1rm })
  }))
  return out.sort((a, b) => a.week - b.week)
}

// Miglior top-set registrato PRIMA di una certa settimana (per rilevare i record)
export function bestTopBefore(program, logs, exId, week) {
  let best = 0
  program.weeks.forEach((wk) => {
    if (wk.week >= week) return
    wk.days.forEach((day, di) => {
      if (!day.exercises.some((e) => e.id === exId)) return
      const { top } = _topOf(_log(logs, wk.week, di, exId))
      if (top > best) best = top
    })
  })
  return best
}

// Statistiche di costanza: totali, questa settimana, streak (giorni di fila), badge
export function workoutStats(completed) {
  const dates = Object.values(completed || {}).map((iso) => String(iso).slice(0, 10))
  const total = dates.length
  const set = new Set(dates)
  const now = Date.now()
  const thisWeek = dates.filter((d) => (now - new Date(d).getTime()) < 7 * 864e5).length
  // streak: giorni di calendario consecutivi con almeno un allenamento (da oggi/ieri)
  let streak = 0
  const d = new Date()
  const has = (dt) => set.has(dt.toISOString().slice(0, 10))
  if (!has(d)) { d.setDate(d.getDate() - 1); }
  while (has(d)) { streak++; d.setDate(d.getDate() - 1) }
  const badge = total >= 100 ? '💎' : total >= 50 ? '🥇' : total >= 25 ? '🥈' : total >= 10 ? '🥉' : total >= 1 ? '⭐' : ''
  return { total, thisWeek, streak, badge }
}
