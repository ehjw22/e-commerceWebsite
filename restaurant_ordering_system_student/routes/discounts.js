// routes/discountRoutes.js

const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/discountController");
const { ensureAuthenticated } = require("../middleware/auth");

// GET /discounts
router.get("/", ensureAuthenticated, DiscountController.getDiscounts);

// GET /discounts/:id
router.get("/:id", ensureAuthenticated, DiscountController.getDiscountById);

// POST /discounts
router.post("/", ensureAuthenticated, DiscountController.createDiscount);

// DELETE /discounts/:id
router.delete("/:id", ensureAuthenticated, DiscountController.deleteDiscount);

module.exports = router;