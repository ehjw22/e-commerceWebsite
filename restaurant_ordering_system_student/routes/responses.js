// routes/responses.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ResponseController = require('../controllers/responsesController');

// End Points
router.get('/', auth.ensureAuthenticated, ResponseController.getUserResponses);
router.post('/:id', ResponseController.createResponse);
router.delete('/:id', ResponseController.deleteResponse);

module.exports = router;