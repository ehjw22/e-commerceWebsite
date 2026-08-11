// routes/discountRoutes.js

const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/discountController");
const { ensureAuthenticated } = require("../middleware/auth");

// GET /discounts
router.get("/", ensureAuthenticated, DiscountController.getDiscounts);

module.exports = router;