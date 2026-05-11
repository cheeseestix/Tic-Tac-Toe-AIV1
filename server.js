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
  const { boardState, result, date, aiDifficulty, gameMode } = req.body;
  const username = req.session.user?.username;

  if (!username) {
    return res.status(401).send('User not authenticated');
  }

  let games = [];
  try {
    const raw = fs.readFileSync(gamesPath, 'utf8');
    games = raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading games.json:", err);
    games = [];
  }

  games.push({ boardState, result, date, username, aiDifficulty, gameMode });

  try {
    fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
    console.log("Game saved to games.json");
  } catch (err) {
    console.error("Error writing to games.json:", err);
    return res.status(500).send('Failed to save game');
  }

  // Update leaderboard
  try {
    updateLeaderboard(username, result, aiDifficulty, gameMode);
  } catch (err) {
    console.error("Error updating leaderboard:", err);
  }

  res.status(200).send('Game saved successfully');
});

// Fetch game history
app.get('/games', (req, res) => {
  try {
    const raw = fs.readFileSync(gamesPath, 'utf8');
    const games = raw.trim() ? JSON.parse(raw) : [];
    res.status(200).json(games);
  } catch (err) {
    console.error("Error reading games.json:", err);
    res.status(500).send('Could not read game data');
  }
});

// Leaderboard endpoint
const leaderboardPath = path.join(__dirname, 'data', 'leaderboard.json');

// Ensure leaderboard.json exists and is an array
if (!fs.existsSync(leaderboardPath)) {
  fs.writeFileSync(leaderboardPath, JSON.stringify([]));
}

// Update leaderboard with game result
function updateLeaderboard(username, result, aiDifficulty, gameMode) {
  let leaderboard = [];
  try {
    const raw = fs.readFileSync(leaderboardPath, 'utf8');
    leaderboard = raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading leaderboard.json:", err);
    leaderboard = [];
  }

  // Find or create the player's entry for the specific game mode
  let playerEntry = leaderboard.find(entry => entry.username === username && entry.gameMode === gameMode);
  if (!playerEntry) {
    playerEntry = {
      username: username,
      winsVsPlayer: 0,
      winsVsAI: 0,
      winsAsX: 0,
      winsAsO: 0,
      totalGames: 0,
      aiDifficulty: aiDifficulty || 'impossible',
      gameMode: gameMode || 'classic'
    };
    leaderboard.push(playerEntry);
  }

  // Update stats based on the result and game mode
  playerEntry.totalGames++;
  playerEntry.aiDifficulty = aiDifficulty || playerEntry.aiDifficulty;
  
  if (gameMode === 'xAlwaysWins') {
    if (result.includes('Player X Wins')) {
      playerEntry.winsAsX++;
    } else if (result.includes('AI Wins') || result.includes('Player O Wins')) {
      playerEntry.winsAsO++;
    }
  } else {
    if (result.includes('Wins vs AI')) {
      playerEntry.winsVsAI++;
    } else if (result.includes('Wins vs Player')) {
      playerEntry.winsVsPlayer++;
    }
  }

  // Sort leaderboard by total wins
  leaderboard.sort((a, b) => {
    const aTotalWins = (a.winsVsPlayer || 0) + (a.winsVsAI || 0) + (a.winsAsX || 0) + (a.winsAsO || 0);
    const bTotalWins = (b.winsVsPlayer || 0) + (b.winsVsAI || 0) + (b.winsAsX || 0) + (b.winsAsO || 0);
    return bTotalWins - aTotalWins;
  });

  try {
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
    console.log("Leaderboard updated successfully");
  } catch (err) {
    console.error("Error writing to leaderboard.json:", err);
  }
}

// Fetch leaderboard
app.get('/leaderboard', (req, res) => {
  try {
    const raw = fs.readFileSync(leaderboardPath, 'utf8');
    const leaderboard = raw.trim() ? JSON.parse(raw) : [];
    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Error reading leaderboard.json:", err);
    res.status(500).send('Could not read leaderboard data');
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});