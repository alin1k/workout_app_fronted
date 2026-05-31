import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import StageBackdrop from './components/StageBackdrop.jsx';
import Toast from './components/Toast.jsx';
import Confirm from './components/Confirm.jsx';
import WorkoutsList from './screens/WorkoutsList.jsx';
import WorkoutDetail from './screens/WorkoutDetail.jsx';
import WorkoutForm from './sheets/WorkoutForm.jsx';
import ExercisePicker from './sheets/ExercisePicker.jsx';

function Shell() {
  // Temporary local navigation — replaced by react-router in Phase 8.
  const [activeId, setActiveId] = useState(null);
  const {
    workouts,
    types,
    toast,
    confirm,
    sheet,
    closeConfirm,
    closeSheet,
    openSheet,
    createWorkout,
    saveWorkout,
    addExercise,
    createType,
  } = useApp();

  const activeWorkout = activeId ? workouts.find((w) => w.id === activeId) : null;

  // If the active workout disappears (deleted), return to the list.
  useEffect(() => {
    if (activeId != null && !workouts.find((w) => w.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, workouts]);

  return (
    <>
      {activeId == null ? (
        <WorkoutsList
          onOpen={(id) => setActiveId(id)}
          onNew={() => openSheet({ kind: 'newWorkout' })}
        />
      ) : (
        activeWorkout && (
          <WorkoutDetail
            workoutId={activeId}
            onBack={() => setActiveId(null)}
            onEdit={() => openSheet({ kind: 'editWorkout', workoutId: activeId })}
            onAddExercise={() => openSheet({ kind: 'addExercise', workoutId: activeId })}
          />
        )
      )}

      {sheet?.kind === 'newWorkout' && (
        <WorkoutForm
          onSave={(data) => {
            const id = createWorkout(data);
            setActiveId(id);
          }}
          onClose={closeSheet}
        />
      )}
      {sheet?.kind === 'editWorkout' && activeWorkout && (
        <WorkoutForm
          initial={activeWorkout}
          onSave={(data) => saveWorkout(activeWorkout.id, data)}
          onClose={closeSheet}
        />
      )}
      {sheet?.kind === 'addExercise' && (
        <ExercisePicker
          types={types}
          onPick={(type) => addExercise(sheet.workoutId, type)}
          onCreateType={(data) => createType(sheet.workoutId, data)}
          onClose={closeSheet}
        />
      )}

      {confirm && <Confirm {...confirm} onCancel={closeConfirm} />}
      <Toast message={toast?.message} icon={toast?.icon} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="stage">
        <StageBackdrop />
        <div className="app-root">
          <Shell />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
