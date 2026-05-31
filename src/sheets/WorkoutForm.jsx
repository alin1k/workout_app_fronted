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
    initial ? toLocalInput(initial.performedAt) : toLocalInput(new Date().toISOString())
  );
  const [notes, setNotes] = useState(initial ? initial.notes || '' : '');
  const [touched, setTouched] = useState(false);

  const nameErr = name.trim() === '' ? 'Give this session a name.' : null;
  const submit = () => {
    setTouched(true);
    if (nameErr) return;
    onSave({
      name: name.trim(),
      performedAt: when ? new Date(when).toISOString() : null,
      notes: notes.trim(),
    });
  };

  return (
    <Sheet
      title={editing ? 'Edit workout' : 'New workout'}
      subtitle={editing ? 'Update session' : 'Start a session'}
      onClose={onClose}
      footer={
        <>
          <Button variant="soft" className="btn-block" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="btn-block" onClick={submit}>
            {editing ? 'Save changes' : 'Start workout'}
          </Button>
        </>
      }
    >
      <div className="col gap16">
        <Field
          label="Name"
          error={touched ? nameErr : null}
          hint="How you think about it — “Push day”, “Quick legs”."
        >
          <TextInput
            value={name}
            onChange={setName}
            invalid={touched && nameErr}
            placeholder="Push day"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </Field>
        <Field label="Date & time" hint="Defaults to now. Backdate it if you’re catching up.">
          <div className="row gap8">
            <span style={{ color: 'var(--text-muted)' }}>
              <Icon name="calendar" size={18} />
            </span>
            <input
              className="input"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Notes" hint="Optional — “felt strong”, “bad sleep”, “PR attempt”.">
          <textarea
            className="textarea"
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
