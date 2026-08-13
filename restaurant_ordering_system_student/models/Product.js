// models/Product.js
const pool = require('../config/database');
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class Product {
    static async findAll() {
        const query = 'SELECT * FROM product WHERE is_available = true ORDER BY name';
        const result = await pool.query(query);
        return result.rows;
    }

    static async findById(productId) {
        const query = 'SELECT * FROM product WHERE product_id = $1';
        const result = await pool.query(query, [productId]);
        return result.rows[0];
    }

    static async getCategories() {
        const query = 'SELECT DISTINCT category FROM product WHERE category IS NOT NULL ORDER BY category';
        const result = await pool.query(query);
        return result.rows.map(row => row.category);
    }
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

    static async updateAvailability(productId, isAvailable) {
        const cleanProductId = this.validatePositiveInteger(productId, 'Product ID');

        if (typeof isAvailable !== 'boolean') {
            throw new ValidationError('Availability must be either true or false.');
        }

        try {
            return await prisma.product.update({
                where: {
                    productId: cleanProductId
                },
                data: {
                    isAvailable: isAvailable
                }
            });
        } catch (error) {
            // Product does not exist
            if (error.code === 'P2025') {
                throw new NotFoundError('Product not found.');
            }
            throw error;
        }
    }

    static async update(productId, name, description, price, category) {
        const cleanProductId = this.validatePositiveInteger(productId, 'Product ID');

        // Validate name
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new ValidationError('Product name is required.');
        }

        // Validate description
        if (description !== null && description !== undefined && typeof description !== 'string') {
            throw new ValidationError('Description must be a string.');
        }

        // Validate category
        if (typeof category !== 'string' || category.trim().length === 0) {
            throw new ValidationError('Product category is required.');
        }

        // Validate price
        const cleanPrice = Number(price);

        if (!Number.isFinite(cleanPrice) || cleanPrice < 0) {
            throw new ValidationError('Price must be a valid non-negative number.');
        }

        try {
            return await prisma.product.update({
                where: {
                    productId: cleanProductId
                },
                data: {
                    name: name.trim(),
                    description: description === null || description === undefined ? null : description.trim(),
                    price: cleanPrice,
                    category: category.trim()
                }
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('Product not found.');
            }
            throw error;
        }
    }
}

module.exports = Product;