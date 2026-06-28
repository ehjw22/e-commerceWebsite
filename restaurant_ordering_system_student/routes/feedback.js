// routes/feedback.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controller
const productFeedbackController = require('../controllers/productFeedbackController');

// Map the routes directly to your controller's static methods
router.get('/', auth.ensureAuthenticated, productFeedbackController.getMemberFeedback);
router.get('/:id', productFeedbackController.getFeedbackById)
router.get('/product/:id', productFeedbackController.getProductFeedback);
router.post('/', auth.ensureAuthenticated, productFeedbackController.createFeedback);
router.delete('/:id', auth.ensureAuthenticated, productFeedbackController.deleteFeedback);
router.put('/:id', auth.ensureAuthenticated, productFeedbackController.updateFeedback);

module.exports = router;