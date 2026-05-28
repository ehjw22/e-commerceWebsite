// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /products - retrieve all products (member view)
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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        comments, 
        ratings, 
        last_updated
    FROM dining_feedback
    WHERE product_id = $1
    ORDER BY last_updated DESC;
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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


module.exports = router;