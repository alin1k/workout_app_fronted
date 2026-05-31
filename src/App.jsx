import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import StageBackdrop from './components/StageBackdrop.jsx';
import Toast from './components/Toast.jsx';
import Confirm from './components/Confirm.jsx';
import WorkoutsList from './screens/WorkoutsList.jsx';
import WorkoutDetail from './screens/WorkoutDetail.jsx';

function Shell() {
  // Temporary local navigation — replaced by react-router in Phase 8.
  const [activeId, setActiveId] = useState(null);
  const { toast, confirm, closeConfirm, openSheet, flash } = useApp();

  const goToWorkout = (id) => setActiveId(id);
  const goHome = () => setActiveId(null);

  return (
    <>
      {activeId == null ? (
        <WorkoutsList
          onOpen={goToWorkout}
          onNew={() => {
            openSheet({ kind: 'newWorkout' });
            flash('Sheet wired in Phase 7', 'leaf');
          }}
        />
      ) : (
        <WorkoutDetail
          workoutId={activeId}
          onBack={goHome}
          onEdit={() => {
            openSheet({ kind: 'editWorkout' });
            flash('Sheet wired in Phase 7', 'leaf');
          }}
          onAddExercise={() => {
            openSheet({ kind: 'addExercise' });
            flash('Sheet wired in Phase 7', 'leaf');
          }}
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
