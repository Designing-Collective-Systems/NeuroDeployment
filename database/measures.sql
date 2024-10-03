CREATE TABLE IF NOT EXISTS measures (
    id SERIAL PRIMARY KEY,  
    tap_duration VARCHAR(255),  
    straight_line_distance NUMERIC NOT NULL,  
    total_distance_traveled VARCHAR(255) NOT NULL, 
    total_time VARCHAR(255) NOT NULL, 
    average_drag_speed VARCHAR(255) NOT NULL,  
    last_speed VARCHAR(255) NOT NULL, 
    peak_speed VARCHAR(255) NOT NULL, 
    time_to_peak_speed VARCHAR(255) NOT NULL, 
    last_acceleration VARCHAR(255) NOT NULL, 
    average_acceleration VARCHAR(255) NOT NULL,  
    tap_area_size VARCHAR(255) NOT NULL,
    shortest_path_distance VARCHAR(255) NOT NULL
);