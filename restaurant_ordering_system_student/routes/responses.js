// routes/responses.js
// Import necessary modules
const express = require('express');
const router = express.Router();

// Import controllers and middleware
const auth = require('../middleware/auth');
const ResponseController = require('../controllers/responsesController');

// End Points

// GET /responses to fetch all responses belonging to the authenticated user
router.get('/', auth.ensureAuthenticated, ResponseController.getUserResponses);

// POST /responses/:id to create a new response linked to a specific item ID
router.post('/:id', ResponseController.createResponse);

// DELETE /responses/:id to remove a specific response by its unique ID
router.delete('/:id', ResponseController.deleteResponse);

module.exports = router;