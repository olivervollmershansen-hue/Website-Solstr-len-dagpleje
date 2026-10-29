CREATE TABLE IF NOT EXISTS Enlisted_children (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name VARCHAR(100) UNIQUE NOT NULL,
    Start_date DATE NOT NULL,
    End_date DATE NOT NULL,

    CONSTRAINT valid_date_range
        CHECK (End_date >= Start_date)
);