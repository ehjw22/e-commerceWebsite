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

}

// Export both the model class and custom error types
module.exports = {
    CartModel,
    ValidationError,
    NotFoundError
};