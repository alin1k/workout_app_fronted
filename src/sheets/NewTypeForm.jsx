import { useState } from 'react';
import { MUSCLE_GROUPS } from '../data/seed.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import Field from '../components/Field.jsx';
import TextInput from '../components/TextInput.jsx';

function NewTypeForm({ presetName, existsName, onCreate, onCancel }) {
  const [name, setName] = useState(presetName || '');
  const [muscle, setMuscle] = useState('');
  const [desc, setDesc] = useState('');
  const [touched, setTouched] = useState(false);

  const dup = existsName(name);
  const blankErr = name.trim() === '' ? 'Name is required.' : null;
  const dupErr = dup ? `“${dup.name}” already exists in the catalog.` : null;
  const err = blankErr || dupErr;

  const submit = () => {
    setTouched(true);
    if (err) return;
    onCreate({ name: name.trim(), muscle: muscle || '', description: desc.trim() });
  };

  return (
    <div className="col gap16 fade-in">
      <button
        className="row gap8"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 13.5,
          fontFamily: 'var(--font-body)',
        }}
      >
        <Icon name="back" size={16} /> Back to catalog
      </button>

      <Field
        label="Movement name"
        error={touched ? err : null}
        hint={!err ? 'Must be unique across the catalog.' : null}
      >
        <TextInput
          value={name}
          onChange={setName}
          invalid={touched && err}
          placeholder="Pendlay Row"
          autoFocus
        />
        {dup && (
          <button
            className="row gap8 fade-in"
            onClick={() => onCreate(null, dup)}
            style={{
              marginTop: 8,
              background: 'var(--accent-soft)',
              border: 'none',
              borderRadius: 'calc(var(--radius)*0.6)',
              padding: '10px 12px',
              cursor: 'pointer',
              color: 'var(--primary-deep)',
              fontWeight: 700,
              fontSize: 13.5,
              width: '100%',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span>Use the existing “{dup.name}” instead</span>
            <Icon name="chevronRight" size={16} />
          </button>
        )}
      </Field>

      <Field label="Muscle group" hint="Optional — helps grouping later.">
        <select className="input" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
          <option value="">— none —</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Description" hint="Optional — form cues, alternative names.">
        <textarea
          className="textarea"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Explosive row, bar resets on the floor each rep."
        />
      </Field>

      <Button variant="primary" className="btn-block" onClick={submit}>
        <Icon name="plus" size={18} /> Create &amp; add to workout
      </Button>
    </div>
  );
}

export default NewTypeForm;
