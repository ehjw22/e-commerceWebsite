// controllers/discountController.js

const {DiscountModel, ValidationError, NotFoundError} = require("../models/discountModel");

class DiscountController {
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

    // GET / (Retrieve all discounts)
    static async getDiscounts(req, res) {
        try {
            const discounts = await DiscountModel.getDiscounts(req.query);

            res.json({
                success: true,
                data: discounts
            });
        } catch (error) {
            DiscountController.handleError(
                res,
                error,
                "Failed to retrieve discounts."
            );
        }
    }
}

module.exports = DiscountController;