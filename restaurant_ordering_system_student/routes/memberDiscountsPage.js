// routes/discountsPage.js
// Import necessary modules
const express = require('express');
const path = require('path');
const router = express.Router();

// Import middleware for authentication
const { ensureAuthenticated } = require('../middleware/auth');

// End Points

// GET /member/discounts to serve the discounts HTML view page
router.get('/discounts', ensureAuthenticated,  (req, res) => {
    res.sendFile(path.join(__dirname, '../views/viewDiscount.html'));
});

module.exports = router;