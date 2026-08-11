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

    // GET /:id (Retrieve one discount)
    static async getDiscountById(req, res) {
        try {
            const discount = await DiscountModel.getDiscountById(req.params.id);

            res.json({
                success: true,
                data: discount
            });
        } catch (error) {
            DiscountController.handleError(
                res,
                error,
                "Failed to retrieve discount."
            );
        }
    }

    // POST / (Create new discount)
    static async createDiscount(req, res) {
        try {
            const discount = await DiscountModel.createDiscount(req.body);

            res.status(201).json({
                success: true,
                message: "Discount created successfully.",
                data: discount
            });
        } catch (error) {
            DiscountController.handleError(
                res,
                error,
                "Failed to create discount."
            );
        }
    }

    // PUT /:id (Update discount)
    static async updateDiscount(req, res) {
        try {
            const discount = await DiscountModel.updateDiscount(req.params.id, req.body);

            res.json({
                success: true,
                message: "Discount updated successfully.",
                data: discount
            });
        } catch (error) {
            DiscountController.handleError(
                res,
                error,
                "Failed to update discount."
            );
        }
    }

    // DELETE /:id (Delete discount)
    static async deleteDiscount(req, res) {
        try {
            await DiscountModel.deleteDiscount(req.params.id);

            res.json({
                success: true,
                message: "Discount deleted successfully."
            });
        } catch (error) {
            DiscountController.handleError(
                res,
                error,
                "Failed to delete discount."
            );
        }
    }

}

module.exports = DiscountController;