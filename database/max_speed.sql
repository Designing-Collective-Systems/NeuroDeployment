CREATE TABLE IF NOT EXISTS public.max_speed
(
    id integer NOT NULL DEFAULT nextval('test_results_id_seq'::regclass),
    participantid integer,
    coordx integer,
    coordy integer,
    coordt integer,
    CONSTRAINT test_results_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.max_speed
    OWNER to postgres;