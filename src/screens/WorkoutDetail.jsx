/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { fmtRelative, fmtTime } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import IconButton from '../components/IconButton.jsx';
import AppBar from '../components/AppBar.jsx';
import ExerciseCard from './ExerciseCard.jsx';

function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    workouts,
    typeById,
    openSheet,
    addSet,
    removeSet,
    updateSet,
    moveExercise,
    askDeleteWorkout,
    askRemoveExercise,
  } = useApp();

  const workout = workouts.find((w) => w.id === id);
  const exists = !!workout;

  const [activeEx, setActiveEx] = useState(null);

  // Bounce home if the workout vanishes (e.g. just deleted).
  useEffect(() => {
    if (!exists) navigate('/', { replace: true });
  }, [exists, navigate]);

  // Keep the active exercise pinned to the most recently-added one.
  useEffect(() => {
    if (!workout) return;
    const ex = workout.exercises;
    if (ex.length === 0) {
      setActiveEx(null);
      return;
    }
    if (!ex.find((e) => e.id === activeEx)) {
      setActiveEx(ex[ex.length - 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.exercises.length, workout?.id]);

  if (!workout) return null;

  return (
    <>
      <AppBar
        onBack={() => navigate('/')}
        subtitle={
          fmtRelative(workout.performedAt || workout.createdAt) +
          (workout.performedAt ? ' · ' + fmtTime(workout.performedAt) : '')
        }
        title={workout.name}
        right={
          <div className="row" style={{ gap: 0 }}>
            <IconButton
              name="pencil"
              size={19}
              label="Edit workout"
              onClick={() => openSheet({ kind: 'editWorkout', workoutId: workout.id })}
            />
            <IconButton
              name="trash"
              size={19}
              label="Delete workout"
              onClick={() => askDeleteWorkout(workout)}
            />
          </div>
        }
      />
      <div className="scroll">
        <div className="page" style={{ paddingTop: 14 }}>
          {workout.notes ? (
            <div
              className="card card-pad fade-in"
              style={{ marginBottom: 16, display: 'flex', gap: 11, background: 'var(--surface)' }}
            >
              <span style={{ color: 'var(--accent)', flex: '0 0 auto', marginTop: 1 }}>
                <Icon name="note" size={18} />
              </span>
              <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{workout.notes}</span>
            </div>
          ) : null}

          {workout.exercises.length === 0 ? (
            <div className="empty fade-in" style={{ marginTop: 30 }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-soft)',
                  color: 'var(--primary-deep)',
                }}
              >
                <Icon name="dumbbell" size={32} stroke={1.7} />
              </div>
              <div>
                <div className="display-lg" style={{ marginBottom: 6 }}>Empty session</div>
                <div className="muted" style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 260 }}>
                  Add your first movement from the catalog to start logging sets.
                </div>
              </div>
            </div>
          ) : (
            <div className="col gap12">
              {workout.exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  type={typeById[ex.typeId]}
                  index={i}
                  total={workout.exercises.length}
                  active={activeEx === ex.id}
                  onActivate={() => setActiveEx(ex.id)}
                  onAddSet={(s) => {
                    addSet(workout.id, ex.id, s);
                    setActiveEx(ex.id);
                  }}
                  onRemoveSet={(sid) => removeSet(workout.id, ex.id, sid)}
                  onUpdateSet={(sid, s) => updateSet(workout.id, ex.id, sid, s)}
                  onMove={(d) => moveExercise(workout.id, ex.id, d)}
                  onRemove={() => askRemoveExercise(workout.id, ex)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="dock">
        <Button
          size="lg"
          className="btn-block"
          onClick={() => openSheet({ kind: 'addExercise', workoutId: workout.id })}
        >
          <Icon name="plus" size={20} /> Add exercise
        </Button>
      </div>
    </>
  );
}

export default WorkoutDetail;
