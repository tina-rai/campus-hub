const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./campus.db", (err) => {

    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to SQLite database");

});

db.run(`
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        capacity INTEGER NOT NULL
    )
`, (err) => {

    if (err) {
        console.error("Failed to create events table:", err.message);
        return;
    }

    console.log("Events table ready");

});

module.exports = db;