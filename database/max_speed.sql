CREATE SEQUENCE IF NOT EXISTS max_speed_id_seq;

CREATE TABLE IF NOT EXISTS public.max_speed
(
    id integer NOT NULL DEFAULT nextval('max_speed_id_seq'::regclass),
    participantid integer,
    coordx integer,
    coordy integer,
    coordt integer,
    CONSTRAINT max_speed_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.max_speed
    OWNER to postgres;