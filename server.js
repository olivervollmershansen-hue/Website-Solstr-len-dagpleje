
const express = require('express');
const pool = require('./db');

const app = express();
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
    console.error('Availability check failed:', error.message);

    res.status(500).json({
      error: 'Unable to check availability right now.'
    });
  }
});

// Serve your existing HTML, CSS and images.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Website running at http://localhost:${PORT}`);
});
