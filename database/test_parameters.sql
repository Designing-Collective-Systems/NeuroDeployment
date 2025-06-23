CREATE SEQUENCE IF NOT EXISTS test_parameters_id_seq;

CREATE TABLE IF NOT EXISTS public.test_parameters
(
    id integer NOT NULL DEFAULT nextval('test_parameters_id_seq'::regclass),
    fixed_or_rand boolean,
    num_blocks integer,
    num_trials integer,
    node_radius integer,
    min_angle integer,
    CONSTRAINT test_parameters_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.test_parameters
    OWNER to postgres;