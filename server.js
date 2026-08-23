const express = require("express");
const db = require("./postgres");
const validateEvent = require("./validators/eventValidator");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static("public"));
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
app.post("/events/:id/register", async(req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Event ID must be a positive integer"
        });
    }

    const {
        student_name,
        student_email
    } = req.body;

    if (!student_name || !student_email) {
        return res.status(400).json({
            message: "Student name and email are required"
        });
    }

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
app.put("/events/:id", async(req, res) => {

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
app.delete("/events/:id", async(req, res) => {

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
app.post("/events", async(req, res) => {

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
app.get("/events/:id/registrations", async(req, res) => {

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
app.get("/registrations", async(req, res) => {

    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

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
app.delete("/registrations/:id", async(req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Registration ID must be a positive integer"
        });
    }

    try {

        const result = await db.query(
            "DELETE FROM registrations WHERE id = $1 RETURNING *", [id]
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