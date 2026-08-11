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

        let items = cartItems ?? cart.cartItem;

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
        const baseDeliveryFee = Number(baseDeliveryDiscount.value)

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
                if (item.quantity < Number(discount.minTrigger))
                    continue;

                const highestTier = availableDiscounts
                    .filter(d =>
                        d.discountType === DISCOUNT_TYPES.PRODUCT_QUANTITY &&
                        d.targetProductId === discount.targetProductId &&
                        item.quantity >= Number(d.minTrigger)
                    ).sort((a, b) => Number(b.minTrigger) - Number(a.minTrigger))[0];

                // Skip lower tiers
                if (discount.discountId !== highestTier.discountId)
                    continue;
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

                const applicableDeliveryTiers = availableDiscounts
                    .filter(d =>
                        d.discountType === DISCOUNT_TYPES.DELIVERY &&
                        subtotal >= Number(d.minTrigger) &&
                        subtotal <= (
                            d.maxTrigger == null
                                ? Infinity
                                : Number(d.maxTrigger)
                        )
                    ).sort((a, b) => Number(b.minTrigger) - Number(a.minTrigger));

                // Get the highest applicable delivery tier
                const highestTier = applicableDeliveryTiers[0];

                // Only process the highest applicable tier
                if (discount.discountId !== highestTier.discountId) {
                    continue;
                }

                // Apply the selected delivery fee
                deliveryFee = Number(highestTier.value);

                // Calculate how much was saved compared to base fee
                const deliverySavings = baseDeliveryFee - deliveryFee;

                appliedDiscounts.push({
                    discountId: highestTier.discountId,
                    name: highestTier.name,
                    amount: deliverySavings,
                    originalFee: baseDeliveryFee,
                    finalFee: deliveryFee,
                    discountType: DISCOUNT_TYPES.DELIVERY
                });
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

    // Validation for discount data
    static validateDiscount(data) {
        if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(data.valueType)) {
            throw new ValidationError("Invalid discount value type.");
        }

        if (!data.name?.trim()) {
            throw new ValidationError("Discount name is required.");
        }

        if (!Object.values(DISCOUNT_TYPES).includes(data.discountType)) {
            throw new ValidationError("Invalid discount type.");
        }

        if (Number(data.minTrigger) < 0) {
            throw new ValidationError("Minimum trigger cannot be negative.");
        }

        if (data.maxTrigger !== "" && data.maxTrigger != null && Number(data.maxTrigger) < Number(data.minTrigger)) {
            throw new ValidationError("Maximum trigger cannot be smaller than minimum trigger.");
        }

        if (Number(data.value) < 0) {
            throw new ValidationError("Discount value cannot be negative.");
        }

        if (data.discountType === DISCOUNT_TYPES.PRODUCT_QUANTITY && !data.targetProductId) {
            throw new ValidationError("Target product is required.");
        }
    }

    // Building the discount data such that it is the correct format
    static buildDiscountData(data) {
        return {
            name: data.name.trim(),
            description: data.description || null,
            discountType: data.discountType,
            minTrigger: Number(data.minTrigger),
            maxTrigger: data.maxTrigger === "" || data.maxTrigger == null ? null : Number(data.maxTrigger),
            value: Number(data.value),
            valueType: data.valueType,
            targetProductId: data.discountType === DISCOUNT_TYPES.PRODUCT_QUANTITY ? Number(data.targetProductId) : null,
            isActive: data.isActive ?? true
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

    // Create discount
    static async createDiscount(data) {
        this.validateDiscount(data);

        return await prisma.discount.create({
            data: this.buildDiscountData(data)
        });
    }

    // Updating discount by ID
    static async updateDiscount(discountId, data) {
        discountId = Number(discountId);

        if (isNaN(discountId)) {
            throw new ValidationError("Invalid discount id.");
        }

        await this.getDiscountById(discountId);

        this.validateDiscount(data);

        return await prisma.discount.update({
            where: {
                discountId
            },
            data: this.buildDiscountData(data)
        });
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