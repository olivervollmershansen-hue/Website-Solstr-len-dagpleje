
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('./db');

function isValidDateRange(startDate, endDate) {
  return endDate >= startDate;
}

test('Accepts an end date after the start date', () => {
  assert.equal(
    isValidDateRange(new Date('2027-01-10'), new Date('2027-01-20')),
    true
  );
});

test('Accepts the same start and end date', () => {
  assert.equal(
    isValidDateRange(new Date('2027-01-10'), new Date('2027-01-10')),
    true
  );
});

test('Rejects an end date before the start date', () => {
  assert.equal(
    isValidDateRange(new Date('2027-01-20'), new Date('2027-01-10')),
    false
  );
});
//Test af logikken
// Test af databasen




// Unikke navne, så testene ikke rammer almindelige tilmeldinger.
const testPrefix = `TEST_${Date.now()}_${process.pid}`;

function testName(number) {
  return `${testPrefix}_${number}`;
}

// Hver test kører i sin egen transaktion.
// ROLLBACK sørger for, at testens ændringer ikke gemmes.
async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await callback(client);
  } finally {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}

// Forventede SQL-fejl afbryder normalt transaktionen.
// SAVEPOINT gør det muligt at fortsætte testen bagefter.
async function expectDatabaseError(client, query, values, pattern) {
  await client.query('SAVEPOINT expected_error');

  let error;

  try {
    await client.query(query, values);
  } catch (err) {
    error = err;
  }

  await client.query('ROLLBACK TO SAVEPOINT expected_error');
  await client.query('RELEASE SAVEPOINT expected_error');

  assert.ok(error, 'Der blev forventet en databasefejl.');
  assert.match(error.message, pattern);
}

// 1. Tilføj et barn med gyldige datoer.
test('add_person tilføjer et barn', async () => {
  await withTransaction(async (client) => {
    const name = testName(1);

    await client.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-01-10', '2027-01-20']
    );

    const result = await client.query(
      `SELECT
         name,
         TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date
       FROM enlisted_children
       WHERE name = $1`,
      [name]
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].name, name);
    assert.equal(result.rows[0].start_date, '2027-01-10');
    assert.equal(result.rows[0].end_date, '2027-01-20');
  });
});

// 2. Startdato og slutdato må gerne være ens.
test('add_person accepterer samme start- og slutdato', async () => {
  await withTransaction(async (client) => {
    const name = testName(2);

    await client.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-02-10', '2027-02-10']
    );

    const result = await client.query(
      'SELECT name FROM enlisted_children WHERE name = $1',
      [name]
    );

    assert.equal(result.rows.length, 1);
  });
});

// 3. Tomt navn skal afvises.
test('add_person afviser tomt navn', async () => {
  await withTransaction(async (client) => {
    await expectDatabaseError(
      client,
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      ['   ', '2027-01-10', '2027-01-20'],
      /Name cannot be empty/
    );
  });
});

// 4. NULL som navn skal afvises.
test('add_person afviser NULL som navn', async () => {
  await withTransaction(async (client) => {
    await expectDatabaseError(
      client,
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [null, '2027-01-10', '2027-01-20'],
      /Name cannot be empty/
    );
  });
});

// 5. Slutdato før startdato skal afvises.
test('add_person afviser ugyldigt datointerval', async () => {
  await withTransaction(async (client) => {
    await expectDatabaseError(
      client,
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [testName(5), '2027-01-20', '2027-01-10'],
      /Invalid date range/
    );
  });
});

// 6. Manglende dato skal afvises.
test('add_person afviser manglende dato', async () => {
  await withTransaction(async (client) => {
    await expectDatabaseError(
      client,
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [testName(6), null, '2027-01-20'],
      /Invalid date range/
    );
  });
});

// 7. Dubletter skal afvises af tabellens UNIQUE-regel.
test('add_person afviser samme navn to gange', async () => {
  await withTransaction(async (client) => {
    const name = testName(7);

    await client.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-01-10', '2027-01-20']
    );

    await expectDatabaseError(
      client,
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-02-10', '2027-02-20'],
      /duplicate key|unique constraint/i
    );
  });
});

// 8. Et eksisterende barn skal kunne slettes.
test('remove_person sletter et eksisterende barn', async () => {
  await withTransaction(async (client) => {
    const name = testName(8);

    await client.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-01-10', '2027-01-20']
    );

    const result = await client.query(
      'SELECT remove_person($1::varchar) AS message',
      [name]
    );

    assert.equal(
      result.rows[0].message,
      'Person deleted successfully.'
    );

    const remaining = await client.query(
      'SELECT name FROM enlisted_children WHERE name = $1',
      [name]
    );

    assert.equal(remaining.rows.length, 0);
  });
});

// 9. Sletning skal ignorere forskelle på store og små bogstaver.
test('remove_person finder navn uden hensyn til store/små bogstaver', async () => {
  await withTransaction(async (client) => {
    const name = testName(9);

    await client.query(
      'SELECT add_person($1::varchar, $2::date, $3::date)',
      [name, '2027-01-10', '2027-01-20']
    );

    const result = await client.query(
      'SELECT remove_person($1::varchar) AS message',
      [name.toLowerCase()]
    );

    assert.equal(
      result.rows[0].message,
      'Person deleted successfully.'
    );
  });
});

// 10. Et navn, der ikke findes, skal give den rigtige besked.
test('remove_person håndterer ukendt navn', async () => {
  await withTransaction(async (client) => {
    const result = await client.query(
      'SELECT remove_person($1::varchar) AS message',
      [testName(10)]
    );

    assert.equal(
      result.rows[0].message,
      'No person found with that name.'
    );
  });
});

// 11. Tomt navn skal afvises ved sletning.
test('remove_person afviser tomt navn', async () => {
  await withTransaction(async (client) => {
    await expectDatabaseError(
      client,
      'SELECT remove_person($1::varchar)',
      ['   '],
      /Name cannot be empty/
    );
  });
});

// Luk forbindelsespuljen, når alle tests er færdige.
after(async () => {
  await pool.end();
});
