CREATE TABLE IF NOT EXISTS public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL,
    PRIMARY KEY (sid)
);
