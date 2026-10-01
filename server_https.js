const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_validation.html'));
});

// Handle form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // For demonstration, just respond with the received data
    res.send(`Username: ${username}, Password: ${password}`);
});

// Load SSL certificates
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};

// Create HTTPS server
https.createServer(options, app).listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});
