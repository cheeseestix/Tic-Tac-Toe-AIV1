const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files from the /public folder
app.use(express.static('public'));

// Hello World route for CP01
app.get('/hello', (req, res) => {
  res.send('Hello World! Server is up and running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});