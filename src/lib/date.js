// All dates in this app are the user's LOCAL calendar dates in "YYYY-MM-DD" format.
// We never use toISOString() for this, because it converts to UTC and can
// return yesterday's or tomorrow's date depending on the time zone.

export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString() {
  return toDateString(new Date());
}

// "2026-10-12" -> Date at local midnight on that day.
export function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Returns the last `count` days (including today), oldest first.
export function getLastDays(count) {
  const now = new Date();
  const days = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    // Building the date from parts handles month ends and daylight saving time.
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    days.push(toDateString(date));
  }
  return days;
}

// How many days in a row the habit was completed, counting back from today.
// If today isn't checked off yet, the streak is still alive and counts from yesterday.
export function getCurrentStreak(completedDates) {
  const now = new Date();
  let offset = completedDates.has(getTodayString()) ? 0 : 1;
  let streak = 0;
  while (
    completedDates.has(
      toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset))
    )
  ) {
    streak++;
    offset++;
  }
  return streak;
}

// "October 12"
export function formatMonthDay(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// "Monday, October 12, 2026"
export function formatFullDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// "Oct 12"
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
