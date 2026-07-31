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

// GET /cart/summary to calculate and retrieve the total cost summary of the cart (e.g., items subtotal, delivery tiers, final price)
router.get('/summary', auth.ensureAuthenticated, cartController.getCartSummary);

// GET /cart/checkout to checkout the items in the cart
router.get('/checkout', auth.ensureAuthenticated, cartController.getCheckoutSummary);

// POST /cart/checkout
router.post('/checkout', auth.ensureAuthenticated, cartController.placeOrder);

// POST /cart to add a menu item into the authenticated user's shopping cart (creates cart row on-demand if missing)
router.post('/', auth.ensureAuthenticated, cartController.createCartItems);

// DELETE /cart/:id to permanently remove a specific item from the cart using its product ID passed as a route parameter
router.delete('/:id', auth.ensureAuthenticated, cartController.deleteCartItem);

// PUT /cart/:id to update the quantity value of a specific item inside the cart using its product ID passed as a route parameter
router.put('/:id', auth.ensureAuthenticated, cartController.updateCartItems);

module.exports = router;