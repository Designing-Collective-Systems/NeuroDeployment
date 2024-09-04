CREATE TABLE IF NOT EXISTS public.test_results
(
    id SERIAL PRIMARY KEY,
    patientid integer NOT NULL,
    coordx integer,
    coordy integer,
    coordt integer,
    realpointid text COLLATE pg_catalog."default",
    realpointx double precision,
    realpointy double precision,
    fakepointid text COLLATE pg_catalog."default",
    fakepointx double precision,
    fakepointy double precision
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.test_results
    OWNER to postgres;