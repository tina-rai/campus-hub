require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL");
        client.release();
    })
    .catch(error => {
        console.error(
            "PostgreSQL connection error:",
            error.message
        );
    });

module.exports = pool;