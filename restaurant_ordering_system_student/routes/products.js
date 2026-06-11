// routes/products.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /products - retrieve all products (member view)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT product_id, name, description, price, category, is_available, created_at
      FROM product
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      products: result.rows
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
});

// GET /products/:id - retrieve a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT product_id, name, description, price, category, is_available, created_at
      FROM product
      WHERE product_id = $1
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
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product'
    });
  }
});

// POST /products/buy - buy products
router.post('/purchase', async (req, res) => {
  const client = await db.connect();

  try {
    const memberId = req.session.userId;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items selected'
      });
    }

    await client.query('BEGIN');

    let totalAmount = 0;

    // Calculate total from DB prices
    for (const item of items) {
      const productResult = await client.query(
        `
          SELECT product_id, price
          FROM product
          WHERE product_id = $1
        `, [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.rows[0];

      // if (product.stock < item.quantity) {
      //   throw new Error(
      //     `Insufficient stock for product ${product.product_id}`
      //   );
      // }

      totalAmount += product.price * item.quantity;
    }

    // Create order
    const orderResult = await client.query(
      `
        INSERT INTO sale_order (member_id, total_amount, status, delivery_address, order_date)
        VALUES ($1, $2, 'COMPLETED', '123 Main Street', NOW())

        RETURNING order_id
      `, [memberId, totalAmount]
    );

    const orderId = orderResult.rows[0].order_id;

    // Create order items + reduce stock
    for (const item of items) {

      const productResult = await client.query(
        `
          SELECT price
          FROM product
          WHERE product_id = $1
        `, [item.productId]
      );

      const unitPrice = productResult.rows[0].price;

      await client.query(
        `
          INSERT INTO sale_order_item (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
        `, [orderId, item.productId, item.quantity, unitPrice, item.quantity * unitPrice]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      orderId,
      totalAmount
    });

  } catch (error) {

    await client.query('ROLLBACK');

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {
    client.release();
  }
});

module.exports = router;