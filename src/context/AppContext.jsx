import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SEED_TYPES, SEED_WORKOUTS } from '../data/seed.js';
import { uid } from '../lib/id.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [types, setTypes] = useState(SEED_TYPES);
  const [workouts, setWorkouts] = useState(SEED_WORKOUTS);
  const [sheet, setSheet] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const typeById = useMemo(
    () => Object.fromEntries(types.map((x) => [x.id, x])),
    [types]
  );

  const toastTimer = useRef(null);
  const flash = (message, icon) => {
    setToast({ message, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---------- sheet / confirm ----------
  const openSheet = (s) => setSheet(s);
  const closeSheet = () => setSheet(null);
  const openConfirm = (c) => setConfirm(c);
  const closeConfirm = () => setConfirm(null);

  // ---------- workout mutations ----------
  const patchWorkout = (id, fn) =>
    setWorkouts((ws) => ws.map((w) => (w.id === id ? fn(w) : w)));

  const createWorkout = (data) => {
    const w = {
      id: uid('w'),
      ...data,
      createdAt: new Date().toISOString(),
      exercises: [],
    };
    setWorkouts((ws) => [w, ...ws]);
    setSheet(null);
    flash('Workout started', 'check');
    return w.id;
  };

  const saveWorkout = (id, data) => {
    patchWorkout(id, (w) => ({ ...w, ...data }));
    setSheet(null);
    flash('Saved', 'check');
  };

  const deleteWorkout = (id) => {
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    setConfirm(null);
    flash('Workout deleted', 'trash');
  };

  // ---------- exercise mutations ----------
  const addExercise = (workoutId, type) => {
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: [...w.exercises, { id: uid('e'), typeId: type.id, sets: [] }],
    }));
    setSheet(null);
    flash(type.name + ' added', 'check');
  };

  const removeExercise = (workoutId, exId) =>
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.filter((e) => e.id !== exId),
    }));

  const moveExercise = (workoutId, exId, dir) =>
    patchWorkout(workoutId, (w) => {
      const arr = [...w.exercises];
      const i = arr.findIndex((e) => e.id === exId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return w;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...w, exercises: arr };
    });

  // ---------- set mutations ----------
  const addSet = (workoutId, exId, set) =>
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId ? { ...e, sets: [...e.sets, { id: uid('s'), ...set }] } : e
      ),
    }));

  const removeSet = (workoutId, exId, setId) =>
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      ),
    }));

  const updateSet = (workoutId, exId, setId, set) =>
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...set } : s)) }
          : e
      ),
    }));

  // ---------- catalog mutations ----------
  const createType = (workoutId, data) => {
    const type = { id: uid('t'), ...data };
    setTypes((ts) => [...ts, type]);
    addExercise(workoutId, type);
  };

  // ---------- confirm builders ----------
  const askDeleteWorkout = (w) => {
    const ex = w.exercises.length;
    const st = w.exercises.reduce((n, e) => n + e.sets.length, 0);
    setConfirm({
      icon: 'trash',
      tone: 'danger',
      title: 'Delete this workout?',
      body:
        ex === 0
          ? 'This session is empty. It will be permanently removed.'
          : `“${w.name}” and its ${ex} exercise${ex !== 1 ? 's' : ''} (${st} set${st !== 1 ? 's' : ''}) will be permanently removed. This can’t be undone.`,
      confirmLabel: 'Delete workout',
      onConfirm: () => deleteWorkout(w.id),
    });
  };

  const askRemoveExercise = (workoutId, ex) => {
    const type = typeById[ex.typeId];
    if (ex.sets.length === 0) {
      removeExercise(workoutId, ex.id);
      return;
    }
    setConfirm({
      icon: 'trash',
      tone: 'danger',
      title: 'Remove ' + (type ? type.name : 'exercise') + '?',
      body: `Its ${ex.sets.length} logged set${ex.sets.length !== 1 ? 's' : ''} will be removed too.`,
      confirmLabel: 'Remove',
      onConfirm: () => {
        removeExercise(workoutId, ex.id);
        setConfirm(null);
      },
    });
  };

  const value = {
    // data
    workouts,
    types,
    typeById,
    // ui state
    sheet,
    confirm,
    toast,
    // ui actions
    flash,
    openSheet,
    closeSheet,
    openConfirm,
    closeConfirm,
    // workout actions
    createWorkout,
    saveWorkout,
    deleteWorkout,
    addExercise,
    removeExercise,
    moveExercise,
    addSet,
    removeSet,
    updateSet,
    createType,
    askDeleteWorkout,
    askRemoveExercise,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
