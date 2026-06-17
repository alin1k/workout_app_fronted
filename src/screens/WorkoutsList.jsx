import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { fmtRelative } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import UserMenu from '../components/UserMenu.jsx';

function WorkoutsList() {
  const { workouts, workoutsStatus, workoutsError, fetchWorkouts, openSheet } = useApp();
  const navigate = useNavigate();
  const onOpen = (id) => navigate(`/workouts/${id}`);
  const onNew = () => openSheet({ kind: 'newWorkout' });

  // Show the skeleton only on the first load, not on background refetches.
  const isInitialLoading = workoutsStatus === 'loading' && workouts.length === 0;
  const isError = workoutsStatus === 'error';
  const isEmpty = workoutsStatus === 'ready' && workouts.length === 0;

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
        <UserMenu />
      </header>

      <div className="scroll">
        <div className="page">
          {isInitialLoading ? (
            <div className="col gap12" aria-busy="true" aria-label="Loading workouts">
              {[0, 1, 2].map((i) => (
                <div key={i} className="wcard skeleton" />
              ))}
            </div>
          ) : isError ? (
            <div className="empty fade-in" style={{ marginTop: 40 }}>
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
                <Icon name="alert" size={32} stroke={1.7} />
              </div>
              <div>
                <div className="display-lg" style={{ marginBottom: 6 }}>Couldn’t load workouts</div>
                <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 280 }}>
                  {workoutsError?.message || 'Try again in a moment.'}
                </div>
              </div>
              <Button size="lg" onClick={fetchWorkouts} style={{ marginTop: 4 }}>
                <Icon name="repeat" size={18} /> Retry
              </Button>
            </div>
          ) : isEmpty ? (
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
                <div className="display-xl">Your&nbsp;workouts</div>
                <span className="chip chip-outline">
                  {workouts.length} session{workouts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="col gap12">
                {workouts.map((w) => {
                  const when = new Date(w.performed_at || w.created_at);
                  const isToday = fmtRelative(w.performed_at || w.created_at) === 'Today';
                  // Counts come from the shallow GET /workouts response;
                  // freshly-created entries get zeros from createWorkout.
                  const exCount = w.exercise_count ?? 0;
                  const setCount = w.set_count ?? 0;
                  const muscles = w.muscle_groups ?? [];
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
                            <b>{exCount}</b> exercise{exCount !== 1 ? 's' : ''}
                          </span>
                          <span className="wcard-dot" />
                          <span>
                            <b>{setCount}</b> set{setCount !== 1 ? 's' : ''}
                          </span>
                        </span>
                        {muscles.length > 0 && (
                          <span className="wcard-tags">
                            {muscles.slice(0, 3).map((m) => (
                              <span key={m} className="wcard-tag">{m}</span>
                            ))}
                            {muscles.length > 3 && (
                              <span className="wcard-tag">+{muscles.length - 3}</span>
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

      {workoutsStatus === 'ready' && workouts.length > 0 && (
        <button className="fab" onClick={onNew} aria-label="New workout" title="New workout">
          <Icon name="plus" size={26} stroke={2.4} />
        </button>
      )}
    </>
  );
}

export default WorkoutsList;
