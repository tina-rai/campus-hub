//1082 is PostgreSQL's type ID for date.
//Don't turn PostgreSQL dates into JavaScript Date objects. Just give me the original YYYY-MM-DD string.
const { Pool, types } = require("pg");

types.setTypeParser(1082, value => value);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err);
});

module.exports = pool;