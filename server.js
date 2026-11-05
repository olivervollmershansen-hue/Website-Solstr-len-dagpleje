
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get('/api/availability', async (req, res) => {
  const { date } = req.query;

  // Validate the submitted date.
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return res.status(400).json({
      error: 'Please provide a valid date.'
    });
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({
      error: 'Please provide a valid date.'
    });
  }

  try {
    const result = await pool.query(
      'SELECT is_date_available($1::date) AS available',
      [date]
    );

    res.json({
      date,
      available: result.rows[0].available
    });
  } catch (error) {
    console.error('Availability check failed:', error);

    res.status(500).json({
      error: 'Unable to check availability right now.'
    });
  }
});
// Hent alle indskrevne børn fra Neon
app.get("/api/children", async (req, res) => {
  try {
    const result = await pool.query(
        "SELECT id, name, start_date, end_date FROM enlisted_children ORDER BY start_date"
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Could not fetch children:", error);
    res.status(500).json({
      error: "Could not fetch children"
    });
  }
});


 // TILFØJ ET BARN TIL DATABASEN
app.post('/api/children', async (req, res) => {
  const { name, startDate, endDate } = req.body;

  // Tjekker at brugeren har udfyldt navn og begge datoer.
   if(
    typeof name !== 'string' ||
    !name.trim() ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string'
  ) {
    return res.status(400).json({
      error: 'Navn, startdato og slutdato skal udfyldes.'
    });
  }

  // Kontroller datoformat
  const validDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  };

  if (!validDate(startDate) || !validDate(endDate)) {
    return res.status(400).json({
      error: 'Datoerne er ugyldige.'
    });
  }

  if (endDate < startDate) {
    return res.status(400).json({
      error: 'Slutdato skal være efter startdato.'
    });
  }

  try {
    await pool.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name.trim(), startDate, endDate]
    );

    res.status(201).json({
      message: 'Barnet blev tilføjet.'
    });

  } catch (error) {
    console.error('Could not add child:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Et barn med dette navn findes allerede.'
      });
    }

    res.status(500).json({
      error: 'Kunne ikke tilføje barnet.'
    });
  }
});


// FJERN ET BARN FRA DATABASEN
app.delete('/api/children/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Ugyldigt barn-ID.'
    });
  }

  try {
    const result = await pool.query(
      'SELECT name FROM enlisted_children WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Barnet blev ikke fundet.'
      });
    }

    const name = result.rows[0].name;

    const deleteResult = await pool.query(
      'SELECT remove_person($1::varchar) AS message',
      [name]
    );

    res.json({
      message: deleteResult.rows[0].message
    });

  } catch (error) {
    console.error('Could not remove child:', error);

    res.status(500).json({
      error: 'Kunne ikke fjerne barnet.'
    });
  }
});


// Serve your existing HTML, CSS and images.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Website running at http://localhost:${PORT}`);
});
