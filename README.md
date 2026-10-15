# Habit Tracker

A minimal habit tracker built with **React (JavaScript) + Vite + vanilla CSS + Supabase**.

Register, log in, create daily habits, check them off for today, undo, edit, delete,
and view the last 30 days of history.

## 1. Requirements

- Node.js 20.19+ or 22.12+ (needed by Vite 8)
- A Supabase project that already has the `users`, `habits` and `habit_logs` tables,
  the user-creation trigger and the RLS policies. This app does **not** create or change any tables.

## 2. Installation

```bash
cd habit-tracker
npm install
```

## 3. Connect to Supabase

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. In the Supabase Dashboard, open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
3. Never put the `service_role` / secret key in `.env`. Everything starting with `VITE_` ends up in the browser.
4. Under **Authentication → URL Configuration**, set the **Site URL** to `http://localhost:5173`
   (and later your production URL) so email confirmation links come back to the app.
5. Optional: under **Authentication → Providers → Email**, choose whether "Confirm email" is on.
   - On: after registering, the app asks the user to verify their email, then log in.
   - Off: the user is logged in right after registering.

Restart the dev server after changing `.env`.

## 4. Local development

```bash
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

When deploying the `dist/` folder, configure your host to serve `index.html` for all routes
(SPA fallback) so links like `/habits/123` work after a page refresh.

## 5. Project structure

```text
src/
├── components/   HabitItem, HabitForm, HabitList, ProtectedRoute (+ PublicRoute, PageLoader)
├── pages/        LoginPage, RegisterPage, DashboardPage, HabitDetailPage
├── context/      AuthContext: session, user, signIn/signUp/signOut
├── lib/          supabase.js (client), date.js (local dates), errors.js (friendly messages)
├── services/     habits.js: all database queries
└── styles/       global.css, auth.css, habits.css
```

Notes:
- Dates are always the user's **local** calendar date (`YYYY-MM-DD`), built from
  `getFullYear/getMonth/getDate`. `toISOString()` is never used for this, because it's in UTC.
- A habit is "completed today" when a `habit_logs` row exists for today. Checking the box inserts a row
  and unchecking deletes it. A duplicate insert (Postgres `23505`) is treated as success.
- The app never inserts into `public.users`. The database trigger does that.

## 6. Testing checklist

Auth
- [ ] Register with a new email (password under 8 characters is rejected).
- [ ] With email confirmation on, a "Check your email" message appears.
- [ ] Registering the same email again shows "account already exists".
- [ ] Wrong password shows "Incorrect email or password."
- [ ] Log in, refresh the page, and you're still logged in.
- [ ] Visiting `/login` while logged in redirects to `/`.
- [ ] Logout returns to `/login`, and visiting `/` afterwards redirects to `/login`.

Habits
- [ ] Empty state is shown when there are no habits.
- [ ] Whitespace-only name, name > 100 chars, description > 500 chars are rejected with messages.
- [ ] Create, edit (name + description) and delete (after confirmation) a habit.
- [ ] Check a habit off, and the counter ("1 of 3 habits completed") updates. Refresh, and it's still checked.
- [ ] Uncheck it, and the counter goes down.
- [ ] Check the same habit in two tabs. No error and no duplicate row (`UNIQUE(habit_id, date)`).
- [ ] Turn off the network and toggle. A friendly error appears and the checkbox goes back to its previous state.

History
- [ ] "History" opens `/habits/:id` with a 30-day grid, and today's completion is highlighted.
- [ ] A random or unknown id shows "Habit not found".

Security
- [ ] Log in as user B, open user A's `/habits/<id>`, and you see "Habit not found" (RLS + `user_id` filter).
- [ ] User B's dashboard shows none of user A's habits.

Responsive
- [ ] At ~375px wide there's no horizontal scrolling, and actions wrap under the habit name.
