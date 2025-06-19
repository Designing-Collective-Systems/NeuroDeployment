CREATE SEQUENCE IF NOT EXISTS measures_id_seq;

CREATE TABLE IF NOT EXISTS public.measures
(
    id integer NOT NULL DEFAULT nextval('measures_id_seq'::regclass),
    tap_duration character varying(255) COLLATE pg_catalog."default",
    straight_line_distance numeric NOT NULL,
    total_distance_traveled numeric NOT NULL,
    total_time numeric NOT NULL,
    average_drag_speed numeric NOT NULL,
    last_speed numeric NOT NULL,
    peak_speed character varying(255) COLLATE pg_catalog."default" NOT NULL,
    time_to_peak_speed character varying(255) COLLATE pg_catalog."default" NOT NULL,
    last_acceleration character varying(255) COLLATE pg_catalog."default" NOT NULL,
    average_acceleration character varying(255) COLLATE pg_catalog."default" NOT NULL,
    tap_area_size character varying(255) COLLATE pg_catalog."default" NOT NULL,
    shortest_path_distance character varying(255) COLLATE pg_catalog."default" NOT NULL,
    participant_id integer,
    CONSTRAINT measures_pkey PRIMARY KEY (id),
    CONSTRAINT fk_participant FOREIGN KEY (participant_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.measures
    OWNER to zhanyijun;
