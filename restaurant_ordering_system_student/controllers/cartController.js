// controllers/cartController.js
const { CartModel, ValidationError, NotFoundError } = require('../models/cartModel.js');
// cartController.js

const { DiscountModel } = require("../models/discountModel");

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

    static async deleteCartItem(req, res) {
        try {
            const productId = req.params.id;
            const memberId = req.session.userId;

            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized access: Please log in.'
                });
            }

            // Delegating route parameter & ownership validation to CartModel.delete
            await CartModel.delete(memberId, productId);

            res.json({
                success: true,
                message: 'Item removed from cart successfully'
            });
        } catch (error) {
            CartController.handleError(res, error, 'Failed to delete cart item');
        }
    }

    // PUT /:id (Update cart items)
    static async updateCartItems(req, res) {
        try {
            const productId = req.params.id;
            const { quantity } = req.body;
            const memberId = req.session.userId;

            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized access: Please log in.'
                });
            }

            // Delegating type conversions and boundary rules to CartModel.update
            const data = await CartModel.update(memberId, productId, quantity);

            res.json({
                success: true,
                message: 'Cart item successfully updated',
                data: data
            });
        } catch (error) {
            CartController.handleError(res, error, 'Failed to update cart item');
        }
    }

    // GET /:id (Retrieve cart summary)
    static async getCartSummary(req, res) {
        try {
            const memberId = req.session.userId;
            const summary = await DiscountModel.calculateDiscounts(memberId);

            res.json({
                success: true,
                data: summary
            });

        } catch (err) {
            CartController.handleError(
                res,
                err,
                "Unable to calculate cart summary."
            );
        }
    }

    // GET /cart/checkout (Retrieve final checkout summary)
    static async getCheckoutSummary(req, res) {
        try {

            const memberId = req.session.userId;

            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access: Please log in."
                });
            }

            const summary = await CartModel.getCheckoutSummary(memberId);

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {

            CartController.handleError(
                res,
                error,
                "Unable to retrieve checkout summary."
            );

        }
    }

    // POST /cart/checkout (Place order)
    static async placeOrder(req, res) {
        try {

            const memberId = req.session.userId;

            if (!memberId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access: Please log in."
                });
            }

            const result = await CartModel.placeOrder(memberId, req.body.deliveryAddress, req.body.finalAmount);

            res.json({
                success: true,
                message: "Order placed successfully.",
                data: result
            });

        } catch (error) {
            CartController.handleError(
                res,
                error,
                "Unable to place order."
            );
        }
    }
}

module.exports = CartController;