// models/cartModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Custom Domain Error Classes for Controller Mapping
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400; // Bad Request
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404; // Not Found
    }
}

class CartModel {

    static validatePositiveInteger(value, fieldName, allowZero = false) {
        if (value === undefined || value === null || value === '') {
            throw new ValidationError(`${fieldName} is required.`);
        }

        const parsed = Number(value);

        if (!Number.isInteger(parsed)) {
            throw new ValidationError(`Invalid ${fieldName}: Must be a whole integer.`);
        }

        if (allowZero ? parsed < 0 : parsed <= 0) {
            throw new ValidationError(
                `Invalid ${fieldName}: Must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`
            );
        }

        return parsed;
    }

    static async getAll(memberId) {
        const cleanMemberId = this.validatePositiveInteger(memberId, 'Member ID');

        const userCart = await prisma.cart.findUnique({
            where: { memberId: cleanMemberId },
            include: {
                cartItem: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return userCart ? userCart.cartItem : [];
    }

    static async delete(memberId, productId) {
        // 1. Convert and validate inputs into clean integers
        const cleanMemberId = this.validatePositiveInteger(memberId, 'Member ID');
        const cleanProductId = this.validatePositiveInteger(productId, 'Product ID');

        // 2. Fetch the user's cart
        const userCart = await prisma.cart.findUnique({
            where: { memberId: cleanMemberId }
        });

        if (!userCart) {
            throw new NotFoundError("Shopping cart record not found for this member.");
        }

        try {
            // 3. Delete using Prisma's compound unique key name
            return await prisma.cartItem.delete({
                where: {
                    cartId_productId: {
                        cartId: userCart.cartId,
                        productId: cleanProductId
                    }
                }
            });
        } catch (error) {
            // P2025 is Prisma's error code for "Record to delete does not exist"
            if (error.code === 'P2025') {
                throw new NotFoundError("Item could not be found in your cart to delete.");
            }
            // Throw any unexpected database errors up to the controller
            throw error;
        }
    }
}

// Export both the model class and custom error types
module.exports = {
    CartModel,
    ValidationError,
    NotFoundError
};