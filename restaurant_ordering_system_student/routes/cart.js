// routes/cart.js
// Import necessary modules
const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');

// Import controller
const cartController = require('../controllers/cartController');

// End Points

// GET /cart to retrieve all shopping cart items belonging to the authenticated member
router.get('/', auth.ensureAuthenticated, cartController.getCartItems);

// POST /cart to add a menu item into the authenticated user's shopping cart (creates cart row on-demand if missing)
router.post('/', auth.ensureAuthenticated, cartController.createCartItems);

module.exports = router;