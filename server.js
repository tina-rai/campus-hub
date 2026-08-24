require("dotenv").config();
console.log(
    "SESSION_SECRET:",
    process.env.SESSION_SECRET ? "LOADED" : "MISSING"
);
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const {
    createUser,
    findUserByEmail,
    verifyPassword
} = require("./auth");


const express = require("express");
const db = require("./postgres");
const validateEvent = require("./validators/eventValidator");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(
    session({
        store: new pgSession({
            pool: db,
            tableName: "user_sessions"
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);
app.use(express.static("public"));
// =========================
// AUTHENTICATION
// =========================

app.post("/api/auth/signup", async(req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const user = await createUser(name, email, password);

        req.session.user = user;

        res.status(201).json({
            message: "Account created successfully.",
            user
        });
    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            message: "Unable to create account."
        });
    }
});


app.post("/api/auth/login", async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordValid = await verifyPassword(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            message: "Login successful.",
            user: req.session.user
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Unable to login."
        });
    }
});


app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                message: "Unable to logout."
            });
        }

        res.json({
            message: "Logged out successfully."
        });
    });
});


app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Not authenticated."
        });
    }

    res.json({
        user: req.session.user
    });
});

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    next();
}


function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required."
        });
    }

    next();
} // =========================
// ADMIN USER MANAGEMENT
// =========================

// Get all users
app.get("/api/admin/users", requireAdmin, async(req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, role
            FROM users
            ORDER BY id ASC
        `);

        res.json({
            users: result.rows
        });

    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            message: "Unable to load users."
        });
    }
});


// Change a user's role
app.patch("/api/admin/users/:id/role", requireAdmin, async(req, res) => {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    if (role !== "student" && role !== "admin") {
        return res.status(400).json({
            message: "Role must be either student or admin."
        });
    }

    // Prevent an admin from changing their own role.
    if (userId === req.session.user.id) {
        return res.status(400).json({
            message: "You cannot change your own role."
        });
    }

    try {
        // Check that the target user exists.
        const userResult = await db.query(
            `
            SELECT id, name, email, role
            FROM users
            WHERE id = $1
            `, [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const targetUser = userResult.rows[0];

        // Nothing to change.
        if (targetUser.role === role) {
            return res.json({
                message: `User is already a ${role}.`,
                user: targetUser
            });
        }

        // Prevent removing the last administrator.
        if (
            targetUser.role === "admin" &&
            role === "student"
        ) {
            const adminCountResult = await db.query(`
                SELECT COUNT(*)::int AS count
                FROM users
                WHERE role = 'admin'
            `);

            const adminCount =
                adminCountResult.rows[0].count;

            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot remove the last administrator."
                });
            }
        }

        const result = await db.query(
            `
            UPDATE users
            SET role = $1
            WHERE id = $2
            RETURNING id, name, email, role
            `, [role, userId]
        );

        res.json({
            message: `User role changed to ${role}.`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Change user role error:", error);

        res.status(500).json({
            message: "Unable to change user role."
        });
    }
});
//GET
app.get("/events", async(req, res) => {

    const {
        search,
        category,
        location,
        sort,
        page = 1,
        limit = 5
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (!Number.isInteger(pageNumber) ||
        !Number.isInteger(limitNumber) ||
        pageNumber <= 0 ||
        limitNumber <= 0
    ) {
        return res.status(400).json({
            message: "Page and limit must be positive integers"
        });
    }

    const offset = (pageNumber - 1) * limitNumber;

    let sql = "SELECT * FROM events WHERE 1=1";
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        params.push(`%${search}%`);

        sql += ` AND (title ILIKE $${params.length - 1} OR description ILIKE $${params.length})`;
    }

    if (category) {
        params.push(category);

        sql += ` AND category = $${params.length}`;
    }

    if (location) {
        params.push(location);

        sql += ` AND location = $${params.length}`;
    }

    if (sort === "latest") {
        sql += " ORDER BY date DESC, time DESC";
    } else {
        sql += " ORDER BY date ASC, time ASC";
    }

    params.push(limitNumber);
    sql += ` LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    try {

        const result = await db.query(sql, params);

        res.json({
            page: pageNumber,
            limit: limitNumber,
            results: result.rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Get one event
app.get("/events/:id", async(req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    try {

        const eventResult = await db.query(
            "SELECT * FROM events WHERE id = $1", [id]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        const registrationResult = await db.query(
            `SELECT COUNT(*) AS registered
             FROM registrations
             WHERE event_id = $1`, [id]
        );

        const registered =
            Number(registrationResult.rows[0].registered);

        const remaining =
            event.capacity - registered;

        res.json({
            ...event,
            registered,
            remaining
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Register for an event
app.post("/events/:id/register", requireAuth, async(req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    const student_name = req.session.user.name;
    const student_email = req.session.user.email;

    try {

        // Check whether the event exists
        const eventResult = await db.query(
            "SELECT * FROM events WHERE id = $1", [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        // Check current registration count
        const countResult = await db.query(
            `SELECT COUNT(*) AS registered
             FROM registrations
             WHERE event_id = $1`, [eventId]
        );

        const registered =
            Number(countResult.rows[0].registered);

        if (registered >= event.capacity) {
            return res.status(400).json({
                message: "Event is full"
            });
        }

        // Create registration
        const registrationResult = await db.query(
            `INSERT INTO registrations
             (event_id, student_name, student_email)
             VALUES ($1, $2, $3)
             RETURNING *`, [
                eventId,
                student_name,
                student_email
            ]
        );

        res.status(201).json({
            message: "Registration successful",
            registration: registrationResult.rows[0]
        });

    } catch (err) {

        // PostgreSQL unique constraint
        if (err.code === "23505") {
            return res.status(400).json({
                message: "You are already registered for this event"
            });
        }

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Update an event
app.put("/events/:id", requireAdmin, async(req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    const {
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    } = req.body;

    if (!title ||
        !description ||
        !category ||
        !location ||
        !date ||
        !time ||
        !capacity
    ) {
        return res.status(400).json({
            message: "All event fields are required"
        });
    }

    try {

        const result = await db.query(
            `UPDATE events
             SET title = $1,
                 description = $2,
                 category = $3,
                 location = $4,
                 date = $5,
                 time = $6,
                 capacity = $7
             WHERE id = $8
             RETURNING *`, [
                title,
                description,
                category,
                location,
                date,
                time,
                capacity,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Delete an event
app.delete("/events/:id", requireAdmin, async(req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    try {

        const result = await db.query(
            "DELETE FROM events WHERE id = $1 RETURNING *", [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            message: "Event deleted successfully",
            event: result.rows[0]
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Create a new event
app.post("/events", requireAdmin, async(req, res) => {

    const {
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    } = req.body;

    if (!title ||
        !description ||
        !category ||
        !location ||
        !date ||
        !time ||
        !capacity
    ) {
        return res.status(400).json({
            message: "All event fields are required"
        });
    }

    try {

        const result = await db.query(
            `INSERT INTO events
            (title, description, category, location, date, time, capacity)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`, [
                title,
                description,
                category,
                location,
                date,
                time,
                capacity
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Get registrations for an event
app.get("/events/:id/registrations", requireAdmin, async(req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    try {

        // Check that the event exists
        const eventResult = await db.query(
            "SELECT id, title FROM events WHERE id = $1", [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        // Get registrations
        const registrationResult = await db.query(
            `SELECT
                id,
                student_name,
                student_email,
                registered_at
             FROM registrations
             WHERE event_id = $1
             ORDER BY registered_at ASC`, [eventId]
        );

        res.json({
            event: event,
            count: registrationResult.rows.length,
            registrations: registrationResult.rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Get registrations by student email
app.get("/registrations", requireAuth, async(req, res) => {

    const email = req.session.user.email;

    try {

        const result = await db.query(
            `SELECT
                registrations.id AS registration_id,
                registrations.student_name,
                registrations.student_email,
                registrations.registered_at,
                events.id AS event_id,
                events.title,
                events.description,
                events.category,
                events.location,
                events.date,
                events.time
             FROM registrations
             JOIN events
                ON registrations.event_id = events.id
             WHERE registrations.student_email = $1
             ORDER BY events.date ASC, events.time ASC`, [email]
        );

        res.json({
            count: result.rows.length,
            registrations: result.rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
// Cancel a registration
app.delete("/registrations/:id", requireAuth, async(req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Registration ID must be a positive integer"
        });
    }

    try {

        const result = await db.query(
            `DELETE FROM registrations
             WHERE id = $1 AND student_email = $2
             RETURNING *`, [id, req.session.user.email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        res.json({
            message: "Registration cancelled successfully",
            registration: result.rows[0]
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});
app.listen(PORT, () => {
    console.log(`CampusHub server running at http://localhost:${PORT}`);
});