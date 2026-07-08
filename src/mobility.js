// ============================================================================
//  Mobilità — riscaldamento dinamico FACOLTATIVO, mirato alla zona del giorno.
//  Ogni drill ha un video diretto verificato + (nel componente) una ricerca.
// ============================================================================

const DRILL = {
  cat_cow:              { it: 'Gatto-cammello', en: 'Cat-cow', doseIt: '8-10 cicli lenti', doseEn: '8-10 slow cycles', search: 'cat cow exercise', video: 'https://www.youtube.com/watch?v=y_cKHKi9UaM' },
  open_book:            { it: 'Rotazioni toraciche (open book)', en: 'Open book (T-spine rotation)', doseIt: '8 per lato', doseEn: '8 per side', search: 'open book thoracic rotation', video: 'https://www.youtube.com/watch?v=5TdmVlQe64c' },
  shoulder_passthrough: { it: 'Passaggi spalle (bastone/elastico)', en: 'Shoulder pass-through', doseIt: '10 lenti', doseEn: '10 slow', search: 'band shoulder pass through dislocates', video: 'https://www.youtube.com/watch?v=riVxa9By-pM' },
  arm_circles:          { it: 'Circonduzioni braccia', en: 'Arm circles', doseIt: '10 avanti + 10 indietro', doseEn: '10 fwd + 10 back', search: 'arm circles warm up', video: 'https://www.youtube.com/watch?v=tYo5ghpLksg' },
  wall_slides:          { it: 'Wall slides (scivolamenti al muro)', en: 'Scapular wall slides', doseIt: '10 ripetizioni', doseEn: '10 reps', search: 'scapular wall slides', video: 'https://www.youtube.com/watch?v=UB_n4DxOTCo' },
  hip_90_90:            { it: 'Anca 90/90', en: '90/90 hip switch', doseIt: '6 per lato', doseEn: '6 per side', search: '90 90 hip mobility', video: 'https://www.youtube.com/watch?v=t4Zz6-aG8Iw' },
  worlds_greatest:      { it: "World's greatest stretch", en: "World's greatest stretch", doseIt: '5 per lato', doseEn: '5 per side', search: "world's greatest stretch", video: 'https://www.youtube.com/watch?v=-CiWQ2IvY34' },
  deep_squat:           { it: 'Accosciata profonda (tenuta)', en: 'Deep squat hold', doseIt: '30-45 sec', doseEn: '30-45 sec', search: 'deep squat hold mobility', video: 'https://www.youtube.com/watch?v=4pabcKldodc' },
  leg_swings:           { it: 'Slanci gamba (avanti + lato)', en: 'Leg swings', doseIt: '10 per gamba', doseEn: '10 per leg', search: 'leg swings dynamic warm up', video: 'https://www.youtube.com/watch?v=difYoBtZi2s' },
  ankle_wall:           { it: 'Mobilità caviglia al muro', en: 'Knee-to-wall ankle', doseIt: '8 per lato', doseEn: '8 per side', search: 'knee to wall ankle dorsiflexion', video: 'https://www.youtube.com/watch?v=NqgwyM9hXMI' },
}

const ROUTINES = {
  upper: ['cat_cow', 'open_book', 'shoulder_passthrough', 'arm_circles', 'wall_slides'],
  lower: ['hip_90_90', 'worlds_greatest', 'deep_squat', 'leg_swings', 'ankle_wall'],
  full:  ['cat_cow', 'worlds_greatest', 'hip_90_90', 'arm_circles', 'deep_squat'],
}

const LOWER_MUSCLES = ['Quadricipiti', 'Femorali', 'Glutei', 'Polpacci']

// Sceglie la zona (upper/lower/full) dai muscoli allenati nella giornata.
export function mobilityForDay(day) {
  let lo = 0, up = 0
  ;(day.exercises || []).forEach((e) => {
    if (LOWER_MUSCLES.includes(e.muscle)) lo++
    else if (e.muscle !== 'Core') up++
  })
  // Giornate dedicate (Upper/Lower/Push/Pull/Legs) hanno solo una zona → mirata;
  // le full body hanno sia alto sia basso → routine completa.
  let region = 'full'
  if (lo > 0 && up > 0) region = 'full'
  else if (lo > 0) region = 'lower'
  else if (up > 0) region = 'upper'
  return { region, drills: ROUTINES[region].map((id) => ({ id, ...DRILL[id] })) }
}

export const REGION_LABEL = {
  upper: { it: 'Spalle e dorso', en: 'Shoulders & upper back' },
  lower: { it: 'Anche e caviglie', en: 'Hips & ankles' },
  full:  { it: 'Tutto il corpo', en: 'Full body' },
}

export const mobilitySearchUrl = (term) =>
  'https://www.youtube.com/results?search_query=' + encodeURIComponent(term)
