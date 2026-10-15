import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ProtectedRoute';
import { getHabit, getLogsInRange } from '../services/habits';
import {
  formatFullDate,
  formatShortDate,
  getCurrentStreak,
  getLastDays,
  getTodayString,
  parseDateString,
} from '../lib/date';
import { getErrorMessage } from '../lib/errors';
import '../styles/habits.css';

const HISTORY_DAYS = 30;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function HabitDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [habit, setHabit] = useState(null);
  const [days, setDays] = useState(() => getLastDays(HISTORY_DAYS));
  const [completedDates, setCompletedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Ignore results of an old request if the user navigates away before it finishes.
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');
      setNotFound(false);

      // A malformed id can't belong to any habit.
      if (!UUID_PATTERN.test(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch the habit — filtered by user_id, so other users' habits are never returned.
        const foundHabit = await getHabit(id, user.id);
        if (ignore) return;

        if (!foundHabit) {
          setNotFound(true);
          return;
        }

        // 2. Fetch its logs for the last 30 days.
        const lastDays = getLastDays(HISTORY_DAYS);
        const logs = await getLogsInRange(id, lastDays[0], lastDays[lastDays.length - 1]);
        if (ignore) return;

        setHabit(foundHabit);
        setDays(lastDays);
        setCompletedDates(new Set(logs.map((log) => log.date)));
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, user.id, reloadCount]);

  const today = getTodayString();
  const completedCount = days.filter((day) => completedDates.has(day)).length;
  const streak = getCurrentStreak(completedDates);
  // Empty cells so the first day lines up under the right weekday column.
  const leadingBlanks = days.length > 0 ? parseDateString(days[0]).getDay() : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <Link to="/" className="btn btn-secondary btn-sm">
            ← Back
          </Link>
          <span className="app-title">Habit Tracker</span>
        </div>
      </header>

      <main className="container page-content">
        {loading && <PageLoader />}

        {!loading && error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setReloadCount((count) => count + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && notFound && (
          <div className="empty-state">
            <p className="empty-state-title">Habit not found</p>
            <p>This habit doesn&apos;t exist or may have been deleted.</p>
            <Link to="/" className="btn btn-primary">
              Back to habits
            </Link>
          </div>
        )}

        {!loading && !error && !notFound && habit && (
          <>
            <h1 className="page-title detail-title">{habit.name}</h1>
            {habit.description && <p className="detail-description">{habit.description}</p>}

            <p className="streak-badge">
              {streak > 0 ? `🔥 ${streak}-day streak` : 'No streak yet — check it off today!'}
            </p>

            <section className="card history-card" aria-labelledby="history-heading">
              <div className="history-header">
                <h2 id="history-heading" className="section-title">
                  Last {HISTORY_DAYS} days
                </h2>
                <p className="history-summary">
                  {completedCount} of {days.length} days completed
                </p>
              </div>

              <p className="history-range">
                {formatShortDate(parseDateString(days[0]))} –{' '}
                {formatShortDate(parseDateString(days[days.length - 1]))}
              </p>

              <div className="history-grid" role="list">
                {WEEKDAYS.map((weekday) => (
                  <span key={weekday} className="history-weekday" aria-hidden="true">
                    {weekday}
                  </span>
                ))}

                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <span key={`blank-${index}`} className="history-cell is-blank" aria-hidden="true" />
                ))}

                {days.map((day) => {
                  const date = parseDateString(day);
                  const isCompleted = completedDates.has(day);
                  const isToday = day === today;
                  const classes = ['history-cell'];
                  if (isCompleted) classes.push('is-completed');
                  if (isToday) classes.push('is-today');

                  return (
                    <span
                      key={day}
                      role="listitem"
                      className={classes.join(' ')}
                      title={`${formatFullDate(date)} — ${isCompleted ? 'Completed' : 'Not completed'}`}
                      aria-label={`${formatFullDate(date)}: ${isCompleted ? 'completed' : 'not completed'}`}
                    >
                      <span className="history-day-number">{date.getDate()}</span>
                      {isCompleted && (
                        <span className="history-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <div className="history-legend" aria-hidden="true">
                <span className="legend-item">
                  <span className="legend-swatch is-completed" /> Completed
                </span>
                <span className="legend-item">
                  <span className="legend-swatch" /> Not completed
                </span>
                <span className="legend-item">
                  <span className="legend-swatch is-today" /> Today
                </span>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
