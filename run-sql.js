
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const files = [
  'enlisted_children_table.sql',
  'add_and_remove.sql',
  'automatic_deletion.sql',
  'automatic_availability_checker.sql'
];

async function runSQL() {
  try {
    for (const file of files) {
      const filePath = path.join(__dirname, 'database', file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`Executing ${file}...`);
      await pool.query(sql);
      console.log(`${file} completed successfully.`);
    }
  } catch (error) {
    console.error('SQL execution failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSQL();
