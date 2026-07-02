// Import necessary modules
const express = require('express');
const path = require('path');
const router = express.Router();

// End Points

// Import middleware for authentication
const {ensureAuthenticated} = require('../middleware/auth')

// GET /feedback to serve the main feedback dashboard overview HTML page
router.get('/feedback', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/index.html'));
})

// GET /feedback/edit to serve the HTML form page for editing an existing feedback entry
router.get('/feedback/edit', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/edit.html'))
})

// GET /feedback/create to serve the HTML form page for submitting a new piece of feedback
router.get('/feedback/create', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/create.html'))
})

module.exports = router;