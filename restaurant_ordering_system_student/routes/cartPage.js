// routes/cartView.js
// Import necessary modules
const express = require('express');
const path = require('path');
const router = express.Router();

// Import middleware for authentication
const { ensureAuthenticated } = require('../middleware/auth');

// End Points

// GET /cart to serve the main shopping cart HTML view page
router.get('/cart', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/cart/index.html'));
});

module.exports = router;