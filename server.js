const express = require("express");
const db = require("./database");
const validateEvent = require("./validators/eventValidator");

const app = express();

const PORT = 3000;

app.use(express.json());
//GET
app.get("/events", (req, res) => {

    const {
        search,
        category,
        location,
        sort
    } = req.query;

    let sql = "SELECT * FROM events WHERE 1=1";
    const params = [];

    // Search title and description
    if (search) {
        sql += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by category
    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }

    // Filter by location
    if (location) {
        sql += " AND location = ?";
        params.push(location);
    }

    // Sorting
    if (sort === "latest") {
        sql += " ORDER BY date DESC, time DESC";
    } else {
        sql += " ORDER BY date ASC, time ASC";
    }

    db.all(sql, params, (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);

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