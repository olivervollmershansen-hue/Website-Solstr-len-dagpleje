
CREATE OR REPLACE FUNCTION is_date_available(
    p_date DATE
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*) < 3
    FROM Enlisted_children
    WHERE Start_date <= p_date
      AND End_date >= p_date;
$$;
