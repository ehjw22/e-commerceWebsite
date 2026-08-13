/*
  Warnings:

  - Changed the type of `discount_type` on the `discount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `value_type` on the `discount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PRODUCT_QUANTITY', 'CART_TOTAL', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "discount"
ALTER COLUMN "discount_type" TYPE "DiscountType"
USING "discount_type"::"DiscountType";

ALTER TABLE "discount"
ALTER COLUMN "value_type" TYPE "ValueType"
USING "value_type"::"ValueType";