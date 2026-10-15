import { supabase } from '../lib/supabase';

// Every function either returns data or throws the Supabase error.
// Components catch the error and show a friendly message (see lib/errors.js).

function notFoundError() {
  const error = new Error('Habit not found');
  error.code = 'NOT_FOUND';
  return error;
}

// ---------- Habits ----------

export async function getHabits(userId) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Returns the habit, or null if it doesn't exist / doesn't belong to this user.
export async function getHabit(habitId, userId) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createHabit(userId, { name, description }) {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHabit(habitId, userId, { name, description }) {
  const { data, error } = await supabase
    .from('habits')
    .update({
      name: name.trim(),
      description: description.trim() || null,
    })
    .eq('id', habitId)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  if (data.length === 0) throw notFoundError();
  return data[0];
}

// Logs are deleted automatically by the database (ON DELETE CASCADE).
export async function deleteHabit(habitId, userId) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ---------- Completion logs ----------

// Logs of the given habits for one date (e.g. today).
export async function getLogsForDate(habitIds, date) {
  if (habitIds.length === 0) return [];

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .in('habit_id', habitIds)
    .eq('date', date);

  if (error) throw error;
  return data;
}

// Logs of one habit between two dates (inclusive).
export async function getLogsInRange(habitId, fromDate, toDate) {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', fromDate)
    .lte('date', toDate);

  if (error) throw error;
  return data;
}

// Marks a habit as completed on `date` and returns the log row.
export async function completeHabit(habitId, date) {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({ habit_id: habitId, date })
    .select()
    .single();

  if (!error) return data;

  // 23505 = unique violation: the habit was already completed for this date
  // (e.g. in another tab). That's fine — return the existing log instead.
  if (error.code === '23505') {
    const [existingLog] = await getLogsForDate([habitId], date);
    if (existingLog) return existingLog;
  }

  throw error;
}

export async function undoCompletion(logId) {
  const { error } = await supabase.from('habit_logs').delete().eq('id', logId);

  if (error) throw error;
}
