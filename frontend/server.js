const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const db = new sqlite3.Database(path.join(__dirname, "events.db"));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rsvps(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL
  )`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/api/events", (req, res) => {
  const { category, from, role } = req.query;
  const isStudent = role === "student";
  const params = [];
  let where = [];

  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (from) {
    where.push("date >= ?");
    params.push(from);
  }
  if (isStudent) {
    where.push("status = 'approved'");
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
  const sql = `SELECT * FROM events ${whereClause} ORDER BY date ASC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load events" });
    } else {
      res.json(rows);
    }
  });
});

app.post("/api/events", (req, res) => {
  const { title, date, description, category } = req.body;
  db.run(
    "INSERT INTO events(title,date,description,category) VALUES(?,?,?,?)",
    [title, date, description, category],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create event" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

app.put("/api/events/:id", (req, res) => {
  const { title, date, description, category } = req.body;
  db.run(
    "UPDATE events SET title=?, date=?, description=?, category=? WHERE id=?",
    [title, date, description, category, req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update event" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.delete("/api/events/:id", (req, res) => {
  db.run("DELETE FROM events WHERE id=?", [req.params.id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete event" });
    } else {
      res.json({ success: true });
    }
  });
});

app.post("/api/events/:id/approve", (req, res) => {
  db.run("UPDATE events SET status='approved' WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to approve" });
    res.json({ success: true });
  });
});

app.post("/api/events/:id/reject", (req, res) => {
  db.run("UPDATE events SET status='rejected' WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to reject" });
    res.json({ success: true });
  });
});

app.post("/api/events/:id/rsvp", (req, res) => {
  const { name } = req.body;
  db.run(
    "INSERT INTO rsvps(event_id,name) VALUES(?,?)",
    [req.params.id, name],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to RSVP" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.post("/api/events/:id/cancel-rsvp", (req, res) => {
  const { name } = req.body;
  db.run(
    "DELETE FROM rsvps WHERE event_id=? AND name=?",
    [req.params.id, name],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to cancel RSVP" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Lamar EMS server running on http://localhost:${PORT}`);
});
