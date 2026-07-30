/*
  Warnings:

  - You are about to drop the `cart_discount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cart_discount" DROP CONSTRAINT "cart_discount_cart_id_fkey";

-- DropForeignKey
ALTER TABLE "cart_discount" DROP CONSTRAINT "cart_discount_discount_id_fkey";

-- AlterTable
ALTER TABLE "sale_order" ADD COLUMN     "final_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "cart_discount";

-- CreateTable
CREATE TABLE "sale_discount" (
    "sale_order_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,

    CONSTRAINT "sale_discount_pkey" PRIMARY KEY ("sale_order_id","discount_id")
);

-- AddForeignKey
ALTER TABLE "sale_discount" ADD CONSTRAINT "sale_discount_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "sale_order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_discount" ADD CONSTRAINT "sale_discount_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discount"("discount_id") ON DELETE CASCADE ON UPDATE NO ACTION;
