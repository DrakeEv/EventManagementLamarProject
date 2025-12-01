//required dependencies used to run the backend server
const express = require("express"); // handles the routing, requests, responces, etc. 
const sqlite3 = require("sqlite3").verbose(); // helps connect to local .db files (where events are stored) with verbose added to help debugging
const path = require("path"); // to find files in any operating system, makes sure that nothing breaks between filepaths

//create the express server set up
const app = express();
const PORT = 3000; //port we will use to host local server (standard port)

//middleware for JSON files as well as API calls, necessary for POST requests
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); //static frontend for HTML, CSS, and JS. allows us to open everything in any browser as long as the server is running

//database connection using sqlite, creates files if they arent already existing (again, where events are stored. it creates a file to do so)
const db = new sqlite3.Database(path.join(__dirname, "events.db"));

db.serialize(() => { //allows everything to run in order
  //creating tables (if they dont exist, stores event information as well as rejection/acception information)
  db.run(`CREATE TABLE IF NOT EXISTS events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  )`);
//RSVP table creation (if doesnt exist as well) tracks users who signed up for events then links them back to the table
  db.run(`CREATE TABLE IF NOT EXISTS rsvps(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL
  )`);
});

//api endpoints and routes - user will be sent to the page when they go to the url
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html")); //loads the lamar ems page when someone enters the url
});

//student role limitations - forces student conditions if user chose student role
app.get("/api/events", (req, res) => { //essentially turns on a safety mode for the student role for approved events
  const { category, from, role } = req.query; //tells the system what role is active
  const isStudent = role === "student";
  const params = []; //query parameters pushed into array
  let where = []; //where conditions
//catagory filter - when catagories are applied its added to the SQL query
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
//date filter - when dates are applied user will only see events from those dates
  if (from) {
    where.push("date >= ?");
    params.push(from);
  }
//only allows students to see events that have been approved by admin
  if (isStudent) {
    where.push("status = 'approved'");
  }
//if filters exist on events this shows the event info, otherwise stays blank
  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
  const sql = `SELECT * FROM events ${whereClause} ORDER BY date ASC`;
//sql cmd to sort events by date, newest, or upcoming events in order
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load events" });
    } else {
      res.json(rows); //filtered/approved events list .json
    }
  });
});
//lets organizers or admins create new events once an event is submitted 
//pulls event info into frontend and inserts into the database
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
        res.json({ id: this.lastID }); //sends info to the database by ID and saves to the grid
      }
    }
  );
});
//admins edit event info or fix mistakes as organizers, also for organizers to keep accurate event data
app.put("/api/events/:id", (req, res) => {
  const { title, date, description, category } = req.body;
  //update the specific event row after getting the id value
  db.run(
    "UPDATE events SET title=?, date=?, description=?, category=? WHERE id=?",
    [title, date, description, category, req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update event" });
      } else {
        res.json({ success: true }); //showing true means its saved and shows updated on the website
      }
    }
  );
});
//admin can delete events if something inappropriate or wrong gets submitted
app.delete("/api/events/:id", (req, res) => {
  db.run("DELETE FROM events WHERE id=?", [req.params.id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete event" });
    } else {
      res.json({ success: true }); //showing that the event is gone and no longer showing
    }
  });
});
//admin approves events so students can see them
app.post("/api/events/:id/approve", (req, res) => {
  db.run("UPDATE events SET status='approved' WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to approve" });
    res.json({ success: true }); //shows that the event is approved, then it shows on the site for all roles
  });
});
//admin rejects events so they dont show and are deleted
app.post("/api/events/:id/reject", (req, res) => {
  db.run("UPDATE events SET status='rejected' WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to reject" });
    res.json({ success: true }); //shows that the event is rejected, does not show on site at all
  });
});
//where students RSVP to events
app.post("/api/events/:id/rsvp", (req, res) => {
  const { name } = req.body; //shows who RSVP'd
  db.run(
    "INSERT INTO rsvps(event_id,name) VALUES(?,?)",
    [req.params.id, name],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to RSVP" });
      } else {
        res.json({ success: true }); //shows that they successfully RSVP'd
      }
    }
  );
});
//students can cancel RSVP
app.post("/api/events/:id/cancel-rsvp", (req, res) => {
  const { name } = req.body; //shows who canceled
  db.run(
    "DELETE FROM rsvps WHERE event_id=? AND name=?",
    [req.params.id, name],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to cancel RSVP" });
      } else {
        res.json({ success: true }); //lets the student know they successfully canceled
      }
    }
  );
});

//start the server using node.js
app.listen(PORT, () => {
  console.log(`Lamar EMS server running on http://localhost:${PORT}`); //how we know the server successfully is running and the url is ready to use
});
