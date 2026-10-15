import HabitItem from './HabitItem';

export default function HabitList({ habits, logsByHabitId, savingIds, onToggle, onUpdate, onDelete }) {
  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">No habits yet</p>
        <p>Add your first habit below and start checking it off every day.</p>
      </div>
    );
  }

  return (
    <ul className="habit-list">
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          isCompleted={Boolean(logsByHabitId[habit.id])}
          isSaving={Boolean(savingIds[habit.id])}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
