/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import IconButton from '../components/IconButton.jsx';
import MuscleBadge from '../components/MuscleBadge.jsx';
import Stepper from '../components/Stepper.jsx';

function ExerciseCard({
  exercise,
  type,
  index,
  total,
  active,
  onActivate,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onMove,
  onRemove,
}) {
  const sets = exercise.sets;
  const last = sets[sets.length - 1];

  const [reps, setReps] = useState(last ? last.reps : 8);
  const [weight, setWeight] = useState(last ? last.weight : null);
  const [editId, setEditId] = useState(null);
  const [eReps, setEReps] = useState(0);
  const [eWeight, setEWeight] = useState(null);

  // keep composer prefilled with the latest set's values
  useEffect(() => {
    if (last) {
      setReps(last.reps);
      setWeight(last.weight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets.length]);

  const repeat = () => {
    if (last) onAddSet({ reps: last.reps, weight: last.weight });
  };
  const add = () => {
    if (reps && reps >= 1) onAddSet({ reps, weight });
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setEReps(s.reps);
    setEWeight(s.weight);
  };
  const saveEdit = () => {
    if (eReps >= 1) {
      onUpdateSet(editId, { reps: eReps, weight: eWeight });
      setEditId(null);
    }
  };

  return (
    <div
      className="card fade-in"
      style={{ overflow: 'hidden', borderColor: active ? 'var(--accent)' : 'var(--border)' }}
    >
      {/* header */}
      <div className="row" style={{ padding: '13px 14px', gap: 11, alignItems: 'flex-start' }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'var(--accent-soft)',
            color: 'var(--primary-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 14,
            flex: '0 0 auto',
          }}
        >
          {index + 1}
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <span
            className="h-md"
            style={{ fontFamily: 'var(--font-display)', fontSize: 17, display: 'block', lineHeight: 1.16 }}
          >
            {type ? type.name : 'Unknown'}
          </span>
          <div className="row gap8" style={{ marginTop: 3 }}>
            <span
              className="muted"
              style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', flex: '0 0 auto' }}
            >
              {sets.length === 0
                ? 'No sets yet'
                : sets.length + ' set' + (sets.length !== 1 ? 's' : '')}
            </span>
            {type && type.muscle && <MuscleBadge muscle={type.muscle} outline />}
          </div>
        </div>
        <div className="row" style={{ gap: 0, flex: '0 0 auto' }}>
          <IconButton
            name="chevronUp"
            size={17}
            label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            style={{ width: 34, height: 34 }}
          />
          <IconButton
            name="chevronDown"
            size={17}
            label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            style={{ width: 34, height: 34 }}
          />
          <IconButton
            name="x"
            size={17}
            label="Remove exercise"
            onClick={onRemove}
            style={{ width: 34, height: 34 }}
          />
        </div>
      </div>

      {/* sets */}
      {sets.length > 0 && (
        <div style={{ padding: '2px 14px 10px' }}>
          <div className="set-log">
            <div className="set-log-row set-log-head">
              <span>Set</span>
              <span>Reps</span>
              <span>Weight</span>
              <span></span>
            </div>
            {sets.map((s, i) =>
              editId === s.id ? (
                <div
                  key={s.id}
                  style={{ padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div className="row gap8" style={{ alignItems: 'flex-end' }}>
                    <div className="num-field">
                      <span className="label" style={{ fontSize: 10 }}>Reps</span>
                      <Stepper value={eReps} onChange={setEReps} min={1} />
                    </div>
                    <div className="num-field">
                      <span className="label" style={{ fontSize: 10 }}>Weight</span>
                      <Stepper
                        value={eWeight}
                        onChange={setEWeight}
                        step={2.5}
                        decimals
                        allowEmpty
                        placeholder="BW"
                      />
                    </div>
                  </div>
                  <div className="row gap8">
                    <Button variant="soft" className="btn-block" onClick={() => setEditId(null)}>
                      <Icon name="x" size={17} /> Cancel
                    </Button>
                    <Button variant="primary" className="btn-block" onClick={saveEdit}>
                      <Icon name="check" size={17} /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={s.id} className="set-log-row">
                  <span className="set-no">{i + 1}</span>
                  <button className="set-cell" onClick={() => startEdit(s)}>
                    <span className="set-val tnum">{s.reps}</span>
                  </button>
                  <button className="set-cell" onClick={() => startEdit(s)}>
                    {s.weight != null ? (
                      <>
                        <span className="set-val tnum">{s.weight}</span>{' '}
                        <span className="set-unit">kg</span>
                      </>
                    ) : (
                      <span className="set-unit">Bodyweight</span>
                    )}
                  </button>
                  <IconButton
                    name="trash"
                    size={16}
                    label="Remove set"
                    onClick={() => onRemoveSet(s.id)}
                    style={{ width: 32, height: 32, color: 'var(--text-muted)' }}
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* composer */}
      {active ? (
        <div
          style={{
            padding: '12px 14px 14px',
            background: 'var(--surface-alt)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {last && (
            <Button
              variant="primary"
              className="btn-block"
              onClick={repeat}
              style={{ marginBottom: 12 }}
            >
              <Icon name="repeat" size={18} /> Repeat last set · {last.reps}
              {last.weight != null ? ' × ' + last.weight + ' kg' : ' reps'}
            </Button>
          )}
          <div className="row gap10" style={{ alignItems: 'flex-end', marginBottom: 10 }}>
            <div className="num-field">
              <span className="label" style={{ fontSize: 10.5 }}>Reps</span>
              <Stepper value={reps} onChange={setReps} min={1} />
            </div>
            <div className="num-field">
              <span className="label" style={{ fontSize: 10.5 }}>Weight (kg)</span>
              <Stepper
                value={weight}
                onChange={setWeight}
                step={2.5}
                decimals
                allowEmpty
                placeholder="BW"
              />
            </div>
          </div>
          <Button variant={last ? 'soft' : 'primary'} className="btn-block" onClick={add}>
            <Icon name="plus" size={18} /> {last ? 'Add another set' : 'Add set'}
          </Button>
        </div>
      ) : (
        <button
          className="row gap8"
          onClick={onActivate}
          style={{
            width: '100%',
            border: 'none',
            borderTop: '1px solid var(--border)',
            background: 'transparent',
            padding: '12px 14px',
            cursor: 'pointer',
            color: 'var(--primary-deep)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14.5,
            justifyContent: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <Icon name="plus" size={17} /> Log a set
        </button>
      )}
    </div>
  );
}

export default ExerciseCard;
