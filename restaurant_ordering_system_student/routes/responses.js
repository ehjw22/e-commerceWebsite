// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();

// POST /responses/:id - Create a new response by the dining feedback ID
router.post('/:id', async (req, res) => {
  try {
    const diningFeedbackId = parseInt(req.params.id);
    const {response} = req.body;
    const member_id = 1

    const query = `
      CALL create_response($1, $2, $3)
    `;

    await db.query(query, [response, member_id, diningFeedbackId]);

    res.json({
      success: true,
      message: 'Response successfully added.'
    })
  } catch (error) {
    console.error('Error updating feedbacK:', error);

    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router;