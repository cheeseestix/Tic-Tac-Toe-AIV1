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

// Users endpoint
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

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const usersPath = path.join(__dirname, 'data', 'users.json');

  let users = [];
  try {
    const raw = fs.readFileSync(usersPath, 'utf8');
    users = JSON.parse(raw);
  } catch (err) {
    return res.status(500).send('Could not read user data');
  }

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = { username: user.username };
    res.send('Login successful!');
  } else {
    res.status(401).send('Invalid username or password');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out');
});

// Games endpoint
const gamesPath = path.join(__dirname, 'data', 'games.json');

// Ensure games.json exists and is an array
if (!fs.existsSync(gamesPath)) {
  fs.writeFileSync(gamesPath, JSON.stringify([]));
}

// Save game data
app.post('/save-game', (req, res) => {
  const { boardState, result, date } = req.body;

  let games = [];
  try {
    const raw = fs.readFileSync(gamesPath, 'utf8');
    games = raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    games = [];
  }

  games.push({ boardState, result, date });

  fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));

  res.status(200).send('Game saved successfully');
});

// Fetch game history
app.get('/games', (req, res) => {
  try {
    const raw = fs.readFileSync(gamesPath, 'utf8');
    const games = raw.trim() ? JSON.parse(raw) : [];
    res.status(200).json(games);
  } catch (err) {
    res.status(500).send('Could not read game data');
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});