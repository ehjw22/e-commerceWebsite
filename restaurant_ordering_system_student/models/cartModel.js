// models/cartModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Cart {
    // Helper to safely parse and validate positive integers
    static validatePositiveInteger(value, fieldName) {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: Must be a positive integer greater than zero.`);
        }
        return parsed;
    }

    
    // iv. Retrieve all items in the cart
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

module.exports = Cart;