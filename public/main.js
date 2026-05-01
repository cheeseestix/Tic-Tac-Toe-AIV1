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
        return; // Stop running the rest of the function
      }

      // 3. Check if the board is full (a draw)
      if (!boardState.includes('')) {
        statusMessage.innerText = "It's a Draw!";
        gameActive = false;
        resetButton.style.display = 'inline-block';
        return;
      }

      // 4. If no win and no draw, swap turns
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      statusMessage.innerText = `Player ${currentPlayer}'s Turn`;
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

// Global function so the HTML button can trigger it
function resetGame() {
  // Reset memory
  currentPlayer = 'X';
  boardState = ['', '', '', '', '', '', '', '', ''];
  gameActive = true;

  // Reset UI
  document.getElementById('status-message').innerText = `Player X's Turn`;
  document.getElementById('reset-button').style.display = 'none'; // Hide button again

  // Clear all the squares on the screen
  document.querySelectorAll('.cell').forEach(cell => {
    cell.innerText = '';
  });
}