import { useState } from 'react';
import { MUSCLE_GROUPS } from '../lib/constants.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import Field from '../components/Field.jsx';
import TextInput from '../components/TextInput.jsx';

function NewTypeForm({ presetName, existsName, onCreate, onCancel }) {
  const [name, setName] = useState(presetName || '');
  const [muscle, setMuscle] = useState('');
  const [desc, setDesc] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Reactive dup check — re-runs whenever `types` upstream changes (e.g.
  // after createType refetches on 409, dup picks up the existing type and
  // the "use existing" affordance becomes available automatically).
  const dup = existsName(name);
  const blankErr = name.trim() === '' ? 'Name is required.' : null;
  const dupErr = dup ? `“${dup.name}” already exists in the catalog.` : null;
  const clientErr = blankErr || dupErr;

  const nameServerErr = serverError?.field === 'name' ? serverError.message : null;
  // Banner shows any non-field server error that isn't already surfaced by
  // the client-side dup view. (On 409, once the catalog refetch lands, the
  // dup affordance covers it — no need to double up.)
  const bannerErr =
    serverError && !serverError.field && !dup ? serverError.message : null;

  const displayedNameErr = (touched && clientErr) || nameServerErr;

  const submit = async () => {
    setTouched(true);
    if (clientErr) return;
    setSubmitting(true);
    setServerError(null);
    const result = await onCreate({
      name: name.trim(),
      muscle_group: muscle || '',
      description: desc.trim(),
    });
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
    // On success the parent closes the sheet and we unmount.
  };

  const useExisting = () => onCreate(null, dup);

  return (
    <div className="col gap16 fade-in">
      <button
        className="row gap8"
        onClick={onCancel}
        disabled={submitting}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: submitting ? 'not-allowed' : 'pointer',
          color: 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 13.5,
          fontFamily: 'var(--font-body)',
        }}
      >
        <Icon name="back" size={16} /> Back to catalog
      </button>

      {bannerErr && (
        <div
          className="err fade-in"
          style={{
            background: 'var(--danger-soft)',
            padding: '10px 12px',
            borderRadius: 'calc(var(--radius)*0.6)',
          }}
        >
          <Icon name="alert" size={16} /> {bannerErr}
        </div>
      )}

      <Field
        label="Movement name"
        error={displayedNameErr}
        hint={!displayedNameErr ? 'Must be unique across the catalog.' : null}
      >
        <TextInput
          value={name}
          onChange={setName}
          invalid={!!displayedNameErr}
          placeholder="Pendlay Row"
          autoFocus
        />
        {dup && (
          <button
            className="row gap8 fade-in"
            onClick={useExisting}
            disabled={submitting}
            style={{
              marginTop: 8,
              background: 'var(--accent-soft)',
              border: 'none',
              borderRadius: 'calc(var(--radius)*0.6)',
              padding: '10px 12px',
              cursor: submitting ? 'not-allowed' : 'pointer',
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
        <select
          className="input"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          disabled={submitting}
        >
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
          disabled={submitting}
        />
      </Field>

      <Button variant="primary" className="btn-block" onClick={submit} disabled={submitting}>
        <Icon name="plus" size={18} />{' '}
        {submitting ? 'Creating…' : 'Create & add to workout'}
      </Button>
    </div>
  );
}

export default NewTypeForm;
