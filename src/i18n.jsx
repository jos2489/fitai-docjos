import React, { createContext, useContext } from 'react'

// Sistema di traduzione IT/EN. L'italiano è la lingua sorgente (default);
// per ogni voce c'è la resa inglese. t('chiave', {var}) interpola i valori.
export const STRINGS = {
  // --- generale / nav ---
  plan: { it: 'Piano', en: 'Plan' },
  progress: { it: 'Progressi', en: 'Progress' },
  history: { it: 'Storico', en: 'History' },
  profile: { it: 'Profilo', en: 'Profile' },
  back: { it: '‹ INDIETRO', en: '‹ BACK' },
  continue: { it: 'Continua', en: 'Continue' },
  goBack: { it: 'Indietro', en: 'Back' },

  // --- onboarding ---
  welcomeTitle: { it: 'Ciao! Sono <b>Doc Jos</b> 💪', en: "Hi! I'm <b>Doc Jos</b> 💪" },
  welcomeText: { it: "Benvenuto in <b>FitAi</b>, il mio assistente di allenamento. Dimmi qualcosa su di te e ti costruisco un programma su misura seguendo le evidenze scientifiche — aggiornandolo man mano che progredisci.", en: "Welcome to <b>FitAi</b>, my training assistant. Tell me about yourself and I'll build a tailored program based on scientific evidence — updating it as you progress." },
  yourName: { it: 'Come ti chiami?', en: "What's your name?" },
  namePh: { it: 'Il tuo nome', en: 'Your name' },
  sex: { it: 'Sesso', en: 'Sex' },
  male: { it: 'Uomo', en: 'Male' },
  female: { it: 'Donna', en: 'Female' },
  age: { it: 'Età', en: 'Age' },
  weightKg: { it: 'Peso (kg)', en: 'Weight (kg)' },
  heightCm: { it: 'Altezza (cm)', en: 'Height (cm)' },
  goalQ: { it: 'Qual è il tuo obiettivo?', en: 'What is your goal?' },
  goalSub: { it: 'Determina rep range, intensità e recuperi.', en: 'Sets rep range, intensity and rest.' },
  expQ: { it: 'Quanta esperienza hai?', en: 'How much experience do you have?' },
  expSub: { it: 'Regola il volume di partenza (zona MEV→MAV).', en: 'Sets starting volume (MEV→MAV zone).' },
  whereQ: { it: 'Dove ti alleni?', en: 'Where do you train?' },
  whereSub: { it: 'Sceglierò solo esercizi che puoi davvero eseguire.', en: "I'll only pick exercises you can actually do." },
  freqTitle: { it: 'Frequenza e durata', en: 'Frequency and duration' },
  freqSub: { it: 'Quante volte a settimana e per quante settimane.', en: 'How many times per week and for how many weeks.' },
  daysWeek: { it: 'Giorni a settimana', en: 'Days per week' },
  daysUnit: { it: 'giorni / sett.', en: 'days / week' },
  mesoTitle: { it: 'Durata del mesociclo', en: 'Mesocycle length' },
  weeksUnit: { it: 'settimane', en: 'weeks' },
  deloadHint: { it: "L'AI inserirà automaticamente una settimana di scarico se servirà.", en: 'The AI will automatically add a deload week if needed.' },
  genProgram: { it: '✨ Genera il mio programma', en: '✨ Generate my program' },

  // --- home ---
  hi: { it: 'Ciao', en: 'Hi' },
  splitLabel: { it: 'Split', en: 'Split' },
  aiGenerated: { it: 'Programma generato dall\'AI', en: 'AI-generated program' },
  completed: { it: 'completato', en: 'completed' },
  week: { it: 'Settimana', en: 'Week' },
  weekShort: { it: 'Sett.', en: 'Wk' },
  deloadPill: { it: '🌙 Scarico', en: '🌙 Deload' },
  days: { it: 'Giornate', en: 'Days' },
  done: { it: 'fatte', en: 'done' },
  doneBadge: { it: '✓ fatto', en: '✓ done' },
  deloadBadge: { it: 'scarico', en: 'deload' },
  exercises: { it: 'esercizi', en: 'exercises' },
  regenerate: { it: '🔄 Rigenera programma', en: '🔄 Regenerate program' },

  // --- workout ---
  feelToday: { it: '🌡️ COME TI SENTI OGGI?', en: '🌡️ HOW DO YOU FEEL TODAY?' },
  feelSub: { it: 'Adatto volume e intensità della seduta di conseguenza (autoregolazione su RIR).', en: 'I adjust the session volume and intensity accordingly (RIR autoregulation).' },
  tired: { it: 'Stanco', en: 'Tired' },
  normal: { it: 'Normale', en: 'Normal' },
  charged: { it: 'Carico', en: 'Charged' },
  notesTitle: { it: '📝 NOTE SEDUTA', en: '📝 SESSION NOTES' },
  notesPh: { it: 'Come ti sei sentito? Dolori, energia, tecnica, regolazioni macchine...', en: 'How did it feel? Pain, energy, technique, machine settings...' },
  completeWorkout: { it: '✓ COMPLETA ALLENAMENTO', en: '✓ COMPLETE WORKOUT' },
  technique: { it: 'TECNICA', en: 'TECHNIQUE' },
  howto: { it: 'ⓘ come si fa', en: 'ⓘ how to' },
  execution: { it: 'Esecuzione', en: 'Execution' },
  why: { it: 'Perché', en: 'Why' },
  videoBtn: { it: '▶ TECNICA', en: '▶ FORM' },
  lastTime: { it: 'Ultima', en: 'Last' },
  addSet: { it: '+ SERIE', en: '+ SET' },
  restBtn: { it: '⏱ REST', en: '⏱ REST' },
  swapBtn: { it: '🔄 CAMBIA', en: '🔄 SWAP' },
  altTitle: { it: "Macchina occupata o assente? Scegli un'alternativa per lo stesso muscolo:", en: 'Machine busy or missing? Pick an alternative for the same muscle:' },
  altEmpty: { it: 'Nessuna alternativa disponibile con la tua attrezzatura.', en: 'No alternatives available with your equipment.' },
  restore: { it: '↩ Ripristina esercizio originale', en: '↩ Restore original exercise' },
  compoundShort: { it: 'multiart.', en: 'compound' },
  isoShort: { it: 'isolam.', en: 'isolation' },
  go: { it: '✅ GO!', en: '✅ GO!' },
  skip: { it: 'SALTA', en: 'SKIP' },
  close: { it: 'CHIUDI', en: 'CLOSE' },

  // --- stats ---
  summary: { it: 'Riepilogo', en: 'Summary' },
  workoutsDone: { it: 'Allenamenti completati', en: 'Workouts completed' },
  totalVolume: { it: 'Volume totale', en: 'Total volume' },
  setsLogged: { it: 'Serie registrate', en: 'Sets logged' },
  currentWeek: { it: 'Settimana corrente', en: 'Current week' },
  volPerSession: { it: 'Volume per seduta (kg sollevati)', en: 'Volume per session (kg lifted)' },
  setsPerMuscle: { it: 'Serie per gruppo muscolare', en: 'Sets per muscle group' },
  statsEmpty: { it: 'Registra il tuo primo allenamento per vedere i grafici dei progressi.', en: 'Log your first workout to see progress charts.' },
  bodyweight: { it: 'Peso corporeo', en: 'Bodyweight' },
  bwPh: { it: 'es. 78.5 kg', en: 'e.g. 78.5 kg' },
  bwHint: { it: 'Aggiungi almeno 2 misurazioni per vedere l\'andamento.', en: 'Add at least 2 measurements to see the trend.' },

  // --- history ---
  historyTitle: { it: 'Storico allenamenti', en: 'Workout history' },
  historyEmpty: { it: 'Qui troverai tutti gli allenamenti completati, con carichi, volume e note.', en: 'Here you\'ll find all completed workouts, with loads, volume and notes.' },
  workoutsCount: { it: 'allenamenti', en: 'workouts' },
  sets: { it: 'serie', en: 'sets' },
  notLogged: { it: '— non registrato', en: '— not logged' },

  // --- profile ---
  levelProgress: { it: '🧠 Livello e progressi', en: '🧠 Level & progress' },
  yourProfile: { it: 'Il tuo profilo', en: 'Your profile' },
  name: { it: 'Nome', en: 'Name' },
  goal: { it: 'Obiettivo', en: 'Goal' },
  experience: { it: 'Esperienza', en: 'Experience' },
  equipment: { it: 'Attrezzatura', en: 'Equipment' },
  frequency: { it: 'Frequenza', en: 'Frequency' },
  daysPerWeekFull: { it: 'giorni / settimana', en: 'days / week' },
  mesocycle: { it: 'Mesociclo', en: 'Mesocycle' },
  weeksFull: { it: 'settimane', en: 'weeks' },
  adaptTitle: { it: '🤖 Adatta il piano con l\'AI', en: '🤖 Adapt the plan with AI' },
  adaptSub: { it: 'Dimmi com\'è andata ogni tipo di seduta: aggiusterò il volume di conseguenza (più serie se è troppo facile, meno se è troppo dura).', en: 'Tell me how each session type went: I\'ll adjust the volume accordingly (more sets if too easy, fewer if too hard).' },
  fbEasy: { it: '😎 Facile', en: '😎 Easy' },
  fbRight: { it: '👍 Giusto', en: '👍 Right' },
  fbHard: { it: '🥵 Duro', en: '🥵 Hard' },
  recalibrate: { it: '✨ Ricalibra il programma', en: '✨ Recalibrate program' },
  dataMgmt: { it: 'Gestione dati', en: 'Data management' },
  dataSub: { it: 'I tuoi dati restano salvati solo su questo dispositivo.', en: 'Your data stays only on this device.' },
  resetAll: { it: '🗑️ Reset completo', en: '🗑️ Full reset' },
  backupTitle: { it: '💾 Backup dati', en: '💾 Data backup' },
  backupSub: { it: 'Salva tutti i tuoi dati (programma, pesi, dieta, storico, misure) in un file, per non perderli se cambi telefono o pulisci il browser.', en: 'Save all your data (program, weights, diet, history, measurements) to a file, so you don\'t lose it if you switch phones or clear the browser.' },
  exportBtn: { it: '⬇️ Esporta backup', en: '⬇️ Export backup' },
  importBtn: { it: '⬆️ Importa backup', en: '⬆️ Import backup' },
  importConfirm: { it: 'Importare questo backup? Sovrascrive i dati attuali.', en: 'Import this backup? It overwrites current data.' },
  importErr: { it: 'File non valido', en: 'Invalid file' },
  importDone: { it: '✅ Backup importato!', en: '✅ Backup imported!' },
  language: { it: '🌐 Lingua', en: '🌐 Language' },
  levelUpTo: { it: '🚀 Sali a livello', en: '🚀 Level up to' },

  // --- wod ---
  wodTitle: { it: '🔥 WOD GENERATOR', en: '🔥 WOD GENERATOR' },
  wodIntro: { it: 'Allenamenti <b>CrossFit</b> e circuiti <b>Hybrid</b> generati al volo, scalati per il tuo livello e la tua attrezzatura — con spiegazione del formato.', en: 'On-the-fly <b>CrossFit</b> workouts and <b>Hybrid</b> circuits, scaled to your level and equipment — with format explanation.' },
  style: { it: 'Stile', en: 'Style' },
  level: { it: 'Livello', en: 'Level' },
  duration: { it: 'Durata', en: 'Duration' },
  minutes: { it: 'minuti', en: 'minutes' },
  genWod: { it: '⚡ GENERA WOD', en: '⚡ GENERATE WOD' },
  strength: { it: '💪 FORZA', en: '💪 STRENGTH' },
  metcon: { it: '🔥 METCON', en: '🔥 METCON' },
  format: { it: '📖 Formato', en: '📖 Format' },
  stimulus: { it: '🎯 Stimolo', en: '🎯 Stimulus' },
  scaling: { it: '⚙️ Scaling', en: '⚙️ Scaling' },
  startTimer: { it: '⏱ AVVIA TIMER', en: '⏱ START TIMER' },
  timeUp: { it: '✅ TIME!', en: '✅ TIME!' },
  stop: { it: 'STOP', en: 'STOP' },
  wodCrossfitDesc: { it: 'Metcon ad alta intensità', en: 'High-intensity metcon' },
  wodHybridDesc: { it: 'Forza + condizionamento', en: 'Strength + conditioning' },
  lvlScaled: { it: 'Scalato', en: 'Scaled' },
  lvlNormale: { it: 'Intermedio', en: 'Intermediate' },
  lvlRx: { it: 'Rx (avanzato)', en: 'Rx (advanced)' },

  // --- nutrizione ---
  diet: { it: 'Dieta', en: 'Diet' },
  nutToday: { it: '🍽️ OGGI', en: '🍽️ TODAY' },
  nutPlan: { it: '📋 PIANO', en: '📋 PLAN' },
  noDietTitle: { it: 'Nessuna dieta caricata', en: 'No diet loaded' },
  noDietSub: { it: 'Crea il piano, importa un CSV o fai leggere una foto/PDF all\'AI dalla scheda PIANO.', en: 'Create the plan, import a CSV, or let the AI read a photo/PDF from the PLAN tab.' },
  planned: { it: 'Pianificato', en: 'Planned' },
  eaten: { it: 'Mangiato', en: 'Eaten' },
  diff: { it: 'Differenza', en: 'Difference' },
  planDay: { it: 'Giorno del piano', en: 'Plan day' },
  extras: { it: '🍕 Pasti extra (sgarro)', en: '🍕 Extra meals (cheat)' },
  addExtra: { it: '+ Aggiungi extra', en: '+ Add extra' },
  addDay: { it: '+ Giorno', en: '+ Day' },
  addMeal: { it: '+ Pasto', en: '+ Meal' },
  addFood: { it: '+ Alimento', en: '+ Food' },
  createDiet: { it: '➕ Crea dieta vuota', en: '➕ Create empty diet' },
  importCsv: { it: '📄 Importa CSV', en: '📄 Import CSV' },
  csvHint: { it: 'Colonne: giorno, pasto, alimento, quantità, kcal (esporta da Excel come CSV).', en: 'Columns: day, meal, food, qty, kcal (export from Excel as CSV).' },
  aiRead: { it: '🤖 Leggi foto/PDF con AI', en: '🤖 Read photo/PDF with AI' },
  searchFood: { it: 'Cerca alimento (Open Food Facts)', en: 'Search food (Open Food Facts)' },
  manualEntry: { it: 'Inserimento manuale', en: 'Manual entry' },
  foodName: { it: 'Nome alimento', en: 'Food name' },
  grams: { it: 'Quantità (g)', en: 'Quantity (g)' },
  kcal: { it: 'kcal', en: 'kcal' },
  add: { it: 'Aggiungi', en: 'Add' },
  cancel: { it: 'Annulla', en: 'Cancel' },
  searching: { it: 'Cerco...', en: 'Searching...' },
  noResults: { it: 'Nessun risultato. Inserisci a mano le kcal.', en: 'No results. Enter kcal manually.' },
  mealNamePh: { it: 'Nome pasto (es. Colazione)', en: 'Meal name (e.g. Breakfast)' },
  dayNamePh: { it: 'Nome giorno (es. Giorno 1)', en: 'Day name (e.g. Day 1)' },
  dietName: { it: 'Dieta', en: 'Diet' },
  resetDiet: { it: '🗑️ Elimina dieta', en: '🗑️ Delete diet' },
  aiKeyTitle: { it: '🔑 Chiave Anthropic (solo sul tuo dispositivo)', en: '🔑 Anthropic key (on your device only)' },
  aiKeySub: { it: 'Serve per l\'auto-lettura di foto/PDF. La chiave resta salvata solo qui e non viene inviata da nessun\'altra parte. Creala su console.anthropic.com.', en: 'Needed for photo/PDF auto-reading. The key stays only here and is never sent elsewhere. Create it at console.anthropic.com.' },
  keyPh: { it: 'Incolla qui la chiave (sk-ant-...)', en: 'Paste your key here (sk-ant-...)' },
  saveKey: { it: 'Salva chiave', en: 'Save key' },
  reading: { it: '🤖 Sto leggendo la dieta...', en: '🤖 Reading the diet...' },
  readError: { it: 'Errore di lettura', en: 'Reading error' },
  needKey: { it: 'Inserisci prima la chiave Anthropic qui sotto.', en: 'Enter your Anthropic key below first.' },
  total: { it: 'Totale', en: 'Total' },
  aiEstimate: { it: '🤖 Stima kcal con AI', en: '🤖 Estimate kcal with AI' },
  estimating: { it: 'Stimo...', en: 'Estimating...' },
  fromTable: { it: 'tabella', en: 'table' },
  dailyTarget: { it: 'Obiettivo', en: 'Target' },
  protein: { it: 'Proteine', en: 'Protein' },
  carbs: { it: 'Carbo', en: 'Carbs' },
  fat: { it: 'Grassi', en: 'Fat' },
  proteinG: { it: 'prot. g', en: 'prot. g' },
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`))
}

export function translate(lang, key, vars) {
  const entry = STRINGS[key]
  if (!entry) return key
  return interpolate(entry[lang] || entry.it, vars)
}

const LangContext = createContext({ lang: 'it', t: (k) => k, setLang: () => {} })

export function LangProvider({ lang, setLang, children }) {
  const t = (key, vars) => translate(lang, key, vars)
  return <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

export const LANGUAGES = [
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
]

// etichette dinamiche (obiettivo / esperienza / attrezzatura), emoji a parte
const GOAL_LABELS = { ipertrofia: { it: 'Ipertrofia (massa)', en: 'Hypertrophy (mass)' }, forza: { it: 'Forza', en: 'Strength' }, dimagrimento: { it: 'Dimagrimento', en: 'Fat loss' }, ricomp: { it: 'Ricomposizione', en: 'Recomposition' } }
const EXP_LABELS = { principiante: { label: { it: 'Principiante', en: 'Beginner' }, desc: { it: '< 1 anno', en: '< 1 year' } }, intermedio: { label: { it: 'Intermedio', en: 'Intermediate' }, desc: { it: '1-3 anni', en: '1-3 years' } }, avanzato: { label: { it: 'Avanzato', en: 'Advanced' }, desc: { it: '> 3 anni', en: '> 3 years' } } }
const EQUIP_LABELS = { gym: { it: 'Palestra completa', en: 'Full gym' }, dumbbell: { it: 'Manubri / casa', en: 'Dumbbells / home' }, body: { it: 'Corpo libero', en: 'Bodyweight' } }
export const goalLabel = (lang, id) => (GOAL_LABELS[id] || {})[lang] || id
export const expLabel = (lang, id) => (EXP_LABELS[id] ? EXP_LABELS[id].label[lang] : id)
export const expDesc = (lang, id) => (EXP_LABELS[id] ? EXP_LABELS[id].desc[lang] : '')
export const equipLabel = (lang, id) => (EQUIP_LABELS[id] || {})[lang] || id
