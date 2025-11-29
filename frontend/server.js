const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// sqlite setup
const db = new sqlite3.Database(path.join(__dirname, "events.db"), (err) => {
  if (err) {
    console.error("Failed to connect to DB", err);
  } else {
    console.log("Connected to SQLite DB");
  }
});

// tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'going',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
  )`);
});

// run db w promise
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// get events w filters
app.get("/events", async (req, res) => {
  try {
    const { status, category, from } = req.query;
    let sql = "SELECT * FROM events WHERE 1=1";
    const params = [];
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (from) {
      sql += " AND date >= ?";
      params.push(from);
    }
    sql += " ORDER BY date ASC";
    const rows = await allAsync(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// create event
app.post("/events", async (req, res) => {
  try {
    const { title, date, description, category } = req.body;
    const result = await runAsync(
      "INSERT INTO events(title, date, description, category, status) VALUES(?,?,?,?, 'pending')",
      [title, date, description, category]
    );
    res.json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// upd event
app.put("/events/:id", async (req, res) => {
  try {
    const { title, date, description, category } = req.body;
    await runAsync(
      "UPDATE events SET title=?, date=?, description=?, category=? WHERE id=?",
      [title, date, description, category, req.params.id]
    );
    res.json({ updated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// delete event
app.delete("/events/:id", async (req, res) => {
  try {
    const result = await runAsync("DELETE FROM events WHERE id=?", [
      req.params.id,
    ]);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// approve/reject events
app.post("/events/:id/approve", async (req, res) => {
  try {
    await runAsync("UPDATE events SET status='approved' WHERE id=?", [
      req.params.id,
    ]);
    res.json({ approved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve event" });
  }
});

app.post("/events/:id/reject", async (req, res) => {
  try {
    await runAsync("UPDATE events SET status='rejected' WHERE id=?", [
      req.params.id,
    ]);
    res.json({ rejected: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject event" });
  }
});

// rsvp for / cancel events
app.post("/events/:id/rsvp", async (req, res) => {
  try {
    const { name } = req.body;
    const eventId = req.params.id;
    const existing = await allAsync(
      "SELECT * FROM rsvps WHERE event_id=? AND name=?",
      [eventId, name]
    );
    if (existing.length > 0) {
      await runAsync(
        "UPDATE rsvps SET status='going' WHERE event_id=? AND name=?",
        [eventId, name]
      );
    } else {
      await runAsync(
        "INSERT INTO rsvps(event_id, name, status) VALUES(?, ?, 'going')",
        [eventId, name]
      );
    }
    res.json({ rsvp: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to RSVP" });
  }
});

app.post("/events/:id/cancel-rsvp", async (req, res) => {
  try {
    const { name } = req.body;
    await runAsync(
      "UPDATE rsvps SET status='cancelled' WHERE event_id=? AND name=?",
      [req.params.id, name]
    );
    res.json({ cancelled: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
});

// get rsvp for events (admin)
app.get("/events/:id/rsvps", async (req, res) => {
  try {
    const rows = await allAsync(
      "SELECT name, status FROM rsvps WHERE event_id=?",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load RSVPs" });
  }
});

// comments
app.post("/events/:id/comments", async (req, res) => {
  try {
    const { name, comment } = req.body;
    await runAsync(
      "INSERT INTO comments(event_id, name, comment) VALUES(?,?,?)",
      [req.params.id, name, comment]
    );
    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save comment" });
  }
});

app.get("/events/:id/comments", async (req, res) => {
  try {
    const rows = await allAsync(
      "SELECT name, comment, created_at FROM comments WHERE event_id=? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load comments" });
  }
});

// rsvp and reminders
app.get("/my-rsvps", async (req, res) => {
  try {
    const { name } = req.query;
    const rows = await allAsync(
      `SELECT e.id, e.title, e.date, e.category
       FROM events e
       JOIN rsvps r ON e.id = r.event_id
       WHERE r.name=? AND r.status='going' AND e.status='approved'
       ORDER BY e.date ASC`,
      [name]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load my RSVPs" });
  }
});

// attendance report (admin)
app.get("/reports/attendance", async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT e.id, e.title, e.date, e.category,
              SUM(CASE WHEN r.status='going' THEN 1 ELSE 0 END) as going_count
       FROM events e
       LEFT JOIN rsvps r ON e.id = r.event_id
       WHERE e.status='approved'
       GROUP BY e.id
       ORDER BY e.date ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// start the server
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
