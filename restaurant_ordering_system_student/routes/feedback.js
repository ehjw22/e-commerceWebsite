// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /feedback - retrieve all feedback from a member
router.get('/', auth.ensureAuthenticated, async (req, res) => {
  try {

    const userId = req.session.userId

    const query = `
      SELECT * FROM get_feedback($1)
    `;

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      rows: result.rows
    });

  } catch (error) {
    console.error('Error fetching dining_feedback:', error);
    
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
      message: 'Failed to retrieve dining_feedback'
    });
  }
});

// GET /feedback/:id - retrive all feedback of a product and the responses to that feedback
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
    SELECT 
      df.feedback_id,
      df.comments, 
      df.ratings, 
      df.last_updated,
      df.member_id,
      f.comments as "responses",
      df.product_id,
      f.member_id as "responder_id",
      m.username as "responder_username"
    FROM dining_feedback df
    LEFT JOIN feedback f on df.feedback_id = f.dining_feedback_id
    LEFT JOIN member m on m.member_id = f.member_id
    WHERE df.product_id = $1
    ORDER BY df.last_updated DESC;
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
router.post('/', auth.ensureAuthenticated, async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /feedback/:id - delete a feedback by its id
router.delete('/:id', auth.ensureAuthenticated, async (req, res) => {
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

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
})

// PUT /feedback/:id - update a feedback by its id
router.put('/:id', auth.ensureAuthenticated, async (req, res) => {
  try {
    const feedbackId = parseInt(req.params.id);
    const {ratings, comments} = req.body;
    const member_id = req.session.userId;

    const query = `
      CALL update_feedback($1, $2, $3, $4)
    `;

    await db.query(query, [feedbackId, member_id, comments, ratings]);

    res.json({
      success: true,
      message: 'Feedback successfully editted'
    })
  } catch (error) {
    console.error('Error updating feedbacK:', error);

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router;