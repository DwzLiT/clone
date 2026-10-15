import { useId, useState } from 'react';
import { getErrorMessage } from '../lib/errors';

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

function validate(name, description) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  else if (name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `Name can be at most ${NAME_MAX_LENGTH} characters.`;
  }
  if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description can be at most ${DESCRIPTION_MAX_LENGTH} characters.`;
  }
  return errors;
}

// Used both for creating and for editing a habit.
// `onSubmit` receives { name, description } and should throw if saving fails.
export default function HabitForm({
  title,
  initialName = '',
  initialDescription = '',
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Validation messages appear only after the first submit attempt.
  const errors = submitted ? validate(name, description) : {};

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSubmitted(true);
    setSaveError('');
    if (Object.keys(validate(name, description)).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      // On success the parent closes (unmounts) this form.
    } catch (err) {
      setSaveError(getErrorMessage(err));
      setSaving(false);
    }
  }

  // Unique ids so labels work even when several forms are open at once.
  const formId = useId();
  const nameId = `${formId}-name`;
  const descriptionId = `${formId}-description`;

  return (
    <form className="habit-form" onSubmit={handleSubmit} noValidate>
      {title && <h3 className="habit-form-title">{title}</h3>}

      {saveError && (
        <div className="alert alert-error" role="alert">
          {saveError}
        </div>
      )}

      <div className="form-field">
        <label htmlFor={nameId}>Name</label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Read 10 minutes"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={`${nameId}-msg`}
          disabled={saving}
          autoFocus
        />
        <div className="field-meta" id={`${nameId}-msg`}>
          <span className="field-error">{errors.name}</span>
          <span className={name.trim().length > NAME_MAX_LENGTH ? 'char-count over' : 'char-count'}>
            {name.trim().length}/{NAME_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor={descriptionId}>
          Description <span className="optional">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why does this habit matter to you?"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={`${descriptionId}-msg`}
          disabled={saving}
        />
        <div className="field-meta" id={`${descriptionId}-msg`}>
          <span className="field-error">{errors.description}</span>
          <span
            className={
              description.trim().length > DESCRIPTION_MAX_LENGTH ? 'char-count over' : 'char-count'
            }
          >
            {description.trim().length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
