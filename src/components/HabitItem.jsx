import { useState } from 'react';
import { Link } from 'react-router-dom';
import HabitForm from './HabitForm';

export default function HabitItem({ habit, isCompleted, isSaving, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkboxId = `habit-check-${habit.id}`;

  async function handleUpdate(values) {
    await onUpdate(habit.id, values);
    setIsEditing(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${habit.name}"?\n\nIts completion history will be deleted too. This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const deleted = await onDelete(habit.id);
    // If it worked, this item disappears from the list; otherwise re-enable the buttons.
    if (!deleted) setIsDeleting(false);
  }

  if (isEditing) {
    return (
      <li className="habit-item habit-item-editing">
        <HabitForm
          title="Edit habit"
          initialName={habit.name}
          initialDescription={habit.description || ''}
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  const busy = isSaving || isDeleting;

  return (
    <li className={`habit-item${isCompleted ? ' is-completed' : ''}${busy ? ' is-busy' : ''}`}>
      <input
        id={checkboxId}
        type="checkbox"
        className="habit-checkbox"
        checked={isCompleted}
        onChange={() => onToggle(habit.id)}
        disabled={busy}
      />

      <div className="habit-content">
        <label htmlFor={checkboxId} className="habit-name">
          {habit.name}
        </label>
        {habit.description && <p className="habit-description">{habit.description}</p>}
        {isSaving && <span className="habit-status">Saving…</span>}
      </div>

      <div className="habit-actions">
        <Link to={`/habits/${habit.id}`} className="btn btn-ghost btn-sm">
          History
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setIsEditing(true)}
          disabled={busy}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger btn-sm"
          onClick={handleDelete}
          disabled={busy}
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  );
}
