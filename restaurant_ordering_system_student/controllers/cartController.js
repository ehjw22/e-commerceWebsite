// controllers/cartController.js
const { CartModel, ValidationError, NotFoundError } = require('../models/cartModel.js');

class CartController {
    static handleError(res, error, defaultMessage) {
        if (error instanceof ValidationError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        if (error instanceof NotFoundError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error(`${defaultMessage}:`, error);
        return res.status(500).json({
            success: false,
            message: defaultMessage
        });
    }

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

            const rows = await CartModel.getAll(memberId);

            res.json({
                success: true,
                rows: rows
            });
        } catch (error) {
            CartController.handleError(res, error, 'Failed to retrieve cart items');
        }
    }

    // POST / (Create new cart item / Add items to cart)
    static async createCartItems(req, res) {
        try {
            const { productId, quantity } = req.body;
            const memberId = req.session.userId;

            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized access: Please log in to manage your cart.'
                });
            }

            // Delegating validation to CartModel.createCartItem
            const data = await CartModel.createCartItem(memberId, productId, quantity);

            res.status(201).json({
                success: true,
                message: 'Item added to cart successfully',
                data: data
            });
        } catch (error) {
            CartController.handleError(res, error, 'Failed to create cart item');
        }
    }

}

module.exports = CartController;