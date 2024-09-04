CREATE TABLE test_results
(
    id serial,
    patientid integer,
    blockno integer,
    coordx integer,
    coordy integer,
    coordt integer,
    realpointid text,
    realpointx double precision,
    realpointy double precision,
    fakepointid text,
    fakepointx double precision,
    fakepointy double precision,
    speed double precision,
    pausevalue integer,
    correctangle double precision,
    wrongangle double precision,
    err integer,
    errorcorrected integer,
    PRIMARY KEY (id)
);