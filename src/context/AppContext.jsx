import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const AppContext = createContext(null);

// How many items to request per page for the paginated list endpoints.
const PAGE_SIZE = 20;

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
  const [typesTotal, setTypesTotal] = useState(0);
  const [typesHasNext, setTypesHasNext] = useState(false);
  const [typesLoadingMore, setTypesLoadingMore] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [workoutsStatus, setWorkoutsStatus] = useState('loading');
  const [workoutsError, setWorkoutsError] = useState(null);
  const [workoutsTotal, setWorkoutsTotal] = useState(0);
  const [workoutsHasNext, setWorkoutsHasNext] = useState(false);
  const [workoutsLoadingMore, setWorkoutsLoadingMore] = useState(false);
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
  // Tracks temp-id exercises the user removed locally while their original
  // POST was still in flight. addExercise's success handler consults this so
  // it can clean up the server-side row instead of resurrecting it locally.
  const removedTempsRef = useRef(new Set());
  const flash = (message, icon) => {
    setToast({ message, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---------- workouts list fetch ----------
  // Resets to the first page. Used on mount and on retry. Load-more is handled
  // separately by loadMoreWorkouts, which appends instead of replacing.
  const fetchWorkouts = useCallback(async () => {
    setWorkoutsStatus('loading');
    setWorkoutsError(null);
    const { data, error } = await api.get(`/workouts?limit=${PAGE_SIZE}&offset=0`);
    if (error) {
      setWorkoutsError(error);
      setWorkoutsStatus('error');
      return;
    }
    setWorkouts(data?.data || []);
    setWorkoutsHasNext(!!data?.pagination?.has_next);
    setWorkoutsTotal(data?.pagination?.total ?? 0);
    setWorkoutsStatus('ready');
  }, []);

  // Append the next page. Offset is the current loaded count. On error the
  // already-loaded list stays put and we just flash a toast.
  const loadMoreWorkouts = useCallback(async () => {
    setWorkoutsLoadingMore(true);
    const { data, error } = await api.get(
      `/workouts?limit=${PAGE_SIZE}&offset=${workouts.length}`
    );
    if (error) {
      flash(error.message || 'Could not load more workouts.', 'alert');
      setWorkoutsLoadingMore(false);
      return;
    }
    setWorkouts((ws) => [...ws, ...(data?.data || [])]);
    setWorkoutsHasNext(!!data?.pagination?.has_next);
    setWorkoutsTotal(data?.pagination?.total ?? 0);
    setWorkoutsLoadingMore(false);
  }, [workouts.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkouts();
  }, [fetchWorkouts]);

  // ---------- exercise-types catalog fetch ----------
  // Resets to the first page (mount + retry). loadMoreTypes appends.
  const fetchTypes = useCallback(async () => {
    setTypesStatus('loading');
    setTypesError(null);
    const { data, error } = await api.get(`/exercise-types?limit=${PAGE_SIZE}&offset=0`);
    if (error) {
      setTypesError(error);
      setTypesStatus('error');
      return;
    }
    setTypes(data?.data || []);
    setTypesHasNext(!!data?.pagination?.has_next);
    setTypesTotal(data?.pagination?.total ?? 0);
    setTypesStatus('ready');
  }, []);

  // Append the next page of the catalog. Offset = current loaded count.
  const loadMoreTypes = useCallback(async () => {
    setTypesLoadingMore(true);
    const { data, error } = await api.get(
      `/exercise-types?limit=${PAGE_SIZE}&offset=${types.length}`
    );
    if (error) {
      flash(error.message || 'Could not load more movements.', 'alert');
      setTypesLoadingMore(false);
      return;
    }
    setTypes((ts) => [...ts, ...(data?.data || [])]);
    setTypesHasNext(!!data?.pagination?.has_next);
    setTypesTotal(data?.pagination?.total ?? 0);
    setTypesLoadingMore(false);
  }, [types.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTypes();
  }, [fetchTypes]);

  // ---------- current workout (detail page) ----------
  const fetchWorkout = useCallback(async (id) => {
    setCurrentWorkoutStatus('loading');
    setCurrentWorkoutError(null);
    setCurrentNotFound(false);
    const { data, error } = await api.get(`/workouts/${id}`);
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

  const createWorkout = async (data) => {
    const { data: created, error } = await api.post('/workouts', data);
    if (error) return { error };
    const shallow = {
      ...created,
      exercise_count: 0,
      set_count: 0,
      muscle_groups: [],
    };
    setWorkouts((ws) => [shallow, ...ws]);
    setWorkoutsTotal((n) => n + 1);
    setSheet(null);
    flash('Workout started', 'check');
    return { id: created.id };
  };

  const saveWorkout = async (id, data) => {
    const { data: updated, error } = await api.put(`/workouts/${id}`, data);
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
    const { error } = await api.del(`/workouts/${id}`);
    setConfirm(null);
    if (error && error.status !== 404) {
      flash(error.message || 'Could not delete workout', 'alert');
      return { error };
    }
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    setWorkoutsTotal((n) => Math.max(0, n - 1));
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
      `/workouts/${wId}/exercises`,
      { exercise_type_id: type.id }
    );

    if (error) {
      setCurrentWorkout((cw) => {
        if (!cw || cw.id !== wId) return cw;
        return { ...cw, exercises: cw.exercises.filter((e) => e.id !== tid) };
      });
      removedTempsRef.current.delete(tid);
      flash('Could not add exercise', 'alert');
      return { error };
    }

    // The user may have removed the optimistic entry while the POST was in
    // flight. In that case don't resurrect it locally — and tell the server
    // to drop the row it just created.
    if (removedTempsRef.current.has(tid)) {
      removedTempsRef.current.delete(tid);
      api.del(`/exercises/${created.id}`);
      return { exercise: created };
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

  // Optimistic: drop the exercise from currentWorkout immediately, then
  // DELETE. On 404 treat as already gone (keep removed); on any other error
  // re-insert the snapshot at its original index and alert.
  const removeExercise = async (_workoutId, exId) => {
    // Temp-id exercise: never made it to the server. Just remove locally
    // and mark it so addExercise's pending POST can clean up server-side.
    if (exId < 0) {
      removedTempsRef.current.add(exId);
      setCurrentWorkout((cw) => {
        if (!cw) return cw;
        return { ...cw, exercises: cw.exercises.filter((e) => e.id !== exId) };
      });
      return { error: null };
    }

    const w = currentWorkout;
    if (!w) return { error: null };
    const wId = w.id;
    const idx = w.exercises.findIndex((e) => e.id === exId);
    if (idx === -1) return { error: null };
    const snapshot = w.exercises[idx];

    // Optimistic remove + matching list-counts sync.
    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return { ...cw, exercises: cw.exercises.filter((e) => e.id !== exId) };
    });
    patchWorkoutInList(wId, (entry) => {
      const remaining = w.exercises.filter((e) => e.id !== exId);
      const muscles = [
        ...new Set(remaining.map((e) => e.exercise_type?.muscle_group).filter(Boolean)),
      ].sort();
      return {
        ...entry,
        exercise_count: Math.max(0, (entry.exercise_count ?? 1) - 1),
        muscle_groups: muscles,
      };
    });

    const { error } = await api.del(`/exercises/${exId}`);

    if (error && error.status !== 404) {
      // Rollback — reinsert at original index, restore the count + chip.
      setCurrentWorkout((cw) => {
        if (!cw || cw.id !== wId) return cw;
        const next = [...cw.exercises];
        next.splice(idx, 0, snapshot);
        return { ...cw, exercises: next };
      });
      patchWorkoutInList(wId, (entry) => {
        const restored = snapshot.exercise_type?.muscle_group;
        const had = restored && (entry.muscle_groups || []).includes(restored);
        const muscles = restored && !had
          ? [...(entry.muscle_groups || []), restored].sort()
          : (entry.muscle_groups || []);
        return {
          ...entry,
          exercise_count: (entry.exercise_count ?? 0) + 1,
          muscle_groups: muscles,
        };
      });
      flash('Could not remove exercise', 'alert');
      return { error };
    }

    return { error: null };
  };

  // PUT /exercises/<id> with { order } → 200 returning the full parent
  // workout. Optimistic local swap; on success replace currentWorkout
  // wholesale with the response (per locked decision — don't merge). On
  // failure restore the pre-swap snapshot.
  const moveExercise = async (_workoutId, exId, dir) => {
    const w = currentWorkout;
    if (!w) return { error: null };
    const wId = w.id;
    const i = w.exercises.findIndex((e) => e.id === exId);
    if (i === -1) return { error: null };
    const j = i + dir;
    if (j < 0 || j >= w.exercises.length) return { error: null };

    // 1-indexed target order matches the backend's clamping semantics.
    const targetOrder = j + 1;
    const snapshot = w;

    // Optimistic swap.
    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      const arr = [...cw.exercises];
      const idx = arr.findIndex((e) => e.id === exId);
      const tgt = idx + dir;
      if (idx < 0 || tgt < 0 || tgt >= arr.length) return cw;
      [arr[idx], arr[tgt]] = [arr[tgt], arr[idx]];
      return { ...cw, exercises: arr };
    });

    // Temp-id exercise: not on the server yet. The local swap is enough
    // for now; the eventual swap to a real id will append it at the
    // server's max+1 anyway.
    if (exId < 0) return { error: null };

    const { data: updated, error } = await api.put(
      `/exercises/${exId}`,
      { order: targetOrder }
    );

    if (error) {
      setCurrentWorkout((cw) => (cw && cw.id === wId ? snapshot : cw));
      flash('Could not move exercise', 'alert');
      return { error };
    }

    // Replace currentWorkout with the response wholesale — order values
    // across all sibling exercises may have shifted.
    setCurrentWorkout((cw) => (cw && cw.id === wId ? updated : cw));
    // Reconcile the shallow list entry (counts/muscles unchanged here,
    // but recomputing keeps the entry in lockstep with the latest tree).
    patchWorkoutInList(wId, (entry) => ({
      ...entry,
      ...shallowFromTree(updated),
    }));
    return { error: null };
  };

  // ---------- set mutations (optimistic) ----------
  // POST /exercises/<id>/sets. Inserts a temp-id set locally first,
  // bumps the list set_count, then fires the POST. Swaps the temp entry
  // for the server response on success; rolls back on failure.
  // Special case: if the parent exercise is still temp (addExercise hasn't
  // settled yet), keep the set local-only — the rare set logged in that
  // window won't survive a page refresh, which is the documented interim.
  const addSet = async (_workoutId, exId, set) => {
    const w = currentWorkout;
    if (!w) return { error: null };
    const wId = w.id;
    const exercise = w.exercises.find((e) => e.id === exId);
    if (!exercise) return { error: null };

    // max(set_number) + 1 — handles gaps from prior deletes correctly.
    const setNumber = exercise.sets.length === 0
      ? 1
      : Math.max(...exercise.sets.map((s) => s.set_number)) + 1;
    const tid = tempId();
    const tempSet = {
      id: tid,
      exercise_id: exId,
      set_number: setNumber,
      reps: set.reps,
      weight: set.weight ?? null,
    };

    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) =>
          e.id === exId ? { ...e, sets: [...e.sets, tempSet] } : e
        ),
      };
    });
    patchWorkoutInList(wId, (entry) => ({
      ...entry,
      set_count: (entry.set_count ?? 0) + 1,
    }));

    // Parent exercise hasn't been persisted yet — bail before POSTing.
    if (exId < 0) return { set: tempSet };

    // Omit weight when null — the backend treats null on POST as
    // out-of-spec; for PUT it's documented as "clears it".
    const body = { reps: set.reps };
    if (set.weight != null) body.weight = set.weight;
    const { data: created, error } = await api.post(
      `/exercises/${exId}/sets`,
      body
    );

    if (error) {
      setCurrentWorkout((cw) => {
        if (!cw || cw.id !== wId) return cw;
        return {
          ...cw,
          exercises: cw.exercises.map((e) =>
            e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== tid) } : e
          ),
        };
      });
      patchWorkoutInList(wId, (entry) => ({
        ...entry,
        set_count: Math.max(0, (entry.set_count ?? 1) - 1),
      }));
      flash('Could not log set', 'alert');
      return { error };
    }

    // Swap the temp entry for the server response.
    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) =>
          e.id === exId ? { ...e, sets: e.sets.map((s) => (s.id === tid ? created : s)) } : e
        ),
      };
    });
    return { set: created };
  };

  // DELETE /sets/<id>. Snapshot + optimistic remove + list decrement,
  // rollback on non-404 error.
  const removeSet = async (_workoutId, exId, setId) => {
    const w = currentWorkout;
    if (!w) return { error: null };
    const wId = w.id;
    const exercise = w.exercises.find((e) => e.id === exId);
    if (!exercise) return { error: null };
    const setIdx = exercise.sets.findIndex((s) => s.id === setId);
    if (setIdx === -1) return { error: null };
    const snapshot = exercise.sets[setIdx];

    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) =>
          e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
        ),
      };
    });
    patchWorkoutInList(wId, (entry) => ({
      ...entry,
      set_count: Math.max(0, (entry.set_count ?? 1) - 1),
    }));

    // Temp set or temp parent: never persisted.
    if (setId < 0 || exId < 0) return { error: null };

    const { error } = await api.del(`/sets/${setId}`);

    if (error && error.status !== 404) {
      setCurrentWorkout((cw) => {
        if (!cw || cw.id !== wId) return cw;
        return {
          ...cw,
          exercises: cw.exercises.map((e) => {
            if (e.id !== exId) return e;
            const next = [...e.sets];
            next.splice(setIdx, 0, snapshot);
            return { ...e, sets: next };
          }),
        };
      });
      patchWorkoutInList(wId, (entry) => ({
        ...entry,
        set_count: (entry.set_count ?? 0) + 1,
      }));
      flash('Could not delete set', 'alert');
      return { error };
    }

    return { error: null };
  };

  // PUT /sets/<id>. Optimistic patch in place. The api.updateSet helper
  // swallows the "no fields to update" 400 as a silent success (locked UX:
  // submitting an empty edit closes the form quietly). On any other error
  // we roll back. Field errors are bubbled up to the caller so the edit
  // row can render them inline; non-field errors get an alert toast.
  const updateSet = async (_workoutId, exId, setId, patch) => {
    const w = currentWorkout;
    if (!w) return { error: null };
    const wId = w.id;
    const exercise = w.exercises.find((e) => e.id === exId);
    if (!exercise) return { error: null };
    const snapshot = exercise.sets.find((s) => s.id === setId);
    if (!snapshot) return { error: null };

    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) =>
          e.id === exId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
            : e
        ),
      };
    });

    // Temp set or temp parent: local-only.
    if (setId < 0 || exId < 0) return { error: null };

    const result = await api.updateSet(setId, patch);

    // noop (swallowed 400) or success (200 with no error).
    if (result.noop || !result.error) return { error: null };

    // Rollback the optimistic patch.
    setCurrentWorkout((cw) => {
      if (!cw || cw.id !== wId) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((e) =>
          e.id === exId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? snapshot : s)) }
            : e
        ),
      };
    });

    if (!result.error.field) {
      flash('Could not save set', 'alert');
    }
    return { error: result.error };
  };

  // ---------- catalog mutations ----------
  // POST /exercise-types → 201 (returns the created type).
  // On 409 ConflictError, refetches the catalog so the NewTypeForm's reactive
  // dup check picks up the existing type and surfaces the "use existing"
  // affordance with a real reference.
  const createType = async (workoutId, data) => {
    const { data: created, error } = await api.post('/exercise-types', data);
    if (error) {
      if (error.status === 409) {
        // Catalog likely stale; pull the latest (first page) so the
        // dup-affordance can resolve to a real type object.
        const { data: latest } = await api.get(`/exercise-types?limit=${PAGE_SIZE}&offset=0`);
        if (latest?.data) {
          setTypes(latest.data);
          setTypesHasNext(!!latest.pagination?.has_next);
          setTypesTotal(latest.pagination?.total ?? 0);
        }
      }
      return { error };
    }
    setTypes((ts) => [...ts, created]);
    setTypesTotal((n) => n + 1);
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
    workoutsTotal,
    workoutsHasNext,
    workoutsLoadingMore,
    currentWorkout,
    currentWorkoutStatus,
    currentWorkoutError,
    currentNotFound,
    types,
    typesStatus,
    typesError,
    typesTotal,
    typesHasNext,
    typesLoadingMore,
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
    loadMoreWorkouts,
    fetchWorkout,
    fetchTypes,
    loadMoreTypes,
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
