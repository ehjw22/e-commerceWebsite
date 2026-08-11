// routes/discountRoutes.js

const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/discountController");
const { ensureAuthenticated } = require("../middleware/auth");

// GET /discounts
router.get("/", ensureAuthenticated, DiscountController.getDiscounts);

// GET /discounts/:id
router.get("/:id", ensureAuthenticated, DiscountController.getDiscountById);

module.exports = router;