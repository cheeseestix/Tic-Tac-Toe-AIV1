const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const usersPath = path.join(__dirname, 'data', 'users.json');

  let users = [];
  try {
    const raw = fs.readFileSync(usersPath, 'utf8');
    users = raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    users = [];
  }

  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.status(400).send('User already exists');

  users.push({ username, password });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.send('Account created! You can now login.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
