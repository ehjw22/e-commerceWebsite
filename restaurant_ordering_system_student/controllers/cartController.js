// controllers/cartController.js
const cartModel = require('../models/cartModel.js');

class Cart {
    // GET / (Retrieve all cart items)
    static async getCartItems(req, res) {
        try {
            const memberId = req.session.userId;
            
            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized access: Please log in to view your cart.'
                });
            }

            const rows = await cartModel.getAll(memberId);

            res.json({
                success: true,
                rows: rows
            });
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve cart items'
            });
        }
    }
}

module.exports = Cart;