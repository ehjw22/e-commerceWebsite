// routes/feedback.js
// Import necessary modules
const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');

// Import controller
const productFeedbackController = require('../controllers/productFeedbackController');

// End Points

// GET /feedback to fetch all feedback items submitted by the authenticated member
router.get('/', auth.ensureAuthenticated, productFeedbackController.getMemberFeedback);

// GET /feedback/:id to retrieve the details of a single feedback submission by its unique ID
router.get('/:id', productFeedbackController.getFeedbackById)

// GET /feedback/product/:id to fetch all feedback entries left for a specific product ID
router.get('/product/:id', productFeedbackController.getProductFeedback);

// POST /feedback to submit a new piece of product feedback from an authenticated user
router.post('/', auth.ensureAuthenticated, productFeedbackController.createFeedback);

// DELETE /feedback/:id to permanently remove a specific feedback entry by its unique ID
router.delete('/:id', auth.ensureAuthenticated, productFeedbackController.deleteFeedback);

// PUT /feedback/:id to modify or update an existing feedback entry by its unique ID
router.put('/:id', auth.ensureAuthenticated, productFeedbackController.updateFeedback);

module.exports = router;