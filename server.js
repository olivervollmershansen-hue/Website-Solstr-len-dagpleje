
const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

// Gør det muligt at modtage JSON
app.use(express.json());

// Test om serveren virker
app.get("/api/test", (req, res) => {
    res.json({ message: "Serveren virker!" });
});


app.get("/api/database-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Forbindelsen til Neon virker!",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Databasefejl:", error.message);

        res.status(500).json({
            error: "Kunne ikke forbinde til databasen"
        });
    }
});

// Start serveren
app.listen(PORT, () => {
    console.log(`Serveren kører på http://localhost:${PORT}`);
});
