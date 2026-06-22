// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /responses - retrieve all responses of a user
router.get('/', auth.ensureAuthenticated, async (req, res) => {
  try {

    const userId = req.session.userId

    const query = `
      SELECT * FROM get_response($1)
    `;

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      rows: result.rows
    });

  } catch (error) {
    console.error('Error fetching responses:', error);

    if (error.code === 'P0003') {
      return res.status(404).json({
        success: false,
        message: error.message,
        rows: 0
      });
    }

    if (error.code === 'P0002') {
      return res.status(404).json({
        success: false,
        message: error.message,
        rows: 0
      })
    };

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve responses'
    });
  }
});

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
    console.error('Error creating response:', error);

    res.status(400).json({
      success: false,
      message: error.message
    })
  }
});

// DELETE /responses/:id - Delete a response based on its id
router.delete('/:id', async (req, res) => {
  try {
    const responseId = parseInt(req.params.id);
    const member_id = req.session.userId

    const query = `
      CALL delete_response($1, $2)
    `;

    await db.query(query, [responseId, member_id]);

    res.json({
      success: true,
      message: 'Response successfully deleted.'
    })
  } catch (error) {
    console.error('Error deleting response:', error);

    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router;