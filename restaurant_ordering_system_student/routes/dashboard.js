// routes/dashboard.js
// Import necessary modules
const express = require('express');
const path = require('path');
const router = express.Router();

// Import middleware for authentication and role authorization
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Import controller
const DashboardController = require('../controllers/dashboardController');

// End Points

// GET /dashboard to serve the static HTML file for the admin dashboard page
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// GET /dashboard/api to fetch the required data for the dashboard view
router.get('/api', ensureAuthenticated, ensureAdmin, DashboardController.getApiData);

module.exports = router;