// Turns Supabase / network errors into short, friendly messages.
// Raw database messages are never shown in the UI.

function isNetworkError(error) {
  const message = error?.message || '';
  return (
    error?.name === 'AuthRetryableFetchError' ||
    /failed to fetch|networkerror|network request failed|load failed/i.test(message)
  );
}

export function getErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  if (isNetworkError(error)) {
    return 'Network error. Check your internet connection and try again.';
  }

  switch (error.code) {
    case 'NOT_FOUND':
    case 'PGRST116': // no rows returned for .single()
      return 'This habit no longer exists.';
    case '23505': // unique_violation
      return 'This habit is already completed for today.';
    case '23503': // foreign_key_violation
      return 'This habit no longer exists.';
    case '23502': // not_null_violation
    case '23514': // check_violation
    case '22001': // value too long
      return 'Some of the values are invalid. Please check the form and try again.';
    case '42501': // insufficient_privilege (RLS)
      return "You don't have permission to do that.";
    case 'PGRST301': // JWT expired / invalid
    case 'PGRST302':
      return 'Your session has expired. Please log in again.';
    default:
      break;
  }

  if (error.status === 401 || error.status === 403) {
    return 'Your session has expired. Please log in again.';
  }

  return 'Something went wrong. Please try again.';
}

export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  if (isNetworkError(error)) {
    return 'Network error. Check your internet connection and try again.';
  }

  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try logging in instead.';
    case 'weak_password':
      return 'This password is too weak. Please choose a stronger one.';
    case 'email_address_invalid':
      return 'Please enter a valid email address.';
    case 'signup_disabled':
      return 'New registrations are currently disabled.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      break;
  }

  // Older Supabase versions may not send an error code.
  const message = error.message || '';
  if (error.status === 429 || /rate limit/i.test(message)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
  }
  if (/already registered/i.test(message)) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  return 'Something went wrong. Please try again.';
}
