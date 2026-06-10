import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import StageBackdrop from './components/StageBackdrop.jsx';
import Toast from './components/Toast.jsx';
import Confirm from './components/Confirm.jsx';
import Login from './screens/Login.jsx';
import WorkoutsList from './screens/WorkoutsList.jsx';
import WorkoutDetail from './screens/WorkoutDetail.jsx';
import ResetPassword from './screens/ResetPassword.jsx';
import WorkoutForm from './sheets/WorkoutForm.jsx';
import ExercisePicker from './sheets/ExercisePicker.jsx';

function GlobalOverlays() {
  const {
    workouts,
    types,
    typesStatus,
    typesError,
    fetchTypes,
    toast,
    confirm,
    sheet,
    closeConfirm,
    closeSheet,
    createWorkout,
    saveWorkout,
    addExercise,
    createType,
  } = useApp();
  const navigate = useNavigate();

  const editingWorkout =
    sheet?.kind === 'editWorkout' ? workouts.find((w) => w.id === sheet.workoutId) : null;

  return (
    <>
      {sheet?.kind === 'newWorkout' && (
        <WorkoutForm
          onSave={async (data) => {
            const result = await createWorkout(data);
            if (result.error) return result;
            navigate(`/workouts/${result.id}`);
            return result;
          }}
          onClose={closeSheet}
        />
      )}
      {sheet?.kind === 'editWorkout' && editingWorkout && (
        <WorkoutForm
          initial={editingWorkout}
          onSave={(data) => saveWorkout(editingWorkout.id, data)}
          onClose={closeSheet}
        />
      )}
      {sheet?.kind === 'addExercise' && (
        <ExercisePicker
          types={types}
          typesStatus={typesStatus}
          typesError={typesError}
          fetchTypes={fetchTypes}
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

function ProtectedShell() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<WorkoutsList />} />
        <Route path="/workouts/:id" element={<WorkoutDetail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalOverlays />
    </AppProvider>
  );
}

function App() {
  return (
    <div className="stage">
      <StageBackdrop />
      <div className="app-root">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <ProtectedShell />
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App;
