const { Pool } = require("pg");

const pool = new Pool({
    user: "campus_hub_user",
    host: "localhost",
    database: "campus_hub",
    password: "campus_hub_dev",
    port: 5432
});

pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL");
        client.release();
    })
    .catch(error => {
        console.error("PostgreSQL connection error:", error);
    });

module.exports = pool;