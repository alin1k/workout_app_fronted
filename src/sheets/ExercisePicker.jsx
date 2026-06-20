import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import Sheet from '../components/Sheet.jsx';
import MuscleBadge from '../components/MuscleBadge.jsx';
import NewTypeForm from './NewTypeForm.jsx';

function ExercisePicker({
  types,
  typesStatus,
  typesError,
  typesHasNext,
  typesLoadingMore,
  fetchTypes,
  loadMoreTypes,
  onPick,
  onCreateType,
  onClose,
}) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const query = q.trim().toLowerCase();
  // Backend already returns types sorted alphabetically — don't re-sort.
  const filtered = useMemo(() => {
    if (!query) return types;
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.muscle_group && t.muscle_group.includes(query))
    );
  }, [types, query]);

  const exactExists = filtered.some((t) => t.name.toLowerCase() === query);
  const existsName = (n) =>
    types.find((t) => t.name.trim().toLowerCase() === n.trim().toLowerCase());

  const isLoading = typesStatus === 'loading' && types.length === 0;
  const isError = typesStatus === 'error';

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
          onCreate={async (data, existing) => {
            if (existing) {
              onPick(existing);
              return;
            }
            return await onCreateType(data);
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
              opacity: isError ? 0.55 : 1,
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
              disabled={isError}
            />
          </div>

          {isLoading ? (
            <div className="col gap8" aria-busy="true" aria-label="Loading catalog">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pick skeleton" style={{ minHeight: 54 }} />
              ))}
            </div>
          ) : isError ? (
            <div className="empty fade-in" style={{ padding: '14px 8px', gap: 12 }}>
              <div>
                <div className="h-md" style={{ marginBottom: 4 }}>Couldn’t load catalog</div>
                <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 260 }}>
                  {typesError?.message || 'Try again in a moment.'}
                </div>
              </div>
              <Button variant="soft" onClick={fetchTypes}>
                <Icon name="repeat" size={16} /> Retry
              </Button>
            </div>
          ) : types.length === 0 ? (
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
                  {t.muscle_group && <MuscleBadge muscle={t.muscle_group} outline />}
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
              {/* Search filters only the already-loaded pages, so hide
                  "Load more" while a query is active to avoid implying it
                  searches the whole catalog. */}
              {typesHasNext && !query && (
                <Button
                  variant="soft"
                  onClick={loadMoreTypes}
                  disabled={typesLoadingMore}
                  style={{ marginTop: 2 }}
                >
                  {typesLoadingMore ? 'Loading…' : 'Load more'}
                </Button>
              )}
            </div>
          )}

          {!isError && (
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
          )}
        </div>
      )}
    </Sheet>
  );
}

export default ExercisePicker;
