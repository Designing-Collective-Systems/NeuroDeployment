# Crossroads finger tasks

TMT-style touch tasks with a database, fixed target locations and an admin panel.

## Participant flow (`/`)

1. Welcome page (one-sentence description) → **Okay, tell me more!**
2. Overview: which tasks, in what order, and how many rounds of each
3. For each task: a looping demonstration plus the instructions, then the rounds
   - **Task 1 – Crossroads-A** (numbers only, 1 → 2 → 3 …), default 3 rounds
   - **Task 2 – Crossroads-B** (1 → A → 2 → B …), default 8 rounds
   - **Task 3 – Swiping**, 10 s; lifting the finger pauses the timer and shows a prompt, with no pop-up
4. "Completed task n/N" between tasks, then the thank-you page

A and B use the same node positions; only the labels differ. In both tasks the distractor is the label that comes after the correct one.
By default the dots are drawn in the bottom 60% of the screen. The original layout is scaled by the same factor on both axes, so relative distances and angles are unchanged.

Colours mean the same thing everywhere: **blue** = button to continue, **red** = error, **amber** = warning (swiping), **green** = confirmation.

## Admin panel (`/admin`)

- Turn tasks on/off; set rounds, moves per round, swipe duration, layout, dot size, demo and prompts
- Move the dots: drag them on a device preview or type their pixel coordinates. Positions are saved relative to the screen size, so they adapt to other devices and to the task-area setting. A and B always share them.
- Per participant: summary (mean A/B time, B − A, B ÷ A, errors, lifts, swipe speed), plots, the finger path for every round, and a table of rounds
- CSV export (all participants or one); delete a participant's data
- "Start a session" builds a link such as `/?pid=12` to run a specific participant ID. Without one, the next free ID is assigned.

## Running

```
npm install
DATABASE_URL=postgres://... ADMIN_PASSWORD=choose-one SESSION_SECRET=long-random-string npm start
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (default `postgresql://postgres:1234@localhost:5432/cognition`) |
| `ADMIN_PASSWORD` | Admin login. If unset, a temporary password is printed to the log at start-up. |
| `SESSION_SECRET` | Signs admin login cookies. If unset, logins reset when the server restarts. |
| `DATABASE_NO_SSL` | Set to disable SSL when using `DATABASE_URL` against a local database |

On Heroku: `heroku config:set ADMIN_PASSWORD=... SESSION_SECRET=...`.

The tables are created and migrated automatically (see `query.sql`). Older rows are kept and count as Crossroads-B.
For the analysis notebook, filter `test_results` on `task == 'tmt_b'` (or `'tmt_a'`) before grouping by `pid`/`blockno`.
