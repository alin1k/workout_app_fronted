import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const AppContext = createContext(null);

// Local integer id generator for items the frontend mints before the server
// does (currently: every create, until Tasks 6–9 swap each one to a network
// call). Starts high so it can't collide with server-assigned ids.
let _nextId = 100000;
const nextId = () => _nextId++;

export function AppProvider({ children }) {
  const [types, setTypes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [workoutsStatus, setWorkoutsStatus] = useState('loading');
  const [workoutsError, setWorkoutsError] = useState(null);
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

  // ---------- workouts list fetch ----------
  const fetchWorkouts = useCallback(async () => {
    setWorkoutsStatus('loading');
    setWorkoutsError(null);
    const { data, error } = await api.get('/api/workouts');
    if (error) {
      setWorkoutsError(error);
      setWorkoutsStatus('error');
      return;
    }
    setWorkouts(data || []);
    setWorkoutsStatus('ready');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkouts();
  }, [fetchWorkouts]);

  // ---------- sheet / confirm ----------
  const openSheet = (s) => setSheet(s);
  const closeSheet = () => setSheet(null);
  const openConfirm = (c) => setConfirm(c);
  const closeConfirm = () => setConfirm(null);

  // ---------- workout mutations ----------
  const patchWorkout = (id, fn) =>
    setWorkouts((ws) => ws.map((w) => (w.id === id ? fn(w) : w)));

  // POST /api/workouts → 201 with the created workout (no count fields).
  // On error, leaves the sheet open and returns { error } so the form can
  // render the message inline.
  const createWorkout = async (data) => {
    const { data: created, error } = await api.post('/api/workouts', data);
    if (error) return { error };
    // Backend POST response doesn't include count fields; attach zeros so the
    // list state shape stays consistent with what GET /api/workouts returns
    // (Task 12 reads these for the card summary).
    const shallow = {
      ...created,
      exercise_count: 0,
      set_count: 0,
      muscle_groups: [],
    };
    setWorkouts((ws) => [shallow, ...ws]);
    setSheet(null);
    flash('Workout started', 'check');
    return { id: created.id };
  };

  // PUT /api/workouts/<id> → 200 with the full nested tree. For the list we
  // only patch the editable fields, preserving the counts already there.
  // Detail-page state (Task 5) will own the full tree.
  const saveWorkout = async (id, data) => {
    const { data: updated, error } = await api.put(`/api/workouts/${id}`, data);
    if (error) return { error };
    patchWorkout(id, (w) => ({
      ...w,
      name: updated.name,
      performed_at: updated.performed_at,
      notes: updated.notes,
    }));
    setSheet(null);
    flash('Saved', 'check');
    return { error: null };
  };

  // DELETE /api/workouts/<id> → 204. 404 is treated as success (it's gone
  // either way). Other errors leave the workout in state and flash an alert.
  const deleteWorkout = async (id) => {
    const { error } = await api.del(`/api/workouts/${id}`);
    setConfirm(null);
    if (error && error.status !== 404) {
      flash(error.message || 'Could not delete workout', 'alert');
      return;
    }
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    flash('Workout deleted', 'trash');
  };

  // ---------- exercise mutations ----------
  const addExercise = (workoutId, type) => {
    patchWorkout(workoutId, (w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          id: nextId(),
          workout_id: workoutId,
          exercise_type_id: type.id,
          exercise_type: type,
          order: w.exercises.length + 1,
          sets: [],
        },
      ],
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
        e.id === exId
          ? {
              ...e,
              sets: [
                ...e.sets,
                {
                  id: nextId(),
                  exercise_id: exId,
                  set_number: e.sets.length + 1,
                  ...set,
                },
              ],
            }
          : e
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
    const type = { id: nextId(), ...data };
    setTypes((ts) => [...ts, type]);
    addExercise(workoutId, type);
  };

  // ---------- confirm builders ----------
  const askDeleteWorkout = (w) => {
    const ex = w.exercise_count ?? w.exercises?.length ?? 0;
    const st = w.set_count ?? w.exercises?.reduce((n, e) => n + e.sets.length, 0) ?? 0;
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
    const type = ex.exercise_type;
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
    workoutsStatus,
    workoutsError,
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
    // data actions
    fetchWorkouts,
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
