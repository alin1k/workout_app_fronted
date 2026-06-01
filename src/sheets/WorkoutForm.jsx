import { useState } from 'react';
import { toLocalInput } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import Sheet from '../components/Sheet.jsx';
import Field from '../components/Field.jsx';
import TextInput from '../components/TextInput.jsx';

function WorkoutForm({ initial, onSave, onClose }) {
  const editing = !!initial;
  const [name, setName] = useState(initial ? initial.name : '');
  const [when, setWhen] = useState(
    initial ? toLocalInput(initial.performed_at) : toLocalInput(new Date().toISOString())
  );
  const [notes, setNotes] = useState(initial ? initial.notes || '' : '');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const clientNameErr = name.trim() === '' ? 'Give this session a name.' : null;
  // Server-side errors take precedence; client-side guard only after Submit.
  const nameErrShown = fieldErrors.name || (touched ? clientNameErr : null);

  const submit = async () => {
    setTouched(true);
    if (clientNameErr) return;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    const data = {
      name: name.trim(),
      performed_at: when ? new Date(when).toISOString() : null,
      notes: notes.trim(),
    };
    const result = await onSave(data);
    if (result?.error) {
      if (result.error.field) {
        setFieldErrors({ [result.error.field]: result.error.message });
      } else {
        setFormError(result.error.message || 'Could not save.');
      }
      setSubmitting(false);
    }
    // On success the parent closes the sheet; we unmount and don't setState.
  };

  return (
    <Sheet
      title={editing ? 'Edit workout' : 'New workout'}
      subtitle={editing ? 'Update session' : 'Start a session'}
      onClose={onClose}
      footer={
        <>
          <Button variant="soft" className="btn-block" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" className="btn-block" onClick={submit} disabled={submitting}>
            {submitting
              ? (editing ? 'Saving…' : 'Starting…')
              : (editing ? 'Save changes' : 'Start workout')}
          </Button>
        </>
      }
    >
      <div className="col gap16">
        {formError && (
          <div
            className="err fade-in"
            style={{
              background: 'var(--danger-soft)',
              padding: '10px 12px',
              borderRadius: 'calc(var(--radius)*0.6)',
            }}
          >
            <Icon name="alert" size={16} /> {formError}
          </div>
        )}
        <Field
          label="Name"
          error={nameErrShown}
          hint={!nameErrShown ? 'How you think about it — “Push day”, “Quick legs”.' : null}
        >
          <TextInput
            value={name}
            onChange={setName}
            invalid={!!nameErrShown}
            placeholder="Push day"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </Field>
        <Field
          label="Date & time"
          error={fieldErrors.performed_at}
          hint={!fieldErrors.performed_at ? 'Defaults to now. Backdate it if you’re catching up.' : null}
        >
          <div className="row gap8">
            <span style={{ color: 'var(--text-muted)' }}>
              <Icon name="calendar" size={18} />
            </span>
            <input
              className={'input' + (fieldErrors.performed_at ? ' invalid' : '')}
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
        </Field>
        <Field
          label="Notes"
          error={fieldErrors.notes}
          hint={!fieldErrors.notes ? 'Optional — “felt strong”, “bad sleep”, “PR attempt”.' : null}
        >
          <textarea
            className={'textarea' + (fieldErrors.notes ? ' invalid' : '')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go?"
          />
        </Field>
      </div>
    </Sheet>
  );
}

export default WorkoutForm;
