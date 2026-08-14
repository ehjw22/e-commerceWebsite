// routes/discountRoutes.js

const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/discountController");
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

// GET /discounts
router.get("/", ensureAuthenticated, DiscountController.getDiscounts);

// GET /discounts/:id
router.get("/:id", ensureAuthenticated, DiscountController.getDiscountById);

// POST /discounts
router.post("/", ensureAuthenticated, ensureAdmin, DiscountController.createDiscount);

// PUT /discounts/:id
router.put("/:id", ensureAuthenticated, ensureAdmin,  DiscountController.updateDiscount);

// DELETE /discounts/:id
router.delete("/:id", ensureAuthenticated, ensureAdmin,  DiscountController.deleteDiscount);

module.exports = router;