const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
            if (discount.discountType === "PRODUCT_QUANTITY") {
                const item =
                    items.find(
                        c =>
                            c.productId ===
                            discount.targetProductId
                    );
                if (!item)
                    continue;
                if ( item.quantity >= Number(discount.minTrigger)) {
                    const amount = Number(item.product.price) * item.quantity * Number(discount.value) / 100;
                    totalDiscount += amount;

                    appliedDiscounts.push({
                        discountId:
                            discount.discountId,
                        name:
                            discount.name,
                        amount
                    });
                }
            }

            if (discount.discountType === "CART_TOTAL") {
                if (subtotal >= Number(discount.minTrigger)) {
                    
                    const amount = subtotal * Number(discount.value)/100;
                    totalDiscount += amount;
                    
                    appliedDiscounts.push({
                        discountId:
                            discount.discountId,
                        name:
                            discount.name,
                        amount
                    });
                }
            }

            if (discount.discountType === "DELIVERY") {

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
}

module.exports = { DiscountModel };