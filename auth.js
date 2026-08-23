const bcrypt = require("bcryptjs");
const pool = require("./postgres");

async function createUser(name, email, password, role = "student") {
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role
        `, [name, email.toLowerCase(), hashedPassword, role]
    );

    return result.rows[0];
}

async function findUserByEmail(email) {
    const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `, [email.toLowerCase()]
    );

    return result.rows[0];
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

module.exports = {
    createUser,
    findUserByEmail,
    verifyPassword
};