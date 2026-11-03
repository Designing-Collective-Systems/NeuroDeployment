-- Reference schema. app.js creates/updates all of this automatically on start-up
-- (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), so existing data is kept.

CREATE TABLE test_results
(
    id serial,
    pid integer,
    blockno integer,          -- round number within the task, 1-based
    coordx integer,           -- -1 = finger lifted, -2 = wrong (distractor) dot touched
    coordy integer,
    coordt integer,           -- ms since first touch on dot 1 in this round
    realpointid text,         -- label of the correct next dot
    realpointx double precision, -- TOP-LEFT of the correct dot (centre = x + node_radius)
    realpointy double precision,
    fakepointid text,         -- label of the distractor dot
    fakepointx double precision,
    fakepointy double precision,
    speed double precision,
    pausevalue integer,
    correctangle double precision,
    wrongangle double precision,
    err integer,
    errorcorrected integer,
    task text DEFAULT 'tmt_b', -- 'tmt_a' (Crossroads-A) or 'tmt_b' (Crossroads-B); older rows are B
    session_id text,
    screen_w integer,
    screen_h integer,
    node_radius double precision,
    created_at timestamptz,
    hand text,                -- 'left' (layout was mirrored), 'right', or null if not asked
    PRIMARY KEY (id)
);

CREATE TABLE max_speed
(
    id serial,
    pid integer,
    coordx integer,           -- -1 = finger lifted
    coordy integer,
    coordt integer,
    session_id text,
    screen_w integer,
    screen_h integer,
    created_at timestamptz,
    hand text,
    PRIMARY KEY (id)
);

CREATE TABLE sessions
(
    id text PRIMARY KEY,
    pid integer NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    config jsonb,             -- task settings in effect for this session
    user_agent text,
    screen_w integer,
    screen_h integer,
    hand text                 -- 'left' | 'right' | null
);

CREATE TABLE submissions      -- de-duplicates retried uploads
(
    id text PRIMARY KEY,
    session_id text,
    kind text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_settings     -- admin-editable task settings
(
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
