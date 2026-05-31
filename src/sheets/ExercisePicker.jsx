import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';
import MuscleBadge from '../components/MuscleBadge.jsx';
import NewTypeForm from './NewTypeForm.jsx';

function ExercisePicker({ types, onPick, onCreateType, onClose }) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = [...types].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.muscle && t.muscle.includes(query))
    );
  }, [types, query]);

  const exactExists = filtered.some((t) => t.name.toLowerCase() === query);
  const existsName = (n) =>
    types.find((t) => t.name.trim().toLowerCase() === n.trim().toLowerCase());

  return (
    <Sheet
      title={creating ? 'New movement' : 'Add exercise'}
      subtitle={creating ? 'Add to the catalog' : 'Pick from the catalog'}
      onClose={onClose}
    >
      {creating ? (
        <NewTypeForm
          presetName={q.trim()}
          existsName={existsName}
          onCancel={() => setCreating(false)}
          onCreate={(data, existing) => {
            if (existing) {
              onPick(existing);
              return;
            }
            onCreateType(data);
          }}
        />
      ) : (
        <div className="col gap14">
          <div
            className="row gap8"
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 'calc(var(--radius)*0.7 + 2px)',
              padding: '0 12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              <Icon name="search" size={18} />
            </span>
            <input
              className="input"
              style={{
                border: 'none',
                padding: '12px 0',
                background: 'transparent',
                boxShadow: 'none',
              }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movements…"
              autoFocus
            />
          </div>

          {types.length === 0 ? (
            <div className="empty" style={{ padding: '20px 10px' }}>
              <div className="muted" style={{ fontSize: 14.5 }}>
                Your catalog is empty.<br />Add the first movement below.
              </div>
            </div>
          ) : (
            <div className="col gap8">
              {filtered.map((t) => (
                <button key={t.id} className="pick" onClick={() => onPick(t)}>
                  <span style={{ color: 'var(--accent)', flex: '0 0 auto' }}>
                    <Icon name="dumbbell" size={18} />
                  </span>
                  <span className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</span>
                    {t.description && (
                      <span
                        className="muted"
                        style={{
                          fontSize: 12.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.description}
                      </span>
                    )}
                  </span>
                  {t.muscle && <MuscleBadge muscle={t.muscle} outline />}
                  <span style={{ color: 'var(--text-muted)' }}>
                    <Icon name="plus" size={18} />
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div
                  className="muted fade-in"
                  style={{ fontSize: 14, padding: '8px 2px', textAlign: 'center' }}
                >
                  No movement matches “{q.trim()}”.
                </div>
              )}
            </div>
          )}

          <button
            className="pick"
            style={{
              borderStyle: 'dashed',
              justifyContent: 'center',
              color: 'var(--primary-deep)',
              fontWeight: 700,
            }}
            onClick={() => setCreating(true)}
          >
            <Icon name="plus" size={18} />{' '}
            {query && !exactExists ? `Add “${q.trim()}” as new movement` : 'Add new movement'}
          </button>
        </div>
      )}
    </Sheet>
  );
}

export default ExercisePicker;
