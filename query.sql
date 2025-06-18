CREATE TABLE IF NOT EXISTS test_results
(
    id serial,
    pid integer,
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



CREATE TABLE IF NOT EXISTS max_speed
(
    id serial,
    pid integer,
    coordx integer,
    coordy integer,
    coordt integer,
    PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS parameters
(
    id serial,
    fixed_or_rand boolean,
    num_blocks integer,
    num_trials integer,
    node_radius integer,
    min_angle integer,
    PRIMARY KEY (id)
);