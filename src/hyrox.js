// ============================================================================
//  FitAi — Programma HYROX multi-settimana, periodizzato e basato su evidenze.
//  Principi: distribuzione polarizzata della corsa (~80% facile Zona 2 / 20%
//  intensa, Seiler); allenamento CONCORRENTE forza+endurance con sessioni dure
//  distanziate; periodizzazione a fasi Base → Build → Peak → Taper con scarichi;
//  specificità crescente (corsa "compromessa" e simulazioni verso la gara).
//  Gara HYROX = 8 × [1 km corsa + 1 stazione]. Le stazioni speciali (SkiErg,
//  slitta, wall ball, sandbag) vengono sostituite in base all'attrezzatura.
// ============================================================================

export const HYROX_INFO = {
  it: {
    title: "Cos'è HYROX",
    body: 'Gara a tempo: 8 volte [1 km di corsa + 1 stazione], sempre in questo ordine — 1) SkiErg 1000 m · 2) Spinta slitta 50 m · 3) Traino slitta 50 m · 4) Burpee broad jump 80 m · 5) Vogatore 1000 m · 6) Farmer carry 200 m · 7) Affondi con sandbag 100 m · 8) Wall ball 100 rip. In totale ~8 km di corsa "compromessa" (corri già stanco) + 8 stazioni di forza-resistenza.',
  },
  en: {
    title: 'What is HYROX',
    body: 'A timed race: 8 rounds of [1 km run + 1 station], always in this order — 1) SkiErg 1000 m · 2) Sled push 50 m · 3) Sled pull 50 m · 4) Burpee broad jumps 80 m · 5) Row 1000 m · 6) Farmers carry 200 m · 7) Sandbag lunges 100 m · 8) Wall balls 100 reps. About 8 km of "compromised" running (running already tired) + 8 strength-endurance stations.',
  },
}

// Sostituzioni degli attrezzi speciali in base all'attrezzatura disponibile.
function sub(key, equip, lang) {
  const en = lang === 'en'
  const M = {
    skierg: { gym: en ? 'Row erg' : 'Vogatore', dumbbell: en ? 'Burpees / DB snatch' : 'Burpee / snatch manubrio', body: 'Burpee' },
    sled_push: { gym: en ? 'Heavy DB walking lunges' : 'Affondi camminata manubri pesanti', dumbbell: en ? 'Heavy DB walking lunges' : 'Affondi camminata manubri pesanti', body: en ? 'Weighted-backpack lunges' : 'Affondi con zaino zavorra' },
    sled_pull: { gym: en ? 'Bent-over row / backward drag' : 'Rematore pesante / traino a ritroso', dumbbell: en ? 'Heavy DB bent-over row' : 'Rematore manubri pesante', body: en ? 'Inverted row' : 'Rematore inverso (australian)' },
    wall_ball: { gym: en ? 'Wall ball (or DB thruster)' : 'Wall ball (o thruster manubri)', dumbbell: en ? 'DB thrusters' : 'Thruster manubri', body: en ? 'Jump squat + reach' : 'Squat + slancio con salto' },
    row: { gym: en ? 'Row erg' : 'Vogatore', dumbbell: en ? 'Run or burpees' : 'Corsa o burpee', body: en ? 'Run or burpees' : 'Corsa o burpee' },
    farmers: { gym: en ? 'DB/KB farmers carry' : 'Farmer carry manubri/kettlebell', dumbbell: en ? 'DB farmers carry' : 'Farmer carry manubri', body: en ? 'Weighted-backpack carry' : 'Carry con zaino zavorra' },
    sandbag_lunge: { gym: en ? 'DB walking lunges' : 'Affondi camminata manubri', dumbbell: en ? 'DB walking lunges' : 'Affondi camminata manubri', body: en ? 'Backpack lunges' : 'Affondi con zaino' },
  }
  const row = M[key]
  return (row && (row[equip] || row.gym)) || key
}

// Fase del mesociclo per la settimana (l'ultima è sempre taper).
function phaseFor(week, total) {
  if (week === total) return 'taper'
  const frac = total <= 2 ? 0 : (week - 1) / (total - 1)
  if (frac < 0.45) return 'base'
  if (frac < 0.8) return 'build'
  return 'peak'
}

// Modello settimanale: quali "tipi" di giornata in base ai giorni/settimana.
function weekTemplate(days) {
  switch (days) {
    case 2: return ['run_easy', 'stations']
    case 3: return ['run_easy', 'strength_lower', 'stations']
    case 4: return ['run_easy', 'strength_lower', 'run_intervals', 'stations']
    case 5: return ['run_easy', 'strength_lower', 'run_intervals', 'stations', 'strength_upper']
    case 6: return ['run_easy', 'strength_lower', 'run_intervals', 'stations', 'strength_upper', 'run_long']
    default: return ['run_easy', 'strength_lower', 'run_intervals', 'stations']
  }
}

const PHASE_NOTE = {
  base: { it: '🟢 BASE — Costruiamo il motore aerobico (corsa facile in Zona 2) e la forza di base. Tanto facile, poco duro (~80/20).', en: '🟢 BASE — Build the aerobic engine (easy Zone-2 running) and base strength. Lots of easy, little hard (~80/20).' },
  build: { it: '🟠 BUILD — Aggiungiamo intervalli a soglia/VO2 e corsa "compromessa" (correre stanco), più volume sulle stazioni.', en: '🟠 BUILD — Add threshold/VO2 intervals and "compromised" running (running tired), plus more station volume.' },
  peak: { it: '🔴 PEAK — Simulazioni a ritmo gara e transizioni veloci. Massima specificità.', en: '🔴 PEAK — Race-pace simulations and fast transitions. Maximum specificity.' },
  taper: { it: '⚪ TAPER — Riduci il volume (−40/50%), mantieni un po\' di intensità. Recuperi e arrivi fresco alla gara.', en: '⚪ TAPER — Cut volume (−40/50%), keep some intensity. Recover and arrive fresh for the race.' },
  deload: { it: '🔵 SCARICO — Settimana più leggera per assorbire il lavoro e non accumulare fatica.', en: '🔵 DELOAD — Lighter week to absorb the work and avoid accumulating fatigue.' },
}

// Contenuto di una giornata in base a tipo, fase, livello, attrezzatura.
function dayContent(type, phase, level, equip, lang, deload) {
  const en = lang === 'en'
  const S = (k) => sub(k, equip, lang)
  const sc = level === 'scaled', rx = level === 'rx'
  const L = (a, b, c) => (sc ? a : rx ? c : b) // scaled | normale | rx
  const note = deload ? (en ? 'Deload: cut volume ~40%, keep it easy.' : 'Scarico: taglia il volume ~40%, tienila facile.') : ''

  if (type === 'run_easy' || type === 'run_long') {
    const long = type === 'run_long'
    const mins = long ? L('40-50', '55-70', '70-85') : (phase === 'peak' ? L('25-30', '30-35', '35-40') : L('25-35', '35-45', '45-55'))
    return {
      type, icon: '🏃', title: en ? (long ? 'Long easy run' : 'Easy run') : (long ? 'Corsa lunga facile' : 'Corsa facile'),
      focus: en ? 'Aerobic base — Zone 2' : 'Base aerobica — Zona 2',
      lines: [
        en ? `${mins} min in Zone 2 (conversational pace, you could talk/breathe through the nose).` : `${mins} min in Zona 2 (ritmo conversazione: potresti parlare / respirare col naso).`,
        phase === 'base' ? (en ? 'Keep it truly easy: this builds the engine.' : 'Tienila davvero facile: è ciò che costruisce il motore.') : (en ? 'Finish with 4-6 × 20s strides (relaxed sprints).' : 'Chiudi con 4-6 allunghi da 20s (sprint sciolti).'),
      ], note,
    }
  }

  if (type === 'run_intervals') {
    let block
    if (phase === 'base') block = en ? `${L('5', '6', '7')} × 2 min at THRESHOLD (comfortably hard), 90s easy jog recovery` : `${L('5', '6', '7')} × 2 min a SOGLIA (comodo-duro), 90s recupero corsa lenta`
    else if (phase === 'build') block = en ? `${L('4', '5', '6')} × 3 min at VO2 (hard), 2 min recovery — or ${L('6', '8', '10')} × 400 m fast, 200 m jog` : `${L('4', '5', '6')} × 3 min a VO2 (duro), 2 min recupero — oppure ${L('6', '8', '10')} × 400 m veloci, 200 m lenti`
    else block = en ? `${L('5', '6', '8')} × 500 m at HYROX RACE PACE, 1 min recovery` : `${L('5', '6', '8')} × 500 m a RITMO GARA HYROX, 1 min recupero`
    return {
      type, icon: '⚡', title: en ? 'Interval run' : 'Corsa a intervalli',
      focus: phase === 'peak' ? (en ? 'Race pace' : 'Ritmo gara') : (en ? 'Threshold / VO2max' : 'Soglia / VO2max'),
      lines: [
        en ? 'Warm-up 10 min easy + drills.' : 'Riscaldamento 10 min facile + andature.',
        block + '.',
        en ? 'Cool-down 5-8 min easy.' : 'Defaticamento 5-8 min facile.',
      ], note,
    }
  }

  if (type === 'strength_lower') {
    const mainReps = phase === 'peak' ? L('4×5', '4×4', '5×3') : phase === 'build' ? L('4×6', '4×5', '5×5') : L('3×8', '4×6', '4×6')
    return {
      type, icon: '🏋️', title: en ? 'Strength — legs & posterior chain' : 'Forza — gambe e catena posteriore',
      focus: en ? 'Base for sled, lunges, wall ball' : 'Base per slitta, affondi, wall ball',
      lines: [
        (en ? 'Squat (or leg press) ' : 'Squat (o leg press) ') + mainReps,
        (en ? 'Romanian deadlift ' : 'Stacco rumeno ') + L('3×10', '3×8', '4×6'),
        (en ? 'Walking lunges ' : 'Affondi camminata ') + L('3×10/leg', '3×12/leg', '3×15/leg').replace('/leg', en ? '/leg' : '/gamba'),
        (en ? 'Weighted carry ' : 'Carry zavorrato ') + L('3×30 m', '3×40 m', '4×50 m'),
        (en ? 'Plank / hanging knee raise ' : 'Plank / ginocchia alla sbarra ') + L('3×30s', '3×45s', '3×60s'),
      ],
      note: note || (en ? 'Full rest between main sets (2-3 min). Technique before load.' : 'Recupero pieno tra le serie principali (2-3 min). Tecnica prima del carico.'),
    }
  }

  if (type === 'strength_upper') {
    return {
      type, icon: '💪', title: en ? 'Strength — pull, press & grip' : 'Forza — tirata, spinta e presa',
      focus: en ? 'Grip for carries, back for rowing' : 'Presa per i carry, dorso per il vogatore',
      lines: [
        (en ? 'Pull-ups / lat pulldown ' : 'Trazioni / lat machine ') + L('3×8', '4×8', '4×10'),
        (en ? 'DB shoulder press ' : 'Lento manubri ') + L('3×10', '3×10', '4×8'),
        (en ? 'DB row ' : 'Rematore manubri ') + L('3×10', '3×12', '4×12'),
        (en ? 'Dead hang (grip) ' : 'Sospensione alla sbarra (presa) ') + L('3×20s', '3×30s', '3×45s'),
        (en ? 'Core: hollow / cable crunch ' : 'Core: hollow / crunch ai cavi ') + L('3×12', '3×15', '3×15'),
      ], note,
    }
  }

  if (type === 'stations') {
    const rounds = phase === 'base' ? L('3', '4', '4') : L('4', '5', '5')
    const run = phase === 'base' ? L('300 m', '400 m', '500 m') : L('400 m', '600 m', '800 m')
    return {
      type, icon: '🔥', title: en ? 'Stations + compromised running' : 'Stazioni + corsa compromessa',
      focus: en ? 'Strength-endurance & running tired' : 'Forza-resistenza e corsa da stanco',
      lines: [
        (en ? `${rounds} rounds, short recovery (fast transitions):` : `${rounds} giri, poco recupero (transizioni veloci):`),
        `• ${run} ${en ? 'run' : 'corsa'}`,
        `• ${L('15', '20', '25')} ${S('wall_ball')}`,
        `• ${L('20 m', '30 m', '40 m')} ${S('sled_push')}`,
        `• ${L('12', '15', '18')} ${en ? 'burpee broad jumps' : 'burpee broad jump'}`,
        `• ${L('30 m', '40 m', '50 m')} ${S('farmers')}`,
      ],
      note: note || (en ? '(*) special gear auto-substituted with what you have. Rest ~90s between rounds in Base, minimal later.' : '(*) attrezzi speciali sostituiti con ciò che hai. Recupero ~90s tra i giri in Base, minimo dopo.'),
    }
  }

  if (type === 'simulation') {
    return {
      type, icon: '🏁', title: en ? 'Mini HYROX simulation (for time)' : 'Mini-simulazione HYROX (a tempo)',
      focus: en ? 'Race rehearsal & pacing' : 'Prova gara e gestione del ritmo',
      lines: [
        en ? '4 × (500 m run + 1 station), no stop, record total time:' : '4 × (500 m corsa + 1 stazione), senza fermarti, segna il tempo totale:',
        `1) 500 m + ${L('150 m', '250 m', '250 m')} ${S('skierg')}`,
        `2) 500 m + ${L('15', '20', '25')} ${S('wall_ball')}`,
        `3) 500 m + ${L('30 m', '40 m', '50 m')} ${S('sled_push')}`,
        `4) 500 m + ${L('20', '30', '40')} ${en ? 'burpee broad jumps' : 'burpee broad jump'}`,
      ],
      note: en ? 'Steady, negative-split effort: don\'t blow up on round 1.' : 'Sforzo gestito, negative split: non esplodere al primo giro.',
    }
  }

  return { type, icon: '•', title: type, focus: '', lines: [], note }
}

export function generateHyroxPlan({ weeks = 8, days = 4, level = 'normale', equipment = 'gym', lang = 'it' }) {
  const total = Math.max(4, Math.min(16, weeks))
  const d = Math.max(2, Math.min(6, days))
  const out = []
  for (let w = 1; w <= total; w++) {
    const phase = phaseFor(w, total)
    const deload = !!(w > 1 && w < total && w % 4 === 0 && phase !== 'taper')
    let template = weekTemplate(d)
    // In fase PEAK, l'ultima giornata di condizionamento diventa simulazione.
    if (phase === 'peak') {
      const idx = template.lastIndexOf('stations')
      if (idx >= 0) template = template.map((tp, i) => (i === idx ? 'simulation' : tp))
    }
    if (phase === 'taper') {
      // taper: solo lavoro breve e sciolto
      template = d <= 3 ? ['run_easy', 'run_intervals'] : ['run_easy', 'strength_lower', 'run_intervals']
    }
    const dayList = template.map((type) => dayContent(type, phase, level, equipment, lang, deload))
    out.push({
      week: w, phase, deload,
      note: (deload ? PHASE_NOTE.deload : PHASE_NOTE[phase])[lang === 'en' ? 'en' : 'it'],
      days: dayList,
    })
  }
  return {
    weeks: out, totalWeeks: total, daysPerWeek: d, level,
    basis: lang === 'en'
      ? 'Based on: polarized run distribution ~80/20 (Seiler), concurrent strength+endurance training, block periodization Base→Build→Peak→Taper.'
      : 'Basato su: distribuzione polarizzata della corsa ~80/20 (Seiler), allenamento concorrente forza+endurance, periodizzazione a blocchi Base→Build→Peak→Taper.',
  }
}
