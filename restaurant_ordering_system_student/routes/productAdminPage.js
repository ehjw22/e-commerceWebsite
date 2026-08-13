// routes/productsPage.js
const express = require('express');
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /product-management
router.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/productAdmin.html'));
});

module.exports = router;