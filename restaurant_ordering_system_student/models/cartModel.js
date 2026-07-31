// models/cartModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { DiscountModel } = require('./discountModel');

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

    static async createCartItem(memberId, productId, quantity) {
        const cleanMemberId = this.validatePositiveInteger(memberId, 'Member ID');
        const cleanProductId = this.validatePositiveInteger(productId, 'Product ID');
        const cleanQuantity = this.validatePositiveInteger(quantity, 'Quantity');

        // Business Rule: Cap max items per single order row
        if (cleanQuantity > 99) {
            throw new ValidationError("Cannot add more than 99 units of a single item at once.");
        }

        // 1. Backend Business Validation: Check if Product exists and is available
        const verifiedProduct = await prisma.product.findUnique({
            where: { productId: cleanProductId }
        });

        if (!verifiedProduct) {
            throw new NotFoundError("Target menu item does not exist.");
        }

        if (verifiedProduct.isAvailable === false) {
            throw new ValidationError(`"${verifiedProduct.name}" is currently out of stock.`);
        }

        // 2. Ensure Member exists before creating cart
        const verifiedMember = await prisma.member.findUnique({
            where: { memberId: cleanMemberId }
        });

        if (!verifiedMember) {
            throw new NotFoundError("Member record does not exist.");
        }

        // 3. Dynamic Cart Allocation (On-Demand Cart Creation)
        const userCart = await prisma.cart.upsert({
            where: { memberId: cleanMemberId },
            update: { createdAt: new Date() },
            create: { memberId: cleanMemberId, createdAt: new Date() }
        });

        // 4. Create or Increment Item Quantity safely
        return await prisma.cartItem.upsert({
            where: {
                cartId_productId: {
                    cartId: userCart.cartId,
                    productId: cleanProductId
                }
            },
            update: { quantity: { increment: cleanQuantity } },
            create: {
                cartId: userCart.cartId,
                productId: cleanProductId,
                quantity: cleanQuantity
            }
        });
    }

    static async update(memberId, productId, quantity) {
        const cleanMemberId = this.validatePositiveInteger(memberId, 'Member ID');
        const cleanProductId = this.validatePositiveInteger(productId, 'Product ID');
        // Allow zero so setting quantity to 0 removes the item automatically
        const cleanQuantity = this.validatePositiveInteger(quantity, 'Quantity', true);

        if (cleanQuantity > 99) {
            throw new ValidationError("Maximum quantity limit per item is 99.");
        }

        // Edge-case business rule: If quantity updated to 0, trigger deletion logic
        if (cleanQuantity === 0) {
            return await this.delete(cleanMemberId, cleanProductId);
        }

        const userCart = await prisma.cart.findUnique({
            where: { memberId: cleanMemberId }
        });

        if (!userCart) {
            throw new NotFoundError("Shopping cart record not found for this member.");
        }

        try {
            return await prisma.cartItem.update({
                where: {
                    cartId_productId: {
                        cartId: userCart.cartId,
                        productId: cleanProductId
                    }
                },
                data: { quantity: cleanQuantity }
            });
        } catch (error) {
            // Catch Prisma Foreign Key/Not Found Code (P2025)
            if (error.code === 'P2025') {
                throw new NotFoundError("Item does not exist in your shopping cart.");
            }
            throw error;
        }
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

    // Retrieve checkout summary (available + unavailable items)
    static async getCheckoutSummary(memberId) {

        const cleanMemberId = this.validatePositiveInteger(
            memberId,
            "Member ID"
        );

        const userCart = await prisma.cart.findUnique({
            where: {
                memberId: cleanMemberId
            },
            include: {
                cartItem: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!userCart) {
            throw new NotFoundError(
                "Shopping cart record not found."
            );
        }

        // Split items into available and unavailable
        const availableItems = userCart.cartItem.filter(
            item => item.product.isAvailable
        );

        const unavailableItems = userCart.cartItem.filter(
            item => !item.product.isAvailable
        );

        // Reuse the existing discount logic
        const summary =
            await DiscountModel.calculateDiscounts(
                cleanMemberId,
                availableItems
            );

        return {
            availableItems,
            unavailableItems,
            subtotal: summary.subtotal,
            discounts: summary.discounts,
            deliveryFee: summary.deliveryFee,
            total: summary.total
        };

    }

}

// Export both the model class and custom error types
module.exports = {
    CartModel,
    ValidationError,
    NotFoundError
};