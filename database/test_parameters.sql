CREATE TABLE IF NOT EXISTS public.test_parameters
(
    id integer NOT NULL DEFAULT nextval('test_results_id_seq'::regclass),
    fixed_or_rand boolean,
    num_blocks integer,
    num_trials integer,
    node_radius integer,
    min_angle integer,
    CONSTRAINT test_results_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.test_parameters
    OWNER to postgres;