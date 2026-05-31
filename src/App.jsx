import { SEED_TYPES, SEED_WORKOUTS, MUSCLE_GROUPS } from './data/seed.js';
import { fmtRelative, fmtTime, fmtDay } from './lib/format.js';
import { uid } from './lib/id.js';

function App() {
  return (
    <div className="stage">
      <div className="app-root">
        <header className="appbar">
          <div className="grow">
            <div className="display-lg">Grove</div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Phase 3 sanity check</div>
          </div>
        </header>
        <div className="scroll">
          <div className="page">
            <p className="label">Seed workouts</p>
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              {SEED_WORKOUTS.map((w) => (
                <li key={w.id} style={{ marginBottom: 6 }}>
                  <b>{w.name}</b> · <span className="muted">{fmtRelative(w.performedAt)} · {fmtTime(w.performedAt)} · {fmtDay(w.performedAt)}</span>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {w.exercises.length} exercises ·{' '}
                    {w.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
                  </div>
                </li>
              ))}
            </ul>

            <p className="label" style={{ marginTop: 18 }}>Catalog ({SEED_TYPES.length})</p>
            <p className="muted" style={{ fontSize: 14 }}>
              {SEED_TYPES.map((t) => t.name).join(', ')}
            </p>

            <p className="label" style={{ marginTop: 18 }}>Muscle groups</p>
            <p className="muted" style={{ fontSize: 14 }}>{MUSCLE_GROUPS.join(', ')}</p>

            <p className="label" style={{ marginTop: 18 }}>uid() helper</p>
            <p className="muted" style={{ fontSize: 14 }}>{uid('test')}, {uid('test')}, {uid('test')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
