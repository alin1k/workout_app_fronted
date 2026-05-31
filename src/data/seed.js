export const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

export const SEED_TYPES = [
  { id: 't_bench',  name: 'Bench Press',            muscle: 'chest',     description: 'Barbell flat bench. Retract scapula, controlled descent.' },
  { id: 't_incdb',  name: 'Incline Dumbbell Press', muscle: 'chest',     description: '' },
  { id: 't_squat',  name: 'Back Squat',             muscle: 'legs',      description: 'High-bar. Brace core, knees track over toes.' },
  { id: 't_rdl',    name: 'Romanian Deadlift',      muscle: 'legs',      description: 'Hinge at hips, slight knee bend, neutral spine.' },
  { id: 't_pull',   name: 'Pull-up',                muscle: 'back',      description: 'Bodyweight. Full hang to chin over bar.' },
  { id: 't_row',    name: 'Barbell Row',            muscle: 'back',      description: '' },
  { id: 't_ohp',    name: 'Overhead Press',         muscle: 'shoulders', description: '' },
  { id: 't_lat',    name: 'Lateral Raise',          muscle: 'shoulders', description: '' },
  { id: 't_curl',   name: 'Bicep Curl',             muscle: 'arms',      description: '' },
  { id: 't_tri',    name: 'Tricep Pushdown',        muscle: 'arms',      description: '' },
  { id: 't_plank',  name: 'Plank',                  muscle: 'core',      description: 'Bodyweight hold. Reps used as seconds.' },
];

// Build seed timestamps relative to "now" so the "Today" / "X days ago" labels stay correct.
function daysAgoAt(days, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const today_0815 = daysAgoAt(0, 8, 15);
const twoDaysAgo_1740 = daysAgoAt(2, 17, 40);
const fourDaysAgo_0705 = daysAgoAt(4, 7, 5);

export const SEED_WORKOUTS = [
  {
    id: 'w_push',
    name: 'Push day',
    performedAt: today_0815,
    notes: 'Felt strong on bench. Shoulder a touch tight on the last OHP set.',
    createdAt: today_0815,
    exercises: [
      { id: 'e1', typeId: 't_bench', sets: [
        { id: 's1', reps: 10, weight: 40 },
        { id: 's2', reps: 8,  weight: 60 },
        { id: 's3', reps: 6,  weight: 70 },
        { id: 's4', reps: 6,  weight: 70 },
      ]},
      { id: 'e2', typeId: 't_incdb', sets: [
        { id: 's5', reps: 12, weight: 22.5 },
        { id: 's6', reps: 10, weight: 24 },
      ]},
      { id: 'e3', typeId: 't_ohp', sets: [
        { id: 's7', reps: 8, weight: 35 },
        { id: 's8', reps: 7, weight: 35 },
      ]},
    ],
  },
  {
    id: 'w_legs',
    name: 'Leg day',
    performedAt: twoDaysAgo_1740,
    notes: '',
    createdAt: twoDaysAgo_1740,
    exercises: [
      { id: 'e4', typeId: 't_squat', sets: [
        { id: 's9',  reps: 8, weight: 80 },
        { id: 's10', reps: 8, weight: 90 },
        { id: 's11', reps: 6, weight: 100 },
      ]},
      { id: 'e5', typeId: 't_rdl', sets: [
        { id: 's12', reps: 10, weight: 70 },
        { id: 's13', reps: 10, weight: 70 },
      ]},
    ],
  },
  {
    id: 'w_pull',
    name: 'Pull + core',
    performedAt: fourDaysAgo_0705,
    notes: 'Bad sleep, kept it light.',
    createdAt: fourDaysAgo_0705,
    exercises: [
      { id: 'e6', typeId: 't_pull', sets: [
        { id: 's14', reps: 8, weight: null },
        { id: 's15', reps: 6, weight: null },
        { id: 's16', reps: 5, weight: null },
      ]},
      { id: 'e7', typeId: 't_row', sets: [
        { id: 's17', reps: 10, weight: 50 },
        { id: 's18', reps: 10, weight: 50 },
      ]},
      { id: 'e8', typeId: 't_plank', sets: [
        { id: 's19', reps: 60, weight: null },
        { id: 's20', reps: 45, weight: null },
      ]},
    ],
  },
];
