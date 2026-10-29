
CREATE OR REPLACE FUNCTION add_person(
    v_name VARCHAR(100),
    v_start DATE,
    v_end DATE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF v_name IS NULL OR TRIM(v_name) = '' THEN
        RAISE EXCEPTION 'Name cannot be empty';
    END IF;

    IF v_start IS NULL OR v_end IS NULL OR v_end < v_start THEN
        RAISE EXCEPTION 'Invalid date range';
    END IF;

    INSERT INTO Enlisted_children
        (Name, Start_date, End_date)
    VALUES
        (TRIM(v_name), v_start, v_end);
END;
$$;



CREATE OR REPLACE FUNCTION remove_person(
    v_name VARCHAR(100)
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF v_name IS NULL OR TRIM(v_name) = '' THEN
        RAISE EXCEPTION 'Name cannot be empty';
    END IF;

    DELETE FROM Enlisted_children
    WHERE LOWER(Name) = LOWER(TRIM(v_name));

    IF NOT FOUND THEN
        RETURN 'No person found with that name.';
    END IF;

    RETURN 'Person deleted successfully.';
END;
$$;
