const express = require('express');
const squlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new squlite3.Database('.events/events.db);

app.use(express.json());
app.use(express.static(_dirname));

db.run('CREATE TABLE IF NOT EXISTS events(
    id INTERGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)');

app.get('/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY created_at DESC', (err, rows) => {
    if (err) res.status(500).json({error:err.message});
    else res.json(rows);
  });
});

app.post('/events, (req, res) => {
  const {title, date, description) = req.body;
  db.run('INSERT INTO events(title,date,description) VALUES(?,?,?)',[title,date,description],function(err){
    if(err) res.status(500).json([error:err.message});
    else res.json([id:this.lastID});
  });
});

app.delete('/events/:id', (req, res) => {
  db.run('DELETE FROM events WHERE id=?',[req.params.id],function(err){
    if (err) res.status(500).json({error:err.message});
    else res.json({deleted:this.changes});
  });
});

app.listen(3000, ()=>console.log('Server running on port 3000'));
