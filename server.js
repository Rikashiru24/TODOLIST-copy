const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'todo_app'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

// GET all tasks
app.get('/tasks', (req, res) => {
  connection.query('SELECT * FROM tasks ORDER BY added_date DESC', (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).send('Error fetching tasks');
    }
    res.json(results);
  });
});

  // POST new task
  app.post('/tasks', (req, res) => {
    const { task, due_date, added_date } = req.body;

  if (!task || !due_date || !added_date) {
    console.error('Missing required fields: task, due_date, or added_date');
    return res.status(400).json({ message: 'Missing required fields' }); // Ensure error is JSON
  }

  connection.query(
    'INSERT INTO tasks (task, due_date, added_date) VALUES (?, ?, ?)',
    [task, due_date, added_date],
    (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Error adding task' }); // Ensure error is JSON
      }

      console.log('Task added successfully:', result);
      res.status(201).json({ message: 'Task added successfully' }); // This is valid JSON
    }
  );
});



// DELETE task
app.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  connection.query('DELETE FROM tasks WHERE id = ?', [taskId], (err, result) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).send('Error deleting task');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Task not found');
    }

    res.status(200).send('Task deleted');
  });
});

// PUT (Update) task
app.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { task, due_date } = req.body;

  if (!task || !due_date) {
    return res.status(400).send('Missing required fields: task or due_date');
  }

  connection.query(
    'UPDATE tasks SET task = ?, due_date = ? WHERE id = ?',
    [task, due_date, taskId],
    (err, result) => {
      if (err) {
        console.error('Error updating task:', err);
        return res.status(500).send('Error updating task');
      }

      console.log('Update result:', result);  // Log result for debugging
      if (result.affectedRows === 0) {
        return res.status(404).send('Task not found');
      }

      res.status(200).send('Task updated');
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
