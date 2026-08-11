const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DISCOUNT_TYPES = {
    PRODUCT_QUANTITY: "PRODUCT_QUANTITY",
    CART_TOTAL: "CART_TOTAL",
    DELIVERY: "DELIVERY"
};

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
        this.statusCode = 404;
    }
}

class DiscountModel {
    static async calculateDiscounts(memberId, cartItems=null) {
        
        // Find user's cart
        const cart = await prisma.cart.findUnique({
            where: {
                memberId
            },
            include: {
                cartItem: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            return {
                subtotal: 0,
                discounts: [],
                deliveryFee: 0,
                total: 0
            };
        }

        let items = cart.cartItem;

        let subtotal = 0;

        for (const item of items) {
            subtotal += Number(item.product.price) * item.quantity;
        }

        const availableDiscounts =
            await prisma.discount.findMany({
                where: {
                    isActive: true
                }
            });

        let totalDiscount = 0;

        // Find the default delivery fee
        const baseDeliveryDiscount = availableDiscounts.find(
            d =>
                d.discountType === "DELIVERY" &&
                Number(d.minTrigger) === 0
        );

        let baseDeliveryFee = baseDeliveryDiscount

        let deliveryFee = baseDeliveryFee;

        let appliedDiscounts = [];

        for (const discount of availableDiscounts) {
            if (discount.discountType === DISCOUNT_TYPES.PRODUCT_QUANTITY) {
                const item =
                    items.find(
                        c =>
                            c.productId ===
                            discount.targetProductId
                    );
                if (!item)
                    continue;
                if ( item.quantity >= Number(discount.minTrigger)) {
                    let amount;

                    if (discount.valueType === "PERCENTAGE") {
                        amount = Number(item.product.price) * item.quantity * Number(discount.value) / 100;
                    } else {
                        amount = Number(discount.value);
                    }

                    totalDiscount += amount;

                    appliedDiscounts.push({
                        discountId: discount.discountId,
                        name: discount.name,
                        amount
                    });
                }
            }

            if (discount.discountType === DISCOUNT_TYPES.CART_TOTAL) {

                if (subtotal >= Number(discount.minTrigger)) {
                    let amount;

                    if (discount.valueType === "PERCENTAGE") {
                        amount = subtotal * Number(discount.value) / 100;
                    } else {
                        amount = Number(discount.value);
                    }

                    totalDiscount += amount;

                    appliedDiscounts.push({
                        discountId: discount.discountId,
                        name: discount.name,
                        amount
                    });
                }
            }

            if (discount.discountType === DISCOUNT_TYPES.DELIVERY) {

                const min = Number(discount.minTrigger);

                const max =
                    discount.maxTrigger == null
                        ? Infinity
                        : Number(discount.maxTrigger);

                if (subtotal >= min && subtotal <= max) {

                    deliveryFee = Number(discount.value);

                    // Don't show the base delivery fee as a discount
                    if (discount.discountId !== baseDeliveryDiscount?.discountId) {
                        appliedDiscounts.push({
                            discountId: discount.discountId,
                            name: discount.name,
                            amount: baseDeliveryFee - deliveryFee
                        });
                    }
                }
            }
        }

        await prisma.saleDiscount.deleteMany({
            where: {
                saleOrderId: cart.cartId
            }
        });

        for (const discount of appliedDiscounts) {
            await prisma.saleDiscount.create({
                data: {
                    saleOrderId:
                        cart.cartId,
                    discountId:
                        discount.discountId
                }
            });
        }

        const total = subtotal - totalDiscount + deliveryFee;

        return {
            subtotal,
            discounts: appliedDiscounts,
            deliveryFee,
            total
        };
    }

    // Get all discounts
    static async getDiscounts(filters = {}) {

        const where = {};

        if (filters.search) {
            where.name = {
                contains: filters.search,
                mode: "insensitive"
            };
        }

        if (filters.discountType) {
            where.discountType = filters.discountType;
        }

        if (filters.isActive !== undefined && filters.isActive !== "") {
            where.isActive = filters.isActive === true;
        }

        return await prisma.discount.findMany({
            where,
            include: {
                targetProduct: {
                    select: {
                        productId: true,
                        name: true
                    }
                }
            },
            orderBy: {
                discountId: "asc"
            }
        });

    }

    // Get discount by ID
    static async getDiscountById(discountId) {

        discountId = Number(discountId);

        if (isNaN(discountId)) {
            throw new ValidationError("Invalid discount id.");
        }

        const discount = await prisma.discount.findUnique({
            where: {
                discountId
            },
            include: {
                targetProduct: {
                    select: {
                        productId: true,
                        name: true
                    }
                }
            }
        });

        if (!discount) {
            throw new NotFoundError("Discount not found.");
        }

        return discount;
    }

    // Delete Discount
    static async deleteDiscount(discountId) {
        discountId = Number(discountId);

        if (isNaN(discountId)) {
            throw new ValidationError("Invalid discount id.");
        }

        await this.getDiscountById(discountId);

        return await prisma.discount.delete({
            where: {
                discountId
            }
        });
    }
}

module.exports = {
    DiscountModel,
    ValidationError,
    NotFoundError
};