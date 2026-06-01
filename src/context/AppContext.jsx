import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const AppContext = createContext(null);

// Local integer id generator for items the frontend mints before the server
// does (currently: addSet, until Task 9 swaps it to a network call). Starts
// high so it can't collide with server-assigned ids.
let _nextId = 100000;
const nextId = () => _nextId++;

// Temp ids for optimistic mutations awaiting their server response. Always
// negative so they can't collide with real (positive-integer) backend ids;
// callers swap the temp entry for the server response on success, or remove
// it on rollback.
let _tempId = 0;
const tempId = () => --_tempId;

// Derive the shallow count fields a list entry uses, from a detail tree.
function shallowFromTree(w) {
  const muscles = new Set();
  let setCount = 0;
  w.exercises.forEach((ex) => {
    setCount += ex.sets.length;
    const m = ex.exercise_type?.muscle_group;
    if (m) muscles.add(m);
  });
  return {
    exercise_count: w.exercises.length,
    set_count: setCount,
    muscle_groups: [...muscles].sort(),
  };
}

export function AppProvider({ children }) {
  const [types, setTypes] = useState([]);
  const [typesStatus, setTypesStatus] = useState('loading');
  const [typesError, setTypesError] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [workoutsStatus, setWorkoutsStatus] = useState('loading');
  const [workoutsError, setWorkoutsError] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [currentWorkoutStatus, setCurrentWorkoutStatus] = useState('idle');
  const [currentWorkoutError, setCurrentWorkoutError] = useState(null);
  const [currentNotFound, setCurrentNotFound] = useState(false);
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

  // ---------- exercise-types catalog fetch ----------
  const fetchTypes = useCallback(async () => {
    setTypesStatus('loading');
    setTypesError(null);
    const { data, error } = await api.get('/api/exercise-types');
    if (error) {
      setTypesError(error);
      setTypesStatus('error');
      return;
    }
    setTypes(data || []);
    setTypesStatus('ready');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTypes();
  }, [fetchTypes]);

  // ---------- current workout (detail page) ----------
  const fetchWorkout = useCallback(async (id) => {
    setCurrentWorkoutStatus('loading');
    setCurrentWorkoutError(null);
    setCurrentNotFound(false);
    const { data, error } = await api.get(`/api/workouts/${id}`);
    if (error) {
      if (error.status === 404) {
        setCurrentNotFound(true);
      } else {
        setCurrentWorkoutError(error);
      }
      setCurrentWorkoutStatus('error');
      return;
    }
    setCurrentWorkout(data);
    setCurrentWorkoutStatus('ready');
    // Reconcile the matching shallow list entry with the freshly-loaded tree.
    setWorkouts((ws) => ws.map((w) =>
      w.id === data.id
        ? {
            ...w,
            name: data.name,
            performed_at: data.performed_at,
            notes: data.notes,
            created_at: data.created_at,
            ...shallowFromTree(data),
          }
        : w
    ));
  }, []);

  const clearCurrentWorkout = useCallback(() => {
    setCurrentWorkout(null);
    setCurrentWorkoutStatus('idle');
    setCurrentWorkoutError(null);
    setCurrentNotFound(false);
  }, []);

  // ---------- sheet / confirm ----------
  const openSheet = (s) => setSheet(s);
  const closeSheet = () => setSheet(null);
  const openConfirm = (c) => setConfirm(c);
  const closeConfirm = () => setConfirm(null);

  // ---------- workout mutations ----------
  const patchWorkoutInList = (id, fn) =>
    setWorkouts((ws) => ws.map((w) => (w.id === id ? fn(w) : w)));

  const patchCurrentWorkout = (fn) =>
    setCurrentWorkout((w) => (w ? fn(w) : w));

  const createWorkout = async (data) => {
    const { data: created, error } = await api.post('/api/workouts', data);
    if (error) return { error };
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

  const saveWorkout = async (id, data) => {
    const { data: updated, error } = await api.put(`/api/workouts/${id}`, data);
    if (error) return { error };
    patchWorkoutInList(id, (w) => ({
      ...w,
      name: updated.name,
      performed_at: updated.performed_at,
      notes: updated.notes,
    }));
    setCurrentWorkout((cw) =>
      cw && cw.id === id
        ? { ...cw, name: updated.name, performed_at: updated.performed_at, notes: updated.notes }
        : cw
    );
    setSheet(null);
    flash('Saved', 'check');
    return { error: null };
  };

  const deleteWorkout = async (id) => {
    const { error } = await api.del(`/api/workouts/${id}`);
    setConfirm(null);
    if (error && error.status !== 404) {
      flash(error.message || 'Could not delete workout', 'alert');
      return { error };
    }
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    setCurrentWorkout((cw) => (cw && cw.id === id ? null : cw));
    flash('Workout deleted', 'trash');
    return { error: null };
  };

  // ---------- exercise mutations ----------
  // Optimistic: drop a temp-id exercise into currentWorkout immediately,
  // close the sheet, then POST. On success swap the temp entry for the
  // server response and patch list counts. On failure roll back + alert.
  const addExercise = async (_workoutId, type) => {
    const w = currentWorkout;
    if (!w) {
      flash('No active workout', 'alert');
      return { error: { message: 'No active workout' } };
    }
    const wId = w.id;
    const tid = tempId();

    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: [
          ...cw.exercises,
          {
            id: tid,
            workout_id: wId,
            exercise_type_id: type.id,
            exercise_type: type,
            order: cw.exercises.length + 1,
            sets: [],
          },
        ],
      };
    });
    setSheet(null);
    flash(type.name + ' added', 'check');

    const { data: created, error } = await api.post(
      `/api/workouts/${wId}/exercises`,
      { exercise_type_id: type.id }
    );

    if (error) {
      setCurrentWorkout((cw) => {
        if (!cw || cw.id !== wId) return cw;
        return { ...cw, exercises: cw.exercises.filter((e) => e.id !== tid) };
      });
      flash('Could not add exercise', 'alert');
      return { error };
    }

    // Swap temp entry for the server response (already embeds exercise_type).
    // Preserve any sets the user may have logged in the brief window between
    // the optimistic insert and the response, retagging their exercise_id to
    // the now-real one. (Those sets are still local-only until Task 9 wires
    // them; this just prevents them from disappearing on swap.)
    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) => {
          if (e.id !== tid) return e;
          return {
            ...created,
            sets: e.sets.map((s) => ({ ...s, exercise_id: created.id })),
          };
        }),
      };
    });

    // Keep the shallow list entry's counts in sync (locked sync decision).
    patchWorkoutInList(wId, (entry) => {
      const had = (entry.muscle_groups || []).includes(type.muscle_group);
      const muscles = type.muscle_group && !had
        ? [...(entry.muscle_groups || []), type.muscle_group].sort()
        : (entry.muscle_groups || []);
      return {
        ...entry,
        exercise_count: (entry.exercise_count ?? 0) + 1,
        muscle_groups: muscles,
      };
    });

    return { exercise: created };
  };

  const removeExercise = (_workoutId, exId) =>
    patchCurrentWorkout((w) => ({
      ...w,
      exercises: w.exercises.filter((e) => e.id !== exId),
    }));

  const moveExercise = (_workoutId, exId, dir) =>
    patchCurrentWorkout((w) => {
      const arr = [...w.exercises];
      const i = arr.findIndex((e) => e.id === exId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return w;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...w, exercises: arr };
    });

  // ---------- set mutations (in-memory; Task 9 wires to backend) ----------
  const addSet = (_workoutId, exId, set) =>
    patchCurrentWorkout((w) => ({
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

  const removeSet = (_workoutId, exId, setId) =>
    patchCurrentWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      ),
    }));

  const updateSet = (_workoutId, exId, setId, set) =>
    patchCurrentWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...set } : s)) }
          : e
      ),
    }));

  // ---------- catalog mutations ----------
  // POST /api/exercise-types → 201 (returns the created type).
  // On 409 ConflictError, refetches the catalog so the NewTypeForm's reactive
  // dup check picks up the existing type and surfaces the "use existing"
  // affordance with a real reference.
  const createType = async (workoutId, data) => {
    const { data: created, error } = await api.post('/api/exercise-types', data);
    if (error) {
      if (error.status === 409) {
        // Catalog likely stale; pull the latest so the dup-affordance can
        // resolve to a real type object.
        const { data: latest } = await api.get('/api/exercise-types');
        if (latest) setTypes(latest);
      }
      return { error };
    }
    setTypes((ts) => [...ts, created]);
    addExercise(workoutId, created);
    return { type: created };
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
    currentWorkout,
    currentWorkoutStatus,
    currentWorkoutError,
    currentNotFound,
    types,
    typesStatus,
    typesError,
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
    fetchWorkout,
    fetchTypes,
    clearCurrentWorkout,
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
