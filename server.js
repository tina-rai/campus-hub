const express = require("express");
const db = require("./database");
const validateEvent = require("./validators/eventValidator");

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));
//GET
app.get("/events", (req, res) => {

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
        sql += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }

    if (location) {
        sql += " AND location = ?";
        params.push(location);
    }

    if (sort === "latest") {
        sql += " ORDER BY date DESC, time DESC";
    } else {
        sql += " ORDER BY date ASC, time ASC";
    }

    sql += " LIMIT ? OFFSET ?";
    params.push(limitNumber, offset);

    db.all(sql, params, (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            page: pageNumber,
            limit: limitNumber,
            results: rows
        });

    });

});
// Get one event
app.get("/events/:id", (req, res) => {

    const id = Number(req.params.id);

    db.get(
        "SELECT * FROM events WHERE id = ?", [id],
        (err, row) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!row) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            res.json(row);

        }
    );

});
// Register for an event
app.post("/events/:id/register", (req, res) => {

    const eventId = Number(req.params.id);

    const {
        student_name,
        student_email
    } = req.body;

    if (!student_name || !student_email) {
        return res.status(400).json({
            message: "Student name and email are required"
        });
    }

    // Check whether the event exists
    db.get(
        "SELECT * FROM events WHERE id = ?", [eventId],
        (err, event) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!event) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            // Check current registration count
            db.get(
                "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?", [eventId],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (result.count >= event.capacity) {
                        return res.status(400).json({
                            message: "Event is full"
                        });
                    }

                    // Save registration
                    db.run(
                        `INSERT INTO registrations
                        (event_id, student_name, student_email)
                        VALUES (?, ?, ?)`, [eventId, student_name, student_email],
                        function(err) {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            res.status(201).json({
                                message: "Registration successful",
                                registration: {
                                    id: this.lastID,
                                    event_id: eventId,
                                    student_name,
                                    student_email
                                }
                            });

                        }
                    );

                }
            );

        }
    );

});
// Update an event
app.put("/events/:id", (req, res) => {

    const id = Number(req.params.id);

    const {
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    } = req.body;

    const validationError = validateEvent(req.body);

    if (validationError) {
        return res.status(400).json({
            error: "Validation failed",
            message: validationError
        });
    }

    const sql = `
        UPDATE events
        SET
            title = ?,
            description = ?,
            category = ?,
            location = ?,
            date = ?,
            time = ?,
            capacity = ?
        WHERE id = ?
    `;

    const values = [
        title,
        description,
        category,
        location,
        date,
        time,
        capacity,
        id
    ];

    db.run(sql, values, function(err) {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            id,
            title,
            description,
            category,
            location,
            date,
            time,
            capacity
        });

    });

});
// Delete an event
app.delete("/events/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM events WHERE id = ?", [id],
        function(err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            res.json({
                message: "Event deleted successfully"
            });

        }
    );

});
// Create a new event
app.post("/events", (req, res) => {

    const {
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    } = req.body;

    const validationError = validateEvent(req.body);

    if (validationError) {
        return res.status(400).json({
            error: "Validation failed",
            message: validationError
        });
    }

    const sql = `
        INSERT INTO events
        (title, description, category, location, date, time, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    ];

    db.run(sql, values, function(err) {

        if (err) {

            return res.status(500).json({
                error: err.message
            });

        }

        res.status(201).json({
            id: this.lastID,
            title,
            description,
            category,
            location,
            date,
            time,
            capacity
        });

    });

});

app.listen(PORT, () => {

    console.log(
        `CampusHub server running at http://localhost:${PORT}`
    );

});