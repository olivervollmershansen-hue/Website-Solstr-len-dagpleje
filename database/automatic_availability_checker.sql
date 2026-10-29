
CREATE OR REPLACE FUNCTION check_end_dates(
    v_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Enlisted_children
        WHERE End_date < v_date
    ) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END;
$$;

## Returnerer 1 hvis der er plads, og 0 hvis der ikke er plads