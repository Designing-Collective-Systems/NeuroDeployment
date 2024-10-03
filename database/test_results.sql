CREATE TABLE IF NOT EXISTS test_results
(
    id SERIAL PRIMARY KEY,
    participantid integer NOT NULL,
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

ALTER TABLE IF EXISTS test_results
    OWNER to postgres;