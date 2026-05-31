import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { fmtRelative } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';

function summarize(workout, typeById) {
  const exCount = workout.exercises.length;
  let setCount = 0;
  const muscles = new Set();
  workout.exercises.forEach((ex) => {
    setCount += ex.sets.length;
    const t = typeById[ex.typeId];
    if (t && t.muscle) muscles.add(t.muscle);
  });
  return { exCount, setCount, muscles: [...muscles] };
}

function WorkoutsList() {
  const { workouts, typeById, openSheet } = useApp();
  const navigate = useNavigate();
  const onOpen = (id) => navigate(`/workouts/${id}`);
  const onNew = () => openSheet({ kind: 'newWorkout' });

  const sorted = useMemo(
    () => [...workouts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [workouts]
  );

  return (
    <>
      <header className="appbar">
        <div className="grow row gap10">
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              boxShadow: '0 6px 14px -8px var(--primary-deep)',
            }}
          >
            <Icon name="leaf" size={21} />
          </span>
          <div>
            <div className="display-lg" style={{ fontSize: 21, lineHeight: 1 }}>Grove</div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Training log
            </div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="page">
          {sorted.length === 0 ? (
            <div className="empty fade-in" style={{ marginTop: 40 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-soft)',
                  color: 'var(--primary-deep)',
                }}
              >
                <Icon name="leaf" size={40} stroke={1.6} />
              </div>
              <div>
                <div className="display-lg" style={{ marginBottom: 6 }}>Plant your first session</div>
                <div className="muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 280 }}>
                  Every workout you log grows your record. Start one and add the movements as you go.
                </div>
              </div>
              <Button size="lg" onClick={onNew} style={{ marginTop: 4 }}>
                <Icon name="plus" size={20} /> New workout
              </Button>
            </div>
          ) : (
            <>
              <div className="row between" style={{ marginBottom: 14 }}>
                <div className="display-xl">This&nbsp;week</div>
                <span className="chip chip-outline">
                  {sorted.length} session{sorted.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="col gap12">
                {sorted.map((w) => {
                  const s = summarize(w, typeById);
                  const when = new Date(w.performedAt || w.createdAt);
                  const isToday = fmtRelative(w.performedAt || w.createdAt) === 'Today';
                  return (
                    <button key={w.id} className="wcard fade-in" onClick={() => onOpen(w.id)}>
                      <span className={'wcard-date' + (isToday ? ' is-today' : '')}>
                        <span className="wcard-date-wd">
                          {when.toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                        <span className="wcard-date-day">{when.getDate()}</span>
                        <span className="wcard-date-mon">
                          {when.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                      </span>
                      <span className="wcard-body">
                        <span className="wcard-title">{w.name}</span>
                        <span className="wcard-meta">
                          <span>
                            <b>{s.exCount}</b> exercise{s.exCount !== 1 ? 's' : ''}
                          </span>
                          <span className="wcard-dot" />
                          <span>
                            <b>{s.setCount}</b> set{s.setCount !== 1 ? 's' : ''}
                          </span>
                        </span>
                        {s.muscles.length > 0 && (
                          <span className="wcard-tags">
                            {s.muscles.slice(0, 3).map((m) => (
                              <span key={m} className="wcard-tag">{m}</span>
                            ))}
                            {s.muscles.length > 3 && (
                              <span className="wcard-tag">+{s.muscles.length - 3}</span>
                            )}
                          </span>
                        )}
                      </span>
                      <span className="wcard-go">
                        <Icon name="chevronRight" size={20} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="dock">
          <Button size="lg" className="btn-block" onClick={onNew}>
            <Icon name="plus" size={20} /> New workout
          </Button>
        </div>
      )}
    </>
  );
}

export default WorkoutsList;
