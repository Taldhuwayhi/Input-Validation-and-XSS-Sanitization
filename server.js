const express = require('express');
const path = require('path');
const validator = require('validator');
const xss = require('xss'); // Install and use xss library for sanitization
const app = express();
const port = 3000;

// Hardcoded credentials for demonstration purposes
const validUsername = 'admin';
const validPassword = 'password123';

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_validation.html'));
});

// Handle form submission
app.post('/login', (req, res) => {
    let { username, password } = req.body;

    

    // Validate inputs
    if (!validator.isAlphanumeric(username) || !validator.isLength(username, { min: 5 })) {
        return res.send('Invalid username. It must be at least 5 alphanumeric characters.');
    }
    if (!validator.isLength(password, { min: 8 }) || !/\d/.test(password)) {
        return res.send('Invalid password. It must be at least 8 characters long and contain at least one digit.');
    }

    // Check if the submitted username and password match the hardcoded credentials
    if (username === validUsername && password === validPassword) {
        res.send('Authentication successful!');
    } else {
        res.send('Authentication failed. Please check your username and password.');
    }
});

// Handle comment submission
app.post('/submit-comment', (req, res) => {
    let { comment } = req.body;

    // Sanitize comment to prevent XSS
    comment = xss(comment);

    // In a real application, you would save the sanitized comment to a database
    // For demonstration, just send the sanitized comment back
    res.send(`Comment received: ${comment}`);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
