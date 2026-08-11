// routes/discountsPage.js
// Import necessary modules
const express = require('express');
const path = require('path');
const router = express.Router();

// Import middleware for authentication
const { ensureAuthenticated } = require('../middleware/auth');

// End Points

// GET /cart to serve the main shopping cart HTML view page
router.get('/', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/discounts.html'));
});

module.exports = router;