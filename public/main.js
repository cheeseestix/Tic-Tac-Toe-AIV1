async function handleAuth(type) {
  // Grab the values from your HTML inputs
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Make sure they aren't blank
  if (!username || !password) {
    alert("Please fill in both fields");
    return;
  }

  try {
    // Send the data to your server (/login or /register)
    const response = await fetch(`/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const message = await response.text();

    if (response.ok) {
      alert(message); // Shows "Login successful!" or "Account created!"

      if (type === 'login') {
        // Redirect the user to the game page
        window.location.href = '/game.html';
      }
    } else {
      // Shows error if password is wrong or user exists
      alert("Error: " + message); 
    }
  } catch (error) {
    console.error("Auth Error:", error);
    alert("Something went wrong communicating with the server.");
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/logout', { method: 'POST' });
    if (response.ok) {
      // Send them back to the login screen
      window.location.href = '/index.html'; 
    }
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

// ==========================================
// GAME LOGIC
// ==========================================

let currentPlayer = 'X';
let boardState = ['', '', '', '', '', '', '', '', ''];
let gameActive = true; // Tells us if the game is still going
let isVsAI = false; // Track if the game is vs AI
let aiDifficulty = 'impossible'; // Track AI difficulty: 'easy', 'medium', or 'impossible'

// All the index combinations that result in a win
const winningConditions = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6]  // Diagonal top-right to bottom-left
];

const boardElement = document.getElementById('board');

if (boardElement) {
  const cells = document.querySelectorAll('.cell');
  const statusMessage = document.getElementById('status-message');
  const resetButton = document.getElementById('reset-button');

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const index = cell.getAttribute('data-index');

      // Stop if the spot is taken OR if the game is already over
      if (boardState[index] !== '' || !gameActive) {
        return;
      }

      // 1. Update the board state and HTML
      boardState[index] = currentPlayer;
      cell.innerText = currentPlayer;

      // 2. Check if this move caused a win
      if (checkWin()) {
        statusMessage.innerText = `Player ${currentPlayer} Wins!`;
        gameActive = false;
        resetButton.style.display = 'inline-block'; // Show the reset button
        saveGameResult(`Player ${currentPlayer} Wins!`);
        return; // Stop running the rest of the function
      }

      // 3. Check if the board is full (a draw)
      if (!boardState.includes('')) {
        statusMessage.innerText = "It's a Draw!";
        gameActive = false;
        resetButton.style.display = 'inline-block';
        saveGameResult("It's a Draw!");
        return;
      }

      // 4. If no win and no draw, swap turns
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      statusMessage.innerText = `Player ${currentPlayer}'s Turn`;

      // 5. If playing vs AI and it's AI's turn (O), make AI move
      if (isVsAI && currentPlayer === 'O' && gameActive) {
        setTimeout(() => {
          const aiMove = getAIMove();
          if (aiMove !== null) {
            boardState[aiMove] = 'O';
            document.querySelector(`.cell[data-index="${aiMove}"]`).innerText = 'O';

            if (checkWin()) {
              statusMessage.innerText = 'AI Wins!';
              gameActive = false;
              resetButton.style.display = 'inline-block';
              saveGameResult('AI Wins!');
              return;
            }

            if (!boardState.includes('')) {
              statusMessage.innerText = "It's a Draw!";
              gameActive = false;
              resetButton.style.display = 'inline-block';
              saveGameResult("It's a Draw!");
              return;
            }

            currentPlayer = 'X';
            statusMessage.innerText = `Player ${currentPlayer}'s Turn`;
          }
        }, 500); // Delay to simulate AI thinking
      }
    });
  });

  // Helper function to check if the current board matches any winning condition
  function checkWin() {
    for (let i = 0; i < winningConditions.length; i++) {
      const [a, b, c] = winningConditions[i];
      // Check if spot 'a' has something, and if 'a', 'b', and 'c' are all the exact same letter
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return true;
      }
    }
    return false;
  }
}

// Minimax algorithm for AI
function getAIMove() {
  if (aiDifficulty === 'easy') {
    // Easy: Random move
    const availableMoves = boardState.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  } else if (aiDifficulty === 'medium') {
    // Medium: 50% chance to make a random move, 50% chance to make the best move
    if (Math.random() < 0.5) {
      const availableMoves = boardState.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Fall through to minimax for best move
      let bestScore = -Infinity;
      let bestMove = null;

      for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === '') {
          boardState[i] = 'O';
          let score = minimax(boardState, 0, false);
          boardState[i] = '';

          if (score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }
      return bestMove;
    }
  } else {
    // Impossible: Always make the best move using minimax
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < boardState.length; i++) {
      if (boardState[i] === '') {
        boardState[i] = 'O';
        let score = minimax(boardState, 0, false);
        boardState[i] = '';

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }
}

function minimax(board, depth, isMaximizing) {
  // Check terminal states
  if (checkTerminalWin('O')) return 10 - depth;
  if (checkTerminalWin('X')) return depth - 10;
  if (!board.includes('')) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        let score = minimax(board, depth + 1, false);
        board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        let score = minimax(board, depth + 1, true);
        board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function checkTerminalWin(player) {
  for (let condition of winningConditions) {
    const [a, b, c] = condition;
    if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
      return true;
    }
  }
  return false;
}

// Function to save game results
async function saveGameResult(result) {
  try {
    const response = await fetch('/save-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardState: [...boardState],
        result: result,
        date: new Date().toISOString()
      })
    });
    if (!response.ok) {
      console.error("Failed to save game result");
    }
  } catch (error) {
    console.error("Error saving game result:", error);
  }
}

// Global function to start a new game vs AI with selected difficulty
function startVsAI(difficulty = 'impossible') {
  isVsAI = true;
  aiDifficulty = difficulty;
  resetGame();
  document.getElementById('status-message').innerText = `Player X's Turn (vs AI - ${difficulty})`;
}

// Global function to start a new game vs Player
function startVsPlayer() {
  isVsAI = false;
  resetGame();
  document.getElementById('status-message').innerText = 'Player X\'s Turn';
}

// Global function so the HTML button can trigger it
function resetGame() {
  // Reset memory
  currentPlayer = 'X';
  boardState = ['', '', '', '', '', '', '', '', ''];
  gameActive = true;

  // Reset UI
  document.getElementById('status-message').innerText = isVsAI ? `Player X's Turn (vs AI - ${aiDifficulty})` : `Player X's Turn`;
  document.getElementById('reset-button').style.display = 'none'; // Hide button again

  // Clear all the squares on the screen
  document.querySelectorAll('.cell').forEach(cell => {
    cell.innerText = '';
  });
}