// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /feedback - retrieve all feedback from a member
router.get('/', async (req, res) => {
  try {

    const userId = req.session.userId

    const query = `
    SELECT 
        comments, 
        ratings, 
        last_updated
    FROM dining_feedback
    WHERE member_id = $1
    ORDER BY product_id ASC, last_updated DESC;
    `;

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      rows: result.rows
    });

  } catch (error) {
    console.error('Error fetching dining_feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dining_feedback'
    });
  }
});

// GET /feedback/:id - retrive all feedback of a product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        feedback_id,
        comments, 
        ratings, 
        last_updated,
        member_id
    FROM dining_feedback
    WHERE product_id = $1
    ORDER BY last_updated DESC;
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No feedback found'
      });
    }

    res.json({
      success: true,
      rows: result.rows
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product'
    });
  }
});

// POST /feedback
router.post('/', async (req, res) => {
  try {

    const {feedback, ratings, product_id} = req.body;
    const member_id = req.session.userId;

    const query = `
      CALL create_feedback($1, $2, $3, $4)  
    `;

    const result = await db.query(query, [feedback, ratings, member_id, product_id]);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /feedback/:id - delete a feedback by its id
router.delete('/:id', async (req, res) => {
  try {
    const feedbackId = parseInt(req.params.id);
    const member_id = req.session.userId;

    const query = `
      CALL delete_feedback($1, $2)
    `;

    await db.query(query, [feedbackId, member_id]);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
})

module.exports = router;