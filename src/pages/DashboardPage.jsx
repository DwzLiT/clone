import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import HabitList from '../components/HabitList';
import HabitForm from '../components/HabitForm';
import { PageLoader } from '../components/ProtectedRoute';
import {
  completeHabit,
  createHabit,
  deleteHabit,
  getHabits,
  getLogsForDate,
  undoCompletion,
  updateHabit,
} from '../services/habits';
import { formatMonthDay, getTodayString, parseDateString } from '../lib/date';
import { getErrorMessage } from '../lib/errors';
import '../styles/habits.css';

// Returns a copy of `object` without `key`.
function omitKey(object, key) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  const [today, setToday] = useState(getTodayString());
  const [habits, setHabits] = useState([]);
  const [logsByHabitId, setLogsByHabitId] = useState({}); // { [habitId]: today's log }
  const [savingIds, setSavingIds] = useState({}); // { [habitId]: true } while saving
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    const date = getTodayString();
    setToday(date);

    try {
      // 1. Fetch the user's habits. 2. Fetch today's logs. 3. Match them by habit_id.
      const habitList = await getHabits(user.id);
      const logs = await getLogsForDate(
        habitList.map((habit) => habit.id),
        date
      );

      const logMap = {};
      logs.forEach((log) => {
        logMap[log.habit_id] = log;
      });

      setHabits(habitList);
      setLogsByHabitId(logMap);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function setSaving(habitId, isSaving) {
    setSavingIds((prev) => (isSaving ? { ...prev, [habitId]: true } : omitKey(prev, habitId)));
  }

  async function handleToggle(habitId) {
    if (savingIds[habitId]) return;
    setActionError('');

    // If the page was left open past midnight, reload so we work with the new day.
    if (getTodayString() !== today) {
      setActionError("It's a new day! Your habits have been refreshed — tap again to check one off.");
      loadData();
      return;
    }

    const existingLog = logsByHabitId[habitId];
    setSaving(habitId, true);

    // Update the screen right away, then save. If saving fails, restore the old state.
    if (existingLog) {
      setLogsByHabitId((prev) => omitKey(prev, habitId));
    } else {
      setLogsByHabitId((prev) => ({ ...prev, [habitId]: { id: null, habit_id: habitId, date: today } }));
    }

    try {
      if (existingLog) {
        await undoCompletion(existingLog.id);
      } else {
        const log = await completeHabit(habitId, today);
        setLogsByHabitId((prev) => ({ ...prev, [habitId]: log }));
      }
    } catch (err) {
      setLogsByHabitId((prev) =>
        existingLog ? { ...prev, [habitId]: existingLog } : omitKey(prev, habitId)
      );
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(habitId, false);
    }
  }

  // Errors are thrown back to HabitForm, which shows them inside the form.
  async function handleCreate(values) {
    const habit = await createHabit(user.id, values);
    setHabits((prev) => [...prev, habit]);
    setShowAddForm(false);
  }

  async function handleUpdate(habitId, values) {
    const updated = await updateHabit(habitId, user.id, values);
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? updated : habit)));
  }

  // Returns true if the habit was deleted.
  async function handleDelete(habitId) {
    setActionError('');
    try {
      await deleteHabit(habitId, user.id);
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
      setLogsByHabitId((prev) => omitKey(prev, habitId));
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err));
      return false;
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    // ProtectedRoute redirects to /login and this page's state is discarded.
  }

  const completedCount = habits.filter((habit) => logsByHabitId[habit.id]).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <span className="app-title">Habit Tracker</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <main className="container page-content">
        <h1 className="page-title">Today, {formatMonthDay(parseDateString(today))}</h1>

        {loading && <PageLoader />}

        {!loading && loadError && (
          <div className="alert alert-error" role="alert">
            <span>{loadError}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {habits.length > 0 && (
              <section className="summary-card" aria-label="Today's progress">
                <p className="summary-text">
                  <strong>{completedCount}</strong> of <strong>{habits.length}</strong>{' '}
                  {habits.length === 1 ? 'habit' : 'habits'} completed
                  {completedCount === habits.length && <span className="summary-done"> 🎉 All done!</span>}
                </p>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                  aria-label="Habits completed today"
                >
                  <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                </div>
              </section>
            )}

            {actionError && (
              <div className="alert alert-error" role="alert">
                <span>{actionError}</span>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setActionError('')}
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}

            <HabitList
              habits={habits}
              logsByHabitId={logsByHabitId}
              savingIds={savingIds}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />

            {showAddForm ? (
              <div className="card add-habit-card">
                <HabitForm
                  title="New habit"
                  submitLabel="Add habit"
                  onSubmit={handleCreate}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary add-habit-button"
                onClick={() => setShowAddForm(true)}
              >
                + Add Habit
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
