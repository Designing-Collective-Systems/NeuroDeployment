CREATE TABLE test_results
(
    id serial,
    participantid INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blockno integer,
    coordx double precision, 
    coordy double precision, 
    coordt double precision, 
    realpointid text,
    realpointx double precision,
    realpointy double precision,
    fakepointid text,
    fakepointx double precision,
    fakepointy double precision,
    speed double precision,
    pausevalue double precision, 
    correctangle double precision,
    wrongangle double precision,
    err integer,
    errorcorrected integer,
    PRIMARY KEY (id)
);
