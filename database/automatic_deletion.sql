
CREATE OR REPLACE FUNCTION delete_expired_people()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM Enlisted_children
    WHERE End_date < CURRENT_DATE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;
